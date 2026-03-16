from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.canonical_skill_store import CANONICAL_OCCUPATION_SKILLS
from app.core.deps import get_current_user, optional_auth
from app.db.database import (
    collaboration_projects_collection,
    collaboration_requests_collection,
    comments_collection,
    posts_collection,
    private_messages_collection,
    user_context_collection,
    user_skills_collection,
    users_collection,
    votes_collection,
)
from app.schemas import (
    CommentCreate,
    CommentResponse,
    PostDetailResponse,
    PostListResponse,
    PostCreate,
    PostUpdate,
    ReplyCreate,
    VoteRequest,
)

router = APIRouter(prefix="/community", tags=["Community"])

_indexes_initialized = False
_PUBLIC_POST_TYPES = {"career_question", "company_experience", "role_guidance", "project_showcase"}


def _ensure_indexes() -> None:
    global _indexes_initialized
    if _indexes_initialized:
        return

    posts_collection.create_index([("created_at", -1)])
    posts_collection.create_index([("skill_tags", 1), ("created_at", -1)])
    posts_collection.create_index([("upvotes_count", -1), ("comment_count", -1)])

    comments_collection.create_index([("post_id", 1), ("parent_comment_id", 1), ("created_at", 1)])
    votes_collection.create_index([("post_id", 1), ("user_id", 1)], unique=True)
    votes_collection.create_index([("post_id", 1), ("created_at", -1)])

    private_messages_collection.create_index([("sender_id", 1), ("receiver_id", 1), ("created_at", -1)])
    private_messages_collection.create_index([("receiver_id", 1), ("created_at", -1)])

    _indexes_initialized = True


def _utcnow() -> datetime:
    return datetime.utcnow()


def _get_author_name(email: str) -> str:
    user = users_collection.find_one({"email": email})
    return user.get("name", email) if user else email


def _normalize_skills(skills: List[str]) -> List[str]:
    cleaned = sorted({str(s).strip().lower() for s in (skills or []) if str(s).strip()})
    if not cleaned:
        raise HTTPException(status_code=400, detail="skill_tags must contain at least one canonical skill")
    return cleaned


def _extract_user_skill_set(email: str) -> set[str]:
    user_skills_doc = user_skills_collection.find_one({"email": email}) or {}
    raw_skills = user_skills_doc.get("skills", [])
    skills = {
        str((s.get("normalized_key") if isinstance(s, dict) else s)).strip().lower()
        for s in raw_skills
        if str((s.get("normalized_key") if isinstance(s, dict) else s)).strip()
    }
    if skills:
        return skills

    ctx = user_context_collection.find_one({"email": email}) or {}
    interests = ctx.get("interests", [])
    return {str(i).strip().lower() for i in interests if str(i).strip()}


def _serialize_comments(post_id: str) -> list[CommentResponse]:
    comments = list(comments_collection.find({"post_id": post_id}).sort("created_at", 1))
    return [
        CommentResponse(
            id=str(c.get("_id")),
            author=str(c.get("author_name", "Unknown")),
            content=str(c.get("content", "")),
            created_at=c.get("created_at", _utcnow()),
            replies=[],
        )
        for c in comments
    ]


def _serialize_comment_tree(post_id: str) -> list[CommentResponse]:
    main_comments = list(
        comments_collection.find({"post_id": post_id, "parent_comment_id": None}).sort("created_at", 1)
    )
    if not main_comments:
        return []

    main_ids = [str(c.get("_id")) for c in main_comments]
    replies = list(
        comments_collection.find(
            {"post_id": post_id, "parent_comment_id": {"$in": main_ids}}
        ).sort("created_at", 1)
    )

    by_parent: dict[str, list[CommentResponse]] = {}
    for r in replies:
        parent_id = str(r.get("parent_comment_id", ""))
        by_parent.setdefault(parent_id, []).append(
            CommentResponse(
                id=str(r.get("_id")),
                content=str(r.get("content", "")),
                author=str(r.get("author_name", "Unknown")),
                created_at=r.get("created_at", _utcnow()),
                replies=[],
            )
        )

    tree: list[CommentResponse] = []
    for c in main_comments:
        cid = str(c.get("_id"))
        tree.append(
            CommentResponse(
                id=cid,
                content=str(c.get("content", "")),
                author=str(c.get("author_name", "Unknown")),
                created_at=c.get("created_at", _utcnow()),
                replies=by_parent.get(cid, []),
            )
        )
    return tree


