from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime


# -----------------------------
# AUTH
# -----------------------------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -----------------------------
# SKILL EXTRACTION
# -----------------------------
class SkillExtractRequest(BaseModel):
    resume_text: str


class ExtractedSkill(BaseModel):
    skill: str
    uri: str
    confidence: float


class SkillExtractResponse(BaseModel):
    email: EmailStr
    skills: List[ExtractedSkill]
    total_skills: int


# -----------------------------
# SKILL GAP (IMPORTANT FIX)
# -----------------------------
class SkillGapRequest(BaseModel):
    occupation_uri: str


class SkillGapResponse(BaseModel):
    readiness_score: float
    covered_skills: List[str]
    missing_essential: List[str]
    missing_optional: List[str]


# -----------------------------
# OCCUPATIONS
# -----------------------------
class OccupationResponse(BaseModel):
    label: str
    uri: str
    source: Optional[str] = None
    category: Optional[str] = None


# -----------------------------
# JOB RECOMMENDATIONS
# -----------------------------
class JobLinks(BaseModel):
    linkedin: str
    indeed: str
    naukri: str


class JobRecommendationResponse(BaseModel):
    role: str
    match_score: int
    description: str
    matched_skills: List[str]
    missing_skills: List[str]
    job_links: JobLinks


class JobRecommendationListResponse(BaseModel):
    jobs: List[JobRecommendationResponse]
    message: Optional[str] = None


# -----------------------------
# USER CONTEXT & PROFILE
# -----------------------------
class UserContextCreate(BaseModel):
    background: Optional[str] = None
    interests: List[str] = []
    career_goals: Optional[str] = None
    preferences: Optional[dict] = {}
    availability_hours_per_week: Optional[int] = None
    onboarding_completed: Optional[bool] = None
    onboarding_data: Optional[dict] = None


class UserContextUpdate(BaseModel):
    background: Optional[str] = None
    interests: Optional[List[str]] = None
    career_goals: Optional[str] = None
    preferences: Optional[dict] = None
    availability_hours_per_week: Optional[int] = None
    onboarding_completed: Optional[bool] = None
    onboarding_data: Optional[dict] = None
    last_skill_gap: Optional[dict] = None


class UserContextResponse(BaseModel):
    user_id: str
    email: str
    background: Optional[str]
    interests: List[str]
    career_goals: Optional[str]
    preferences: dict
    availability_hours_per_week: Optional[int]
    onboarding_completed: Optional[bool] = False
    onboarding_data: Optional[dict] = None
    last_skill_gap: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


# -----------------------------
# INTELLIGENT GUIDANCE
# -----------------------------
class GuidanceRequest(BaseModel):
    goal_type: str  # "career_change", "skill_development", "job_search"
    target_occupation_uri: Optional[str] = None
    focus_areas: Optional[List[str]] = []


class RecommendationItem(BaseModel):
    type: str  # "job", "learning_resource", "skill"
    title: str
    description: str
    relevance_score: float
    reasoning: str
    action_items: List[str]


class GuidanceResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendationItem]
    skill_gap_analysis: Optional[dict] = None
    learning_path: Optional[dict] = None
    generated_at: datetime


# -----------------------------
# PLANNING & PROGRESS TRACKING
# -----------------------------
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: str  # "short_term", "long_term"
    target_date: Optional[datetime] = None
    linked_occupation_uri: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # "active", "completed", "paused"
    target_date: Optional[datetime] = None


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    goal_type: str
    status: str
    target_date: Optional[datetime]
    progress_percentage: float
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    goal_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_ai_suggested: bool = False
    linked_recommendation_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # "pending", "in_progress", "completed"
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: str
    goal_id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    due_date: Optional[datetime]
    is_ai_suggested: bool
    linked_recommendation_id: Optional[str]
    created_at: datetime
    updated_at: datetime


# -----------------------------
# COMMUNITY & DISCUSSION
# -----------------------------
CommunityPostType = Literal[
    "career_question",
    "company_experience",
    "role_guidance",
    "project_showcase",
]


