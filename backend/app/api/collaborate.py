from datetime import datetime, timedelta
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user, optional_auth
from app.db.database import (
    collaboration_projects_collection,
    collaboration_requests_collection,
    opportunities_collection,
    user_context_collection,
    user_skills_collection,
    users_collection,
)
from app.schemas import (
    CollaborateOverviewResponse,
    CollaborationProjectCreate,
    CollaborationProjectResponse,
    CollaborationProjectUpdate,
    JoinRequestCreate,
    JoinRequestResponse,
    JoinRequestUpdate,
    OpportunityCreate,
    OpportunityResponse,
)

router = APIRouter(prefix="/collaborate", tags=["Collaborate"])

_indexes_initialized = False


def _ensure_indexes() -> None:
    global _indexes_initialized
    if _indexes_initialized:
        return

    collaboration_projects_collection.create_index([("status", 1), ("created_at", -1)])
    collaboration_projects_collection.create_index([("project_type", 1), ("status", 1)])
    collaboration_projects_collection.create_index([("required_skills", 1)])
    collaboration_projects_collection.create_index([("created_by", 1), ("created_at", -1)])
    collaboration_projects_collection.create_index([("deadline", 1)])

    collaboration_requests_collection.create_index([("project_id", 1), ("status", 1), ("created_at", -1)])
    collaboration_requests_collection.create_index([("requester_id", 1), ("created_at", -1)])
    collaboration_requests_collection.create_index(
        [("project_id", 1), ("requester_id", 1), ("status", 1)],
        name="project_requester_status_idx",
    )

    opportunities_collection.create_index([("type", 1), ("deadline", 1)])
    opportunities_collection.create_index([("is_featured", -1), ("deadline", 1)])

    _indexes_initialized = True


def _is_valid_object_id(value: str) -> bool:
    return ObjectId.is_valid(value)


def _to_project_response(project: dict) -> CollaborationProjectResponse:
    return CollaborationProjectResponse(
        id=str(project["_id"]),
        title=project.get("title", ""),
        description=project.get("description", ""),
        required_skills=project.get("required_skills", []),
        project_type=project.get("project_type", "Portfolio"),
        team_size=int(project.get("team_size", 1)),
        current_members=[str(member) for member in project.get("current_members", [])],
        created_by=str(project.get("created_by", "")),
        created_by_name=project.get("created_by_name"),
        status=project.get("status", "Open"),
        deadline=project.get("deadline"),
        created_at=project.get("created_at", datetime.utcnow()),
        updated_at=project.get("updated_at"),
    )


def _to_request_response(request_doc: dict) -> JoinRequestResponse:
    return JoinRequestResponse(
        id=str(request_doc["_id"]),
        project_id=str(request_doc.get("project_id", "")),
        requester_id=str(request_doc.get("requester_id", "")),
        requester_name=request_doc.get("requester_name"),
        message=request_doc.get("message"),
        status=request_doc.get("status", "Pending"),
        created_at=request_doc.get("created_at", datetime.utcnow()),
        updated_at=request_doc.get("updated_at"),
    )


def _to_opportunity_response(opportunity: dict) -> OpportunityResponse:
    return OpportunityResponse(
        id=str(opportunity["_id"]),
        title=opportunity.get("title", ""),
        description=opportunity.get("description", ""),
        type=opportunity.get("type", "Workshop"),
        apply_link=opportunity.get("apply_link", ""),
        deadline=opportunity.get("deadline", datetime.utcnow()),
        eligibility=opportunity.get("eligibility"),
        location=opportunity.get("location"),
        is_featured=bool(opportunity.get("is_featured", False)),
        created_at=opportunity.get("created_at", datetime.utcnow()),
        updated_at=opportunity.get("updated_at"),
    )


def _get_user_doc(current_user: dict) -> dict:
    email = current_user.get("email")
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Authenticated user not found")
    return user