def _to_post_list_response(post: dict) -> PostListResponse:
    post_id = str(post["_id"])
    upvotes_count = int(post.get("upvotes_count", post.get("upvotes", post.get("likes", 0))))
    total_comments = comments_collection.count_documents({"post_id": post_id})
    downvotes_count = int(post.get("downvotes_count", 0))
    return PostListResponse(
        id=post_id,
        title=post.get("title", ""),
        author=post.get("author_name", "Unknown"),
        created_at=post.get("created_at", _utcnow()),
        updated_at=post.get("updated_at"),
        comment_count=int(total_comments),
        upvotes=upvotes_count,
        downvotes=downvotes_count,
        skill_tags=post.get("skill_tags", []),
    )


def _to_post_detail_response(post: dict) -> PostDetailResponse:
    base = _to_post_list_response(post)
    comments = _serialize_comment_tree(str(post["_id"]))
    return PostDetailResponse(
        id=base.id,
        title=base.title,
        author=base.author,
        created_at=base.created_at,
        updated_at=base.updated_at,
        comment_count=base.comment_count,
        upvotes=base.upvotes,
        downvotes=base.downvotes,
        skill_tags=base.skill_tags,
        content=post.get("content", ""),
        comments=comments,
    )


def _canonical_skill_tags() -> list[str]:
    tags: set[str] = set()
    for role_data in CANONICAL_OCCUPATION_SKILLS.values():
        for s in role_data.get("skills", []):
            value = str(s).strip().lower()
            if value:
                tags.add(value)
    return sorted(tags)


def _validate_comment_content(content: str) -> str:
    text = str(content or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="Comment content exceeds 1000 characters")
    return text


def _post_sort_score(post: dict, sort_by: str, user_skills: set[str]) -> float:
    now = datetime.now(timezone.utc)
    created_at = post.get("created_at", _utcnow())
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_hours = max((now - created_at).total_seconds() / 3600.0, 0.0)
    recency = max(0.0, 168.0 - age_hours) / 168.0

    upvotes = int(post.get("upvotes_count", post.get("upvotes", post.get("likes", 0))))
    comments = int(post.get("comment_count", 0))
    if sort_by == "latest":
        base = recency * 100.0
    elif sort_by == "most_commented":
        base = comments * 3.0 + recency
    else:
        base = upvotes * 2.0 + comments * 1.2 + recency

    post_skills = {str(s).strip().lower() for s in post.get("skill_tags", [])}
    overlap = len(post_skills & user_skills) if user_skills else 0
    return base + (overlap * 5.0)


def _is_allowed_private_contact(current_user_id: str, other_user_id: str) -> bool:
    if current_user_id == other_user_id:
        return False

    # Project members / creators.
    member_query = {
        "$or": [
            {"created_by": current_user_id, "current_members": other_user_id},
            {"created_by": other_user_id, "current_members": current_user_id},
            {"current_members": {"$all": [current_user_id, other_user_id]}},
        ]
    }
    if collaboration_projects_collection.find_one(member_query):
        return True

    # Join request participants (requester <-> project creator).
    project_ids = set()
    for req in collaboration_requests_collection.find(
        {"$or": [{"requester_id": current_user_id}, {"requester_id": other_user_id}]},
        {"project_id": 1},
    ):
        pid = str(req.get("project_id", "")).strip()
        if pid:
            project_ids.add(pid)

    if not project_ids:
        return False

    for pid in project_ids:
        project = collaboration_projects_collection.find_one({"_id": ObjectId(pid)}) if ObjectId.is_valid(pid) else None
        if not project:
            continue
        creator_id = str(project.get("created_by", ""))
        has_request_pair = collaboration_requests_collection.find_one(
            {
                "project_id": pid,
                "$or": [
                    {"requester_id": current_user_id, "status": {"$in": ["Pending", "Accepted", "Rejected"]}},
                    {"requester_id": other_user_id, "status": {"$in": ["Pending", "Accepted", "Rejected"]}},
                ],
            }
        )
        if not has_request_pair:
            continue
        if {creator_id, current_user_id} == {current_user_id, other_user_id}:
            return True
        if {creator_id, other_user_id} == {current_user_id, other_user_id}:
            return True

    return False


