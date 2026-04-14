import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import is_database_connected

from app.api import users
from app.api import resume
from app.api import skills
from app.api import protected
from app.api import carrers
from app.api import analysis
from app.api import jobs
from app.api import learning
from app.api import rag
from app.api import health
from app.api import user_context
from app.api import guidance
from app.api import planning
from app.api import community
from app.api import resources
from app.api import feedback
from app.api import collaborate

from app.utils.dataset_validator import DatasetValidator

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# App
# ------------------------------------------------------------------
app = FastAPI()

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
allow_all_origins = settings.CORS_ORIGINS == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Startup
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("SkillWeave API server starting...")

    if is_database_connected():
        logger.info("MongoDB status: connected")
    else:
        logger.error("MongoDB status: unavailable")

    if os.getenv("VALIDATE_DATASETS_ON_STARTUP") == "1":
        logger.info("Validating datasets on startup...")
        try:
            if DatasetValidator.validate_all():
                logger.info("All datasets validated successfully")
            else:
                logger.warning("Some datasets failed validation")
            for dataset, info in DatasetValidator.get_dataset_stats().items():
                logger.info("%s: %s", dataset, info)
        except Exception:
            logger.exception("Dataset validation failed on startup")

# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(skills.router)          # 👈 IMPORTANT
app.include_router(carrers.router)
app.include_router(analysis.router)
app.include_router(jobs.router)
app.include_router(learning.router)
app.include_router(rag.router)
app.include_router(health.router)
app.include_router(protected.router, prefix="/api")

# New user-centric modules
app.include_router(user_context.router)
app.include_router(guidance.router)
app.include_router(planning.router)
app.include_router(community.router)
app.include_router(resources.router)
app.include_router(feedback.router)
app.include_router(collaborate.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------------------------------------------------------
# Root
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}