def _assert_creator(project: dict, current_user: dict) -> None:
    user_id = str(current_user.get("user_id"))
    if str(project.get("created_by")) != user_id:
        raise HTTPException(status_code=403, detail="Only the project creator can perform this action")


def _assert_admin(current_user: dict) -> None:
    user = _get_user_doc(current_user)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


def _normalize_skills(skills: List[str]) -> List[str]:
    cleaned = sorted({str(skill).strip() for skill in skills if str(skill).strip()})
    if not cleaned:
        raise HTTPException(status_code=400, detail="required_skills must contain at least one skill")
    return cleaned


def _close_project_if_full(project_id: ObjectId) -> None:
    project = collaboration_projects_collection.find_one({"_id": project_id})
    if not project:
        return
    current_members = project.get("current_members", [])
    team_size = int(project.get("team_size", 1))
    if len(current_members) >= team_size and project.get("status") == "Open":
        collaboration_projects_collection.update_one(
            {"_id": project_id},
            {"$set": {"status": "Closed", "updated_at": datetime.utcnow()}},
        )


@router.get("/overview", response_model=CollaborateOverviewResponse)
def get_collaborate_overview(current_user: dict = Depends(get_current_user)):
    _ensure_indexes()
    user_id = str(current_user.get("user_id"))
    now = datetime.utcnow()
    week_end = now + timedelta(days=7)

    active_projects = collaboration_projects_collection.count_documents(
        {"status": {"$in": ["Open", "In Progress"]}}
    )
    open_join_requests = collaboration_requests_collection.count_documents(
        {"requester_id": user_id, "status": "Pending"}
    )
    opportunities_closing_this_week = opportunities_collection.count_documents(
        {"deadline": {"$gte": now, "$lte": week_end}}
    )

    return CollaborateOverviewResponse(
        active_projects=active_projects,
        open_join_requests=open_join_requests,
        opportunities_closing_this_week=opportunities_closing_this_week,
    )