class PostComment(BaseModel):
    user_id: str
    content: str
    created_at: datetime


class PostCreate(BaseModel):
    title: str
    content: str
    type: Optional[CommunityPostType] = None
    skill_tags: Optional[List[str]] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    company: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[CommunityPostType] = None
    skill_tags: Optional[List[str]] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    company: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None


class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    title: str
    content: str
    type: CommunityPostType
    skill_tags: List[str]
    company: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None
    likes: int
    category: Optional[str] = None
    tags: List[str] = []
    upvotes: int = 0
    comment_count: int = 0
    comments: List[PostComment] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    user_id: str
    author_name: str
    content: str
    created_at: datetime


# -----------------------------
# COLLABORATE MODULE
# -----------------------------
ProjectType = Literal["Hackathon", "Portfolio", "Startup Idea", "Open Source"]
ProjectStatus = Literal["Open", "Closed", "In Progress", "Completed"]
RequestStatus = Literal["Pending", "Accepted", "Rejected"]
OpportunityType = Literal["Hackathon", "Internship", "Workshop", "Competition"]


class CollaborationProjectCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    project_type: ProjectType
    team_size: int
    deadline: Optional[datetime] = None


class CollaborationProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    project_type: Optional[ProjectType] = None
    team_size: Optional[int] = None
    status: Optional[ProjectStatus] = None
    deadline: Optional[datetime] = None


class CollaborationProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[str]
    project_type: ProjectType
    team_size: int
    current_members: List[str]
    created_by: str
    created_by_name: Optional[str] = None
    status: ProjectStatus
    deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class JoinRequestCreate(BaseModel):
    message: Optional[str] = None


class JoinRequestUpdate(BaseModel):
    status: Literal["Accepted", "Rejected"]


class JoinRequestResponse(BaseModel):
    id: str
    project_id: str
    requester_id: str
    requester_name: Optional[str] = None
    message: Optional[str] = None
    status: RequestStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class OpportunityCreate(BaseModel):
    title: str
    description: str
    type: OpportunityType
    apply_link: str
    deadline: datetime
    eligibility: Optional[str] = None
    location: Optional[str] = None
    is_featured: bool = False


class OpportunityResponse(BaseModel):
    id: str
    title: str
    description: str
    type: OpportunityType
    apply_link: str
    deadline: datetime
    eligibility: Optional[str] = None
    location: Optional[str] = None
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class CollaborateOverviewResponse(BaseModel):
    active_projects: int
    open_join_requests: int
    opportunities_closing_this_week: int


# -----------------------------
# RESOURCE DISCOVERY & MANAGEMENT
# -----------------------------
class ResourceCreate(BaseModel):
    title: str
    url: str
    description: Optional[str] = None
    resource_type: str  # "article", "video", "course", "book", "tool"
    tags: List[str] = []
    notes: Optional[str] = None
    is_ai_recommended: bool = False
    linked_recommendation_id: Optional[str] = None


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # "saved", "in_progress", "completed"


class ResourceResponse(BaseModel):
    id: str
    user_id: str
    title: str
    url: str
    description: Optional[str]
    resource_type: str
    tags: List[str]
    notes: Optional[str]
    status: str
    is_ai_recommended: bool
    linked_recommendation_id: Optional[str]
    created_at: datetime
    updated_at: datetime


# -----------------------------
# REFLECTION & FEEDBACK
# -----------------------------
class FeedbackCreate(BaseModel):
    recommendation_id: Optional[str] = None
    recommendation_type: Optional[str] = None  # "job", "learning", "skill"
    rating: int  # 1-5
    feedback_text: Optional[str] = None
    was_helpful: bool
    reflection_notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    recommendation_id: Optional[str]
    recommendation_type: Optional[str]
    rating: int
    feedback_text: Optional[str]
    was_helpful: bool
    reflection_notes: Optional[str]
    created_at: datetime
