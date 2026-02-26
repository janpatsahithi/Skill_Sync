from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

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
app = FastAPI(title="SkillWeave API")

# ------------------------------------------------------------------
# CORS (DEV-SAFE, FIXES YOUR ISSUE)
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ dev only
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Startup
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("Validating datasets on startup...")

    if DatasetValidator.validate_all():
        logger.info("All datasets validated successfully")
    else:
        logger.warning("Some datasets failed validation")

    stats = DatasetValidator.get_dataset_stats()
    for dataset, info in stats.items():
        logger.info(f"{dataset}: {info}")

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

# ------------------------------------------------------------------
# Root
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}
