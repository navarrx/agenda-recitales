from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from .database import get_db
import os

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(user: models.User = Depends(get_current_user)):
    import logging
    logger = logging.getLogger("app.auth")
    logger.info("[get_current_admin_user] Called.")
    logger.info(f"[get_current_admin_user] User: {getattr(user, 'username', None)}")
    if not user or not user.is_admin:
        logger.warning("[get_current_admin_user] Not admin or not authenticated.")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    logger.info("[get_current_admin_user] Admin authenticated.")
    return user

def create_initial_admin(db: Session):
    """Create initial admin user if no admin exists"""
    # Check if any admin exists
    existing_admin = db.query(models.User).filter(models.User.is_admin == True).first()
    if existing_admin:
        return None

    # Get admin credentials from environment variables
    admin_username = os.getenv("INITIAL_ADMIN_USERNAME")
    admin_password = os.getenv("INITIAL_ADMIN_PASSWORD")

    if not admin_username or not admin_password:
        raise ValueError("INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD must be set")

    # Create admin user
    hashed_password = get_password_hash(admin_password)
    admin_user = models.User(
        username=admin_username,
        hashed_password=hashed_password,
        is_admin=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user