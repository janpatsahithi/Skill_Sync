from fastapi import APIRouter, HTTPException, Depends
from app.db.database import get_db
from passlib.context import CryptContext
from app.schemas import UserRegister, UserLogin
from app.core.security import create_access_token

router = APIRouter()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)


@router.post("/register")
def register(user: UserRegister, db=Depends(get_db)):
    users_collection = db["users"]
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": "user"
    })

    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin, db=Depends(get_db)):
    users_collection = db["users"]
    db_user = users_collection.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"]
        }
    }

