from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

from app.core.deps import get_current_user
from app.db.database import resources_collection
from app.schemas import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse
)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.post("", response_model=ResourceResponse)
def create_resource(
    resource: ResourceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Save a learning resource."""
    user_id = current_user.get("user_id")
    email = current_user.get("email")

    resource_data = {
        "user_id": user_id,
        "email": email,
        "title": resource.title,
        "url": resource.url,
        "description": resource.description,
        "resource_type": resource.resource_type,
        "tags": resource.tags or [],
        "notes": resource.notes,
        "status": "saved",
        "is_ai_recommended": resource.is_ai_recommended,
        "linked_recommendation_id": resource.linked_recommendation_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = resources_collection.insert_one(resource_data)
    resource_data["id"] = str(result.inserted_id)

    return ResourceResponse(**resource_data)


@router.get("", response_model=List[ResourceResponse])
def get_resources(
    resource_type: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    is_ai_recommended: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's saved resources with optional filtering."""
    email = current_user.get("email")
    query = {"email": email}

    if resource_type:
        query["resource_type"] = resource_type
    if tag:
        query["tags"] = tag
    if status:
        query["status"] = status
    if is_ai_recommended is not None:
        query["is_ai_recommended"] = is_ai_recommended

    resources = list(
        resources_collection.find(query)
        .sort("created_at", -1)
    )

    return [ResourceResponse(**{**resource, "id": str(resource["_id"])}) for resource in resources]


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific resource by ID."""
    email = current_user.get("email")
    resource = resources_collection.find_one({"_id": ObjectId(resource_id), "email": email})

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    return ResourceResponse(**{**resource, "id": str(resource["_id"])})


@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: str,
    resource_update: ResourceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a resource."""
    email = current_user.get("email")
    resource = resources_collection.find_one({"_id": ObjectId(resource_id), "email": email})

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = {"updated_at": datetime.utcnow()}
    if resource_update.title is not None:
        update_data["title"] = resource_update.title
    if resource_update.description is not None:
        update_data["description"] = resource_update.description
    if resource_update.tags is not None:
        update_data["tags"] = resource_update.tags
    if resource_update.notes is not None:
        update_data["notes"] = resource_update.notes
    if resource_update.status is not None:
        update_data["status"] = resource_update.status

    resources_collection.update_one(
        {"_id": ObjectId(resource_id)},
        {"$set": update_data}
    )

    updated = resources_collection.find_one({"_id": ObjectId(resource_id)})
    return ResourceResponse(**{**updated, "id": str(updated["_id"])})


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a resource."""
    email = current_user.get("email")
    resource = resources_collection.find_one({"_id": ObjectId(resource_id), "email": email})

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resources_collection.delete_one({"_id": ObjectId(resource_id)})

    return {"message": "Resource deleted successfully"}


@router.get("/tags/list")
def get_all_tags(current_user: dict = Depends(get_current_user)):
    """Get all unique tags from user's resources."""
    email = current_user.get("email")
    resources = resources_collection.find({"email": email})

    tags = set()
    for resource in resources:
        tags.update(resource.get("tags", []))

    return {"tags": sorted(list(tags))}



