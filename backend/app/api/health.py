from fastapi import APIRouter
from app.utils.dataset_validator import DatasetValidator

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/datasets")
def check_datasets():
    """Check the status and statistics of all datasets."""
    stats = DatasetValidator.get_dataset_stats()
    all_valid = all(info.get("status") == "valid" for info in stats.values())
    
    return {
        "status": "healthy" if all_valid else "warning",
        "all_datasets_valid": all_valid,
        "datasets": stats
    }


@router.get("/")
def health_check():
    """Basic health check endpoint."""
    return {
        "status": "ok",
        "service": "SkillWeave API"
    }