@router.get("/skill-tags")
def list_skill_tags(
    q: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    tags = _canonical_skill_tags()
    if q:
        qn = q.strip().lower()
        tags = [t for t in tags if qn in t]
    return {"skill_tags": tags[:limit]}


@router.post("/posts", response_model=PostDetailResponse)
def create_post(
    post: PostCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    skill_tags = _normalize_skills(post.skill_tags or post.tags or [])
    email = current_user.get("email")
    user_id = current_user.get("user_id")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id in token")

    now = _utcnow()
    post_doc = {
        "title": post.title.strip(),
        "content": post.content.strip(),
        "type": post.type or "career_question",
        "author_id": ObjectId(user_id),
        "author_name": _get_author_name(email),
        "skill_tags": skill_tags,
        "upvotes_count": 0,
        "downvotes_count": 0,
        "comment_count": 0,
        "created_at": now,
        "updated_at": now,
        # Backward compatibility fields.
        "likes": 0,
        "upvotes": 0,
        "category": post.type or "career_question",
        "tags": skill_tags,
    }
    result = posts_collection.insert_one(post_doc)
    created = posts_collection.find_one({"_id": result.inserted_id})
    return _to_post_detail_response(created)


@router.get("/posts", response_model=List[PostListResponse])
def get_posts(
    skill_tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("trending", regex="^(trending|latest|most_commented)$"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    query: dict = {"type": {"$in": sorted(_PUBLIC_POST_TYPES)}}
    if skill_tag:
        query["skill_tags"] = skill_tag.strip().lower()
    if search:
        pattern = search.strip()
        query["$or"] = [{"title": {"$regex": pattern, "$options": "i"}}, {"content": {"$regex": pattern, "$options": "i"}}]

    posts = list(posts_collection.find(query).limit(400))
    user_skills: set[str] = set()
    if current_user:
        user_skills = _extract_user_skill_set(current_user.get("email", ""))

    ranked = sorted(posts, key=lambda p: _post_sort_score(p, sort_by, user_skills), reverse=True)
    paged = ranked[skip : skip + limit]
    return [_to_post_list_response(p) for p in paged]


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
def get_post(
    post_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(post.get("type", "")).strip() not in _PUBLIC_POST_TYPES:
        raise HTTPException(status_code=404, detail="Post not found")
    return _to_post_detail_response(post)


@router.put("/posts/{post_id}", response_model=PostDetailResponse)
def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(post.get("author_id")) != str(current_user.get("user_id")):
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    update_data: dict = {"updated_at": _utcnow()}
    if post_update.title is not None:
        update_data["title"] = post_update.title.strip()
    if post_update.content is not None:
        update_data["content"] = post_update.content.strip()
    if post_update.skill_tags is not None or post_update.tags is not None:
        update_data["skill_tags"] = _normalize_skills(post_update.skill_tags or post_update.tags or [])
        update_data["tags"] = update_data["skill_tags"]

    posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_data})
    updated = posts_collection.find_one({"_id": ObjectId(post_id)})
    return _to_post_detail_response(updated)


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(post.get("author_id")) != str(current_user.get("user_id")):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    posts_collection.delete_one({"_id": ObjectId(post_id)})
    comments_collection.delete_many({"post_id": post_id})
    votes_collection.delete_many({"post_id": post_id})
    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/comment", response_model=CommentResponse)
def add_comment(
    post_id: str,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")
    if not posts_collection.find_one({"_id": ObjectId(post_id)}):
        raise HTTPException(status_code=404, detail="Post not found")

    email = current_user.get("email")
    user_id = current_user.get("user_id")
    now = _utcnow()
    content = _validate_comment_content(comment.content)
    comment_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_name": _get_author_name(email),
        "content": content,
        "parent_comment_id": None,
        "created_at": now,
    }
    result = comments_collection.insert_one(comment_doc)
    posts_collection.update_one({"_id": ObjectId(post_id)}, {"$inc": {"comment_count": 1}, "$set": {"updated_at": now}})
    return CommentResponse(
        id=str(result.inserted_id),
        author=comment_doc["author_name"],
        content=comment_doc["content"],
        created_at=now,
        replies=[],
    )


@router.post("/posts/{post_id}/reply", response_model=CommentResponse)
def add_reply(
    post_id: str,
    payload: ReplyCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")
    if not posts_collection.find_one({"_id": ObjectId(post_id)}):
        raise HTTPException(status_code=404, detail="Post not found")

    parent_id = str(payload.parent_comment_id or "").strip()
    if not ObjectId.is_valid(parent_id):
        raise HTTPException(status_code=400, detail="Invalid parent_comment_id")

    parent_comment = comments_collection.find_one({"_id": ObjectId(parent_id), "post_id": post_id})
    if not parent_comment:
        raise HTTPException(status_code=400, detail="parent_comment_id must belong to the same post")
    if parent_comment.get("parent_comment_id") is not None:
        raise HTTPException(status_code=400, detail="Replies can only target a main comment")

    content = _validate_comment_content(payload.content)
    now = _utcnow()
    user_id = current_user.get("user_id")
    email = current_user.get("email")
    reply_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_name": _get_author_name(email),
        "content": content,
        "parent_comment_id": parent_id,
        "created_at": now,
    }
    result = comments_collection.insert_one(reply_doc)
    posts_collection.update_one({"_id": ObjectId(post_id)}, {"$inc": {"comment_count": 1}, "$set": {"updated_at": now}})
    return CommentResponse(
        id=str(result.inserted_id),
        author=reply_doc["author_name"],
        content=reply_doc["content"],
        created_at=now,
        replies=[],
    )


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")
    if not posts_collection.find_one({"_id": ObjectId(post_id)}):
        raise HTTPException(status_code=404, detail="Post not found")
    return _serialize_comments(post_id)


@router.post("/posts/{post_id}/vote")
def vote_post(
    post_id: str,
    vote: VoteRequest,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")
    if not posts_collection.find_one({"_id": ObjectId(post_id)}):
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = str(current_user.get("user_id"))
    existing = votes_collection.find_one({"post_id": post_id, "user_id": user_id})
    now = _utcnow()
    new_type = vote.vote_type

    if not existing:
        votes_collection.insert_one({"post_id": post_id, "user_id": user_id, "vote_type": new_type, "created_at": now})
        inc = {"upvotes_count": 1} if new_type == "upvote" else {"downvotes_count": 1}
        posts_collection.update_one({"_id": ObjectId(post_id)}, {"$inc": inc, "$set": {"updated_at": now}})
        return {"message": "Vote recorded"}

    old_type = existing.get("vote_type")
    if old_type == new_type:
        return {"message": "Vote unchanged"}

    votes_collection.update_one({"_id": existing["_id"]}, {"$set": {"vote_type": new_type, "created_at": now}})
    if old_type == "upvote":
        inc = {"upvotes_count": -1, "downvotes_count": 1}
    else:
        inc = {"downvotes_count": -1, "upvotes_count": 1}
    posts_collection.update_one({"_id": ObjectId(post_id)}, {"$inc": inc, "$set": {"updated_at": now}})
    return {"message": "Vote updated"}


@router.get("/private/conversations")
def get_private_conversations(current_user: dict = Depends(get_current_user)):
    _ensure_indexes()
    current_user_id = str(current_user.get("user_id"))

    participants: set[str] = set()
    member_projects = list(
        collaboration_projects_collection.find(
            {"$or": [{"created_by": current_user_id}, {"current_members": current_user_id}]},
            {"created_by": 1, "current_members": 1},
        )
    )
    for p in member_projects:
        creator = str(p.get("created_by", "")).strip()
        if creator and creator != current_user_id:
            participants.add(creator)
        for member in p.get("current_members", []):
            m = str(member).strip()
            if m and m != current_user_id:
                participants.add(m)

    my_requests = list(collaboration_requests_collection.find({"requester_id": current_user_id}, {"project_id": 1}))
    for req in my_requests:
        pid = str(req.get("project_id", "")).strip()
        if ObjectId.is_valid(pid):
            p = collaboration_projects_collection.find_one({"_id": ObjectId(pid)}, {"created_by": 1})
            if p:
                creator = str(p.get("created_by", "")).strip()
                if creator and creator != current_user_id:
                    participants.add(creator)

    created_projects = list(collaboration_projects_collection.find({"created_by": current_user_id}, {"_id": 1}))
    project_ids = [str(p["_id"]) for p in created_projects]
    if project_ids:
        creator_side_requests = list(
            collaboration_requests_collection.find({"project_id": {"$in": project_ids}}, {"requester_id": 1})
        )
        for req in creator_side_requests:
            requester = str(req.get("requester_id", "")).strip()
            if requester and requester != current_user_id:
                participants.add(requester)

    conversations = []
    for user_id in participants:
        if not _is_allowed_private_contact(current_user_id, user_id):
            continue
        user = users_collection.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        name = (user or {}).get("name", "Unknown")
        last = private_messages_collection.find_one(
            {
                "$or": [
                    {"sender_id": current_user_id, "receiver_id": user_id},
                    {"sender_id": user_id, "receiver_id": current_user_id},
                ]
            },
            sort=[("created_at", -1)],
        )
        conversations.append(
            {
                "user_id": user_id,
                "name": name,
                "last_message": (last or {}).get("content", ""),
                "last_message_at": (last or {}).get("created_at"),
            }
        )

    conversations.sort(key=lambda c: c.get("last_message_at") or datetime.min, reverse=True)
    return {"conversations": conversations}


@router.get("/private/messages/{other_user_id}")
def get_private_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    _ensure_indexes()
    current_user_id = str(current_user.get("user_id"))
    if not _is_allowed_private_contact(current_user_id, other_user_id):
        raise HTTPException(status_code=403, detail="Private messaging is allowed only for collaboration participants")

    docs = list(
        private_messages_collection.find(
            {
                "$or": [
                    {"sender_id": current_user_id, "receiver_id": other_user_id},
                    {"sender_id": other_user_id, "receiver_id": current_user_id},
                ]
            }
        ).sort("created_at", 1)
    )
    return {
        "messages": [
            {
                "id": str(d["_id"]),
                "sender_id": d.get("sender_id"),
                "receiver_id": d.get("receiver_id"),
                "content": d.get("content", ""),
                "created_at": d.get("created_at"),
            }
            for d in docs
        ]
    }


@router.post("/private/messages/{other_user_id}")
def send_private_message(
    other_user_id: str,
    payload: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    current_user_id = str(current_user.get("user_id"))
    if not _is_allowed_private_contact(current_user_id, other_user_id):
        raise HTTPException(status_code=403, detail="Private messaging is allowed only for collaboration participants")

    now = _utcnow()
    doc = {
        "sender_id": current_user_id,
        "receiver_id": other_user_id,
        "content": payload.content.strip(),
        "created_at": now,
    }
    result = private_messages_collection.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "sender_id": current_user_id,
        "receiver_id": other_user_id,
        "content": doc["content"],
        "created_at": now,
    }


# Backward-compatible aliases
@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment_alias(post_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    return add_comment(post_id=post_id, comment=comment, current_user=current_user)


@router.post("/posts/{post_id}/upvote")
def upvote_post_alias(post_id: str, current_user: dict = Depends(get_current_user)):
    return vote_post(post_id=post_id, vote=VoteRequest(vote_type="upvote"), current_user=current_user)
