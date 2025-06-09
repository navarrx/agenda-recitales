import sys
import os
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def reset_admin_password(new_password: str):
    db = SessionLocal()
    try:
        # Find the admin user
        admin_user = db.query(User).filter(User.is_admin == True).first()
        if not admin_user:
            print("No admin user found!")
            return

        # Update the password
        admin_user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"Admin password updated successfully!")
    except Exception as e:
        print(f"Error updating admin password: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reset_admin_password.py <new_password>")
        sys.exit(1)
    
    new_password = sys.argv[1]
    reset_admin_password(new_password) 