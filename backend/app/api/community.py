from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user, optional_auth
from app.db.database import posts_collection, user_context_collection, user_skills_collection, users_collection
from app.schemas import (
    CommentCreate,
    CommentResponse,
    PostComment,
    PostCreate,
    PostResponse,
    PostUpdate,
)

router = APIRouter(prefix="/community", tags=["Community"])

_indexes_initialized = False


def _ensure_indexes() -> None:
    global _indexes_initialized
    if _indexes_initialized:
        return

    posts_collection.create_index([("type", 1), ("created_at", -1)])
    posts_collection.create_index([("skill_tags", 1), ("created_at", -1)])
    posts_collection.create_index([("company", 1), ("created_at", -1)])
    posts_collection.create_index([("likes", -1)])
    _indexes_initialized = True


def _to_post_response(post: dict) -> PostResponse:
    comments = [
        PostComment(
            user_id=str(c.get("user_id", "")),
            content=c.get("content", ""),
            created_at=c.get("created_at", datetime.utcnow()),
        )
        for c in post.get("comments", [])
    ]

    return PostResponse(
        id=str(post["_id"]),
        author_id=str(post.get("author_id", "")),
        author_name=post.get("author_name", "Unknown"),
        title=post.get("title", ""),
        content=post.get("content", ""),
        type=post.get("type", "career_question"),
        skill_tags=post.get("skill_tags", []),
        company=post.get("company"),
        role=post.get("role"),
        experience_level=post.get("experience_level"),
        likes=post.get("likes", 0),
        category=post.get("category", post.get("type")),
        tags=post.get("tags", post.get("skill_tags", [])),
        upvotes=post.get("upvotes", post.get("likes", 0)),
        comment_count=post.get("comment_count", len(post.get("comments", []))),
        comments=comments,
        created_at=post.get("created_at", datetime.utcnow()),
        updated_at=post.get("updated_at"),
    )


def _get_author_name(email: str) -> str:
    user = users_collection.find_one({"email": email})
    return user.get("name", email) if user else email


def _validate_company_experience_fields(
    post_type: str,
    company: Optional[str],
    role: Optional[str],
    experience_level: Optional[str],
) -> None:
    if post_type != "company_experience":
        return
    if not company:
        raise HTTPException(status_code=400, detail="company is required for company_experience posts")
    if not role:
        raise HTTPException(status_code=400, detail="role is required for company_experience posts")
    if not experience_level:
        raise HTTPException(status_code=400, detail="experience_level is required for company_experience posts")


def _validate_skill_tags(skill_tags: List[str]) -> List[str]:
    cleaned = sorted({s.strip().lower() for s in skill_tags if s and s.strip()})
    if not cleaned:
        raise HTTPException(status_code=400, detail="skill_tags must contain at least one value")
    return cleaned


def _build_filter_query(
    type: Optional[str] = None,
    skill_tag: Optional[str] = None,
    company: Optional[str] = None,
) -> dict:
    query: dict = {}
    if type:
        query["type"] = type
    if skill_tag:
        query["skill_tags"] = skill_tag.strip().lower()
    if company:
        query["company"] = {"$regex": f"^{company.strip()}$", "$options": "i"}
    return query


