from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List
from bson import ObjectId

from app.core.deps import get_current_user
from app.db.database import goals_collection, tasks_collection
from app.schemas import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

router = APIRouter(prefix="/planning", tags=["Planning & Progress"])


# -----------------------------
# GOALS
# -----------------------------
@router.post("/goals", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new goal (short-term or long-term)."""
    user_id = current_user.get("user_id")
    email = current_user.get("email")

    goal_data = {
        "user_id": user_id,
        "email": email,
        "title": goal.title,
        "description": goal.description,
        "goal_type": goal.goal_type,
        "status": "active",
        "target_date": goal.target_date,
        "linked_occupation_uri": goal.linked_occupation_uri,
        "progress_percentage": 0.0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = goals_collection.insert_one(goal_data)
    goal_data["id"] = str(result.inserted_id)

    return GoalResponse(**goal_data)


@router.get("/goals", response_model=List[GoalResponse])
def get_goals(
    goal_type: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all goals for the current user."""
    email = current_user.get("email")
    query = {"email": email}

    if goal_type:
        query["goal_type"] = goal_type
    if status:
        query["status"] = status

    goals = list(goals_collection.find(query).sort("created_at", -1))
    return [GoalResponse(**{**goal, "id": str(goal["_id"])}) for goal in goals]


@router.get("/goals/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific goal by ID."""
    email = current_user.get("email")
    goal = goals_collection.find_one({"_id": ObjectId(goal_id), "email": email})

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return GoalResponse(**{**goal, "id": str(goal["_id"])})


@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a goal."""
    email = current_user.get("email")
    goal = goals_collection.find_one({"_id": ObjectId(goal_id), "email": email})

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = {"updated_at": datetime.utcnow()}
    if goal_update.title is not None:
        update_data["title"] = goal_update.title
    if goal_update.description is not None:
        update_data["description"] = goal_update.description
    if goal_update.status is not None:
        update_data["status"] = goal_update.status
    if goal_update.target_date is not None:
        update_data["target_date"] = goal_update.target_date

    goals_collection.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": update_data}
    )

    # Recalculate progress based on tasks
    tasks = list(tasks_collection.find({"goal_id": goal_id}))
    if tasks:
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        update_data["progress_percentage"] = (completed / len(tasks)) * 100
        goals_collection.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": {"progress_percentage": update_data["progress_percentage"]}}
        )

    updated = goals_collection.find_one({"_id": ObjectId(goal_id)})
    return GoalResponse(**{**updated, "id": str(updated["_id"])})


@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a goal and all associated tasks."""
    email = current_user.get("email")
    goal = goals_collection.find_one({"_id": ObjectId(goal_id), "email": email})

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Delete associated tasks
    tasks_collection.delete_many({"goal_id": goal_id})
    goals_collection.delete_one({"_id": ObjectId(goal_id)})

    return {"message": "Goal deleted successfully"}


# -----------------------------
# TASKS
# -----------------------------
@router.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task linked to a goal."""
    user_id = current_user.get("user_id")
    email = current_user.get("email")

    # Verify goal exists
    goal = goals_collection.find_one({"_id": ObjectId(task.goal_id), "email": email})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    task_data = {
        "goal_id": task.goal_id,
        "user_id": user_id,
        "email": email,
        "title": task.title,
        "description": task.description,
        "status": "pending",
        "due_date": task.due_date,
        "is_ai_suggested": task.is_ai_suggested,
        "linked_recommendation_id": task.linked_recommendation_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = tasks_collection.insert_one(task_data)
    task_data["id"] = str(result.inserted_id)

    # Update goal progress
    tasks = list(tasks_collection.find({"goal_id": task.goal_id}))
    completed = sum(1 for t in tasks if t.get("status") == "completed")
    progress = (completed / len(tasks)) * 100 if tasks else 0
    goals_collection.update_one(
        {"_id": ObjectId(task.goal_id)},
        {"$set": {"progress_percentage": progress, "updated_at": datetime.utcnow()}}
    )

    return TaskResponse(**task_data)


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    goal_id: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get tasks for the current user."""
    email = current_user.get("email")
    query = {"email": email}

    if goal_id:
        query["goal_id"] = goal_id
    if status:
        query["status"] = status

    tasks = list(tasks_collection.find(query).sort("created_at", -1))
    return [TaskResponse(**{**task, "id": str(task["_id"])}) for task in tasks]


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a task."""
    email = current_user.get("email")
    task = tasks_collection.find_one({"_id": ObjectId(task_id), "email": email})

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = {"updated_at": datetime.utcnow()}
    if task_update.title is not None:
        update_data["title"] = task_update.title
    if task_update.description is not None:
        update_data["description"] = task_update.description
    if task_update.status is not None:
        update_data["status"] = task_update.status
    if task_update.due_date is not None:
        update_data["due_date"] = task_update.due_date

    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )

    # Update goal progress
    goal_id = task.get("goal_id")
    if goal_id:
        tasks = list(tasks_collection.find({"goal_id": goal_id}))
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        progress = (completed / len(tasks)) * 100 if tasks else 0
        goals_collection.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": {"progress_percentage": progress, "updated_at": datetime.utcnow()}}
        )

    updated = tasks_collection.find_one({"_id": ObjectId(task_id)})
    return TaskResponse(**{**updated, "id": str(updated["_id"])})


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a task."""
    email = current_user.get("email")
    task = tasks_collection.find_one({"_id": ObjectId(task_id), "email": email})

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    goal_id = task.get("goal_id")
    tasks_collection.delete_one({"_id": ObjectId(task_id)})

    # Update goal progress
    if goal_id:
        tasks = list(tasks_collection.find({"goal_id": goal_id}))
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        progress = (completed / len(tasks)) * 100 if tasks else 0
        goals_collection.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": {"progress_percentage": progress, "updated_at": datetime.utcnow()}}
        )

    return {"message": "Task deleted successfully"}