@router.post("/projects", response_model=CollaborationProjectResponse)
def create_project(
    project: CollaborationProjectCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if project.team_size < 1:
        raise HTTPException(status_code=400, detail="team_size must be at least 1")

    user = _get_user_doc(current_user)
    creator_id = str(user["_id"])
    now = datetime.utcnow()

    project_doc = {
        "title": project.title.strip(),
        "description": project.description.strip(),
        "required_skills": _normalize_skills(project.required_skills),
        "project_type": project.project_type,
        "team_size": int(project.team_size),
        "current_members": [creator_id],
        "created_by": creator_id,
        "created_by_name": user.get("name", user.get("email")),
        "status": "Open",
        "deadline": project.deadline,
        "created_at": now,
        "updated_at": now,
    }

    result = collaboration_projects_collection.insert_one(project_doc)
    created = collaboration_projects_collection.find_one({"_id": result.inserted_id})
    return _to_project_response(created)


@router.get("/projects", response_model=List[CollaborationProjectResponse])
def list_projects(
    project_type: Optional[str] = Query(None),
    status: Optional[str] = Query("Open"),
    skill: Optional[str] = Query(None),
    sort: str = Query("created_at", regex="^(created_at|deadline)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    limit: int = Query(40, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    query: dict = {}

    if project_type:
        query["project_type"] = project_type
    if status and status.lower() != "all":
        query["status"] = status
    if skill:
        query["required_skills"] = {"$regex": f"^{skill.strip()}$", "$options": "i"}

    sort_order = 1 if order == "asc" else -1
    projects = list(
        collaboration_projects_collection.find(query).sort(sort, sort_order).skip(skip).limit(limit)
    )
    return [_to_project_response(project) for project in projects]


@router.get("/projects/matches/me", response_model=List[CollaborationProjectResponse])
def match_projects_for_user(
    limit: int = Query(10, ge=1, le=30),
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    email = current_user.get("email")
    user_id = str(current_user.get("user_id"))

    raw_skills_doc = user_skills_collection.find_one({"email": email}) or {}
    raw_skills = raw_skills_doc.get("skills", [])
    user_skills = {
        (s.get("skill") if isinstance(s, dict) else str(s)).strip().lower()
        for s in raw_skills
        if (s.get("skill") if isinstance(s, dict) else str(s)).strip()
    }

    if not user_skills:
        context_doc = user_context_collection.find_one({"email": email}) or {}
        interests = context_doc.get("interests", [])
        user_skills = {str(skill).strip().lower() for skill in interests if str(skill).strip()}

    if not user_skills:
        return []

    projects = list(
        collaboration_projects_collection.find(
            {"status": "Open", "created_by": {"$ne": user_id}}
        ).limit(300)
    )

    scored_projects = []
    for project in projects:
        project_skills = {str(skill).strip().lower() for skill in project.get("required_skills", [])}
        overlap = len(user_skills & project_skills)
        if overlap > 0:
            scored_projects.append((overlap, project))

    scored_projects.sort(key=lambda entry: entry[0], reverse=True)
    return [_to_project_response(project) for _, project in scored_projects[:limit]]


@router.get("/projects/{project_id}", response_model=CollaborationProjectResponse)
def get_project(
    project_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return _to_project_response(project)


@router.put("/projects/{project_id}", response_model=CollaborationProjectResponse)
def update_project(
    project_id: str,
    project_update: CollaborationProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_creator(project, current_user)

    update_data = {"updated_at": datetime.utcnow()}
    if project_update.title is not None:
        update_data["title"] = project_update.title.strip()
    if project_update.description is not None:
        update_data["description"] = project_update.description.strip()
    if project_update.required_skills is not None:
        update_data["required_skills"] = _normalize_skills(project_update.required_skills)
    if project_update.project_type is not None:
        update_data["project_type"] = project_update.project_type
    if project_update.team_size is not None:
        if project_update.team_size < len(project.get("current_members", [])):
            raise HTTPException(
                status_code=400,
                detail="team_size cannot be smaller than current member count",
            )
        update_data["team_size"] = int(project_update.team_size)
    if project_update.status is not None:
        update_data["status"] = project_update.status
    if project_update.deadline is not None:
        update_data["deadline"] = project_update.deadline

    collaboration_projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data},
    )
    _close_project_if_full(ObjectId(project_id))
    updated = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    return _to_project_response(updated)


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_creator(project, current_user)

    collaboration_requests_collection.delete_many({"project_id": project_id})
    collaboration_projects_collection.delete_one({"_id": ObjectId(project_id)})
    return {"message": "Project deleted successfully"}


@router.post("/projects/{project_id}/request", response_model=JoinRequestResponse)
def request_to_join_project(
    project_id: str,
    request: JoinRequestCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = _get_user_doc(current_user)
    requester_id = str(user["_id"])
    if str(project.get("created_by")) == requester_id:
        raise HTTPException(status_code=400, detail="Project creator is already part of the team")
    if requester_id in [str(member) for member in project.get("current_members", [])]:
        raise HTTPException(status_code=400, detail="You are already a member of this project")
    if project.get("status") != "Open":
        raise HTTPException(status_code=400, detail="Project is not open for requests")

    existing = collaboration_requests_collection.find_one(
        {"project_id": project_id, "requester_id": requester_id, "status": "Pending"}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request for this project")

    now = datetime.utcnow()
    request_doc = {
        "project_id": project_id,
        "requester_id": requester_id,
        "requester_name": user.get("name", user.get("email")),
        "message": request.message.strip() if request.message else None,
        "status": "Pending",
        "created_at": now,
        "updated_at": now,
    }
    result = collaboration_requests_collection.insert_one(request_doc)
    created = collaboration_requests_collection.find_one({"_id": result.inserted_id})
    return _to_request_response(created)


@router.get("/projects/{project_id}/requests", response_model=List[JoinRequestResponse])
def get_project_requests(
    project_id: str,
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")

    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_creator(project, current_user)

    query = {"project_id": project_id}
    if status:
        query["status"] = status
    requests = list(collaboration_requests_collection.find(query).sort("created_at", -1))
    return [_to_request_response(request_doc) for request_doc in requests]


@router.put("/requests/{request_id}", response_model=JoinRequestResponse)
def review_join_request(
    request_id: str,
    request_update: JoinRequestUpdate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    if not _is_valid_object_id(request_id):
        raise HTTPException(status_code=400, detail="Invalid request id")

    request_doc = collaboration_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Join request not found")

    project_id = request_doc.get("project_id")
    if not _is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Corrupted project id on join request")
    project = collaboration_projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_creator(project, current_user)

    if request_doc.get("status") != "Pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be reviewed")

    now = datetime.utcnow()
    next_status = request_update.status
    update_data = {"status": next_status, "updated_at": now}
    collaboration_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data},
    )

    if next_status == "Accepted":
        requester_id = str(request_doc.get("requester_id"))
        collaboration_projects_collection.update_one(
            {"_id": ObjectId(project_id), "current_members": {"$ne": requester_id}},
            {
                "$push": {"current_members": requester_id},
                "$set": {"updated_at": now, "status": "In Progress"},
            },
        )
        _close_project_if_full(ObjectId(project_id))
        collaboration_requests_collection.update_many(
            {
                "project_id": project_id,
                "requester_id": {"$ne": requester_id},
                "status": "Pending",
            },
            {"$set": {"status": "Rejected", "updated_at": now}},
        )

    updated = collaboration_requests_collection.find_one({"_id": ObjectId(request_id)})
    return _to_request_response(updated)


@router.get("/opportunities", response_model=List[OpportunityResponse])
def list_opportunities(
    type: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    deadline_soon: Optional[bool] = Query(False),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(optional_auth),
):
    _ensure_indexes()
    query: dict = {}
    if type:
        query["type"] = type
    if featured is not None:
        query["is_featured"] = featured
    if deadline_soon:
        now = datetime.utcnow()
        query["deadline"] = {"$gte": now, "$lte": now + timedelta(days=3)}

    opportunities = list(
        opportunities_collection.find(query).sort([("deadline", 1), ("created_at", -1)]).skip(skip).limit(limit)
    )
    return [_to_opportunity_response(opportunity) for opportunity in opportunities]


@router.post("/opportunities", response_model=OpportunityResponse)
def create_opportunity(
    opportunity: OpportunityCreate,
    current_user: dict = Depends(get_current_user),
):
    _ensure_indexes()
    _assert_admin(current_user)

    now = datetime.utcnow()
    opportunity_doc = {
        "title": opportunity.title.strip(),
        "description": opportunity.description.strip(),
        "type": opportunity.type,
        "apply_link": opportunity.apply_link.strip(),
        "deadline": opportunity.deadline,
        "eligibility": opportunity.eligibility.strip() if opportunity.eligibility else None,
        "location": opportunity.location.strip() if opportunity.location else None,
        "is_featured": bool(opportunity.is_featured),
        "created_at": now,
        "updated_at": now,
    }
    result = opportunities_collection.insert_one(opportunity_doc)
    created = opportunities_collection.find_one({"_id": result.inserted_id})
    return _to_opportunity_response(created)


@router.get("/my-teams", response_model=List[CollaborationProjectResponse])
def get_my_teams(current_user: dict = Depends(get_current_user)):
    _ensure_indexes()
    user_id = str(current_user.get("user_id"))
    query = {"$or": [{"created_by": user_id}, {"current_members": user_id}]}
    projects = list(collaboration_projects_collection.find(query).sort("created_at", -1))
    return [_to_project_response(project) for project in projects]