@router.post("/posts", response_model=PostResponse)
def create_post(
    post: PostCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a structured community post."""
    _ensure_indexes()
    post_type = post.type or post.category
    if post_type not in {"career_question", "company_experience", "role_guidance", "project_showcase"}:
        raise HTTPException(status_code=400, detail="type is required and must be a valid structured post type")

    merged_skill_tags = post.skill_tags if post.skill_tags is not None else (post.tags or [])
    skill_tags = _validate_skill_tags(merged_skill_tags)
    _validate_company_experience_fields(
        post_type=post_type,
        company=post.company,
        role=post.role,
        experience_level=post.experience_level,
    )

    email = current_user.get("email")
    user_id = current_user.get("user_id")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id in token")

    now = datetime.utcnow()
    post_doc = {
        "title": post.title.strip(),
        "content": post.content.strip(),
        "type": post_type,
        "author_id": ObjectId(user_id),
        "author_name": _get_author_name(email),
        "skill_tags": skill_tags,
        "company": post.company.strip() if post.company else None,
        "role": post.role.strip() if post.role else None,
        "experience_level": post.experience_level.strip() if post.experience_level else None,
        "likes": 0,
        "comments": [],
        "created_at": now,
        "updated_at": now,
        # Backward-compat fields used by existing frontend
        "category": post_type,
        "tags": skill_tags,
        "user_id": user_id,
        "email": email,
        "upvotes": 0,
        "comment_count": 0,
    }

    result = posts_collection.insert_one(post_doc)
    created = posts_collection.find_one({"_id": result.inserted_id})
    return _to_post_response(created)


@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    type: Optional[str] = Query(None),
    skill_tag: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    """Get community posts with structured filtering."""
    _ensure_indexes()
    query = _build_filter_query(type=type, skill_tag=skill_tag, company=company)
    posts = list(posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [_to_post_response(p) for p in posts]


@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return _to_post_response(post)


@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    current_user_id = current_user.get("user_id")
    if str(post.get("author_id")) != str(current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    update_data: dict = {"updated_at": datetime.utcnow()}
    if post_update.title is not None:
        update_data["title"] = post_update.title.strip()
    if post_update.content is not None:
        update_data["content"] = post_update.content.strip()
    if post_update.type is not None or post_update.category is not None:
        next_type = post_update.type or post_update.category
        update_data["type"] = next_type
        update_data["category"] = next_type
    if post_update.skill_tags is not None:
        update_data["skill_tags"] = _validate_skill_tags(post_update.skill_tags)
        update_data["tags"] = update_data["skill_tags"]
    elif post_update.tags is not None:
        update_data["skill_tags"] = _validate_skill_tags(post_update.tags)
        update_data["tags"] = update_data["skill_tags"]
    if post_update.company is not None:
        update_data["company"] = post_update.company.strip() if post_update.company else None
    if post_update.role is not None:
        update_data["role"] = post_update.role.strip() if post_update.role else None
    if post_update.experience_level is not None:
        update_data["experience_level"] = (
            post_update.experience_level.strip() if post_update.experience_level else None
        )

    candidate_type = update_data.get("type", post.get("type"))
    candidate_company = update_data.get("company", post.get("company"))
    candidate_role = update_data.get("role", post.get("role"))
    candidate_level = update_data.get("experience_level", post.get("experience_level"))
    if candidate_type == "company_experience" and (
        not candidate_company or not candidate_role or not candidate_level
    ):
        raise HTTPException(
            status_code=400,
            detail="company, role, and experience_level are required for company_experience posts",
        )

    posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_data})
    updated = posts_collection.find_one({"_id": ObjectId(post_id)})
    return _to_post_response(updated)


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    current_user_id = current_user.get("user_id")
    if str(post.get("author_id")) != str(current_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    posts_collection.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted successfully"}


@router.post("/posts/{post_id}/comment", response_model=CommentResponse)
def add_comment(
    post_id: str,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    email = current_user.get("email")
    user_id = current_user.get("user_id")
    comment_doc = {
        "id": str(ObjectId()),
        "user_id": user_id,
        "author_name": _get_author_name(email),
        "content": comment.content.strip(),
        "created_at": datetime.utcnow(),
    }

    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {
            "$push": {"comments": comment_doc},
            "$inc": {"comment_count": 1},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    return CommentResponse(
        id=comment_doc["id"],
        user_id=comment_doc["user_id"],
        author_name=comment_doc["author_name"],
        content=comment_doc["content"],
        created_at=comment_doc["created_at"],
    )


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = sorted(post.get("comments", []), key=lambda c: c.get("created_at", datetime.utcnow()))
    return [
        CommentResponse(
            id=str(c.get("id", "")),
            user_id=str(c.get("user_id", "")),
            author_name=c.get("author_name", "Unknown"),
            content=c.get("content", ""),
            created_at=c.get("created_at", datetime.utcnow()),
        )
        for c in comments
    ]


@router.post("/posts/{post_id}/like")
def like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post id")

    result = posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {
            "$inc": {"likes": 1, "upvotes": 1},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")

    return {"message": "Post liked"}


@router.get("/hub/{skill_name}", response_model=List[PostResponse])
def get_skill_hub(
    skill_name: str,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    query = {"skill_tags": skill_name.strip().lower()}
    posts = list(posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [_to_post_response(p) for p in posts]


@router.get("/company/{company_name}", response_model=List[PostResponse])
def get_company_threads(
    company_name: str,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    query = {
        "type": "company_experience",
        "company": {"$regex": f"^{company_name.strip()}$", "$options": "i"},
    }
    posts = list(posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [_to_post_response(p) for p in posts]


@router.get("/recommended", response_model=List[PostResponse])
def get_recommended_posts(
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    email = current_user.get("email")
    user_skills_doc = user_skills_collection.find_one({"email": email}) or {}

    raw_skills = user_skills_doc.get("skills", [])
    user_skills = {
        (s.get("skill") if isinstance(s, dict) else str(s)).strip().lower()
        for s in raw_skills
        if (s.get("skill") if isinstance(s, dict) else str(s)).strip()
    }

    if not user_skills:
        context_doc = user_context_collection.find_one({"email": email}) or {}
        interests = context_doc.get("interests", [])
        user_skills = {str(s).strip().lower() for s in interests if str(s).strip()}

    posts = list(posts_collection.find({}).sort("created_at", -1).limit(300))
    if not user_skills:
        latest = posts[:20]
        return [_to_post_response(p) for p in latest]

    now = datetime.now(timezone.utc)
    ranked = []
    for post in posts:
        post_skills = {s.lower() for s in post.get("skill_tags", [])}
        overlap = len(post_skills & user_skills)
        if overlap == 0:
            continue

        likes = int(post.get("likes", post.get("upvotes", 0)))
        created_at = post.get("created_at")
        if created_at is None:
            age_days = 365.0
        else:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            age_days = max((now - created_at).total_seconds() / 86400.0, 0.0)

        recency_score = max(0.0, 30.0 - age_days) / 30.0
        score = (overlap * 4.0) + (likes * 0.3) + recency_score
        ranked.append((score, post))

    ranked.sort(key=lambda x: x[0], reverse=True)
    top_posts = [p for _, p in ranked[:20]]
    return [_to_post_response(p) for p in top_posts]


# -----------------------------
# Backward-compatible aliases
# -----------------------------
@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment_alias(
    post_id: str,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    return add_comment(post_id=post_id, comment=comment, current_user=current_user)


@router.post("/posts/{post_id}/upvote")
def upvote_post_alias(
    post_id: str,
    current_user: dict = Depends(get_current_user),
):
    return like_post(post_id=post_id, current_user=current_user)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: str,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    post = posts_collection.find_one({"comments.id": comment_id})
    if not post:
        raise HTTPException(status_code=404, detail="Comment not found")

    comments = post.get("comments", [])
    user_id = current_user.get("user_id")
    updated_comment = None
    for item in comments:
        if str(item.get("id")) == comment_id:
            if str(item.get("user_id")) != str(user_id):
                raise HTTPException(status_code=403, detail="Not authorized to update this comment")
            item["content"] = comment.content.strip()
            updated_comment = item
            break

    if not updated_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    posts_collection.update_one(
        {"_id": post["_id"]},
        {"$set": {"comments": comments, "updated_at": datetime.utcnow()}},
    )
    return CommentResponse(
        id=str(updated_comment.get("id")),
        user_id=str(updated_comment.get("user_id")),
        author_name=updated_comment.get("author_name", "Unknown"),
        content=updated_comment.get("content", ""),
        created_at=updated_comment.get("created_at", datetime.utcnow()),
    )


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    post = posts_collection.find_one({"comments.id": comment_id})
    if not post:
        raise HTTPException(status_code=404, detail="Comment not found")

    user_id = current_user.get("user_id")
    comments = post.get("comments", [])
    kept = []
    removed = None
    for item in comments:
        if str(item.get("id")) == comment_id:
            removed = item
            continue
        kept.append(item)

    if not removed:
        raise HTTPException(status_code=404, detail="Comment not found")
    if str(removed.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    posts_collection.update_one(
        {"_id": post["_id"]},
        {
            "$set": {"comments": kept, "updated_at": datetime.utcnow()},
            "$inc": {"comment_count": -1},
        },
    )
    return {"message": "Comment deleted successfully"}


@router.post("/comments/{comment_id}/upvote")
def upvote_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Embedded comments currently do not track per-comment likes in schema.
    # Keep endpoint for compatibility.
    post = posts_collection.find_one({"comments.id": comment_id})
    if not post:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment upvoted"}
