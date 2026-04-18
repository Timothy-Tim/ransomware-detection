# scripts/create_user.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine
from app.models.user import User, Base
from app.core.security import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if user already exists
existing = db.query(User).filter(User.username == "admin").first()
if not existing:
    user = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        role="admin"
    )
    db.add(user)
    db.commit()
    print("✅ Admin user created — username: admin, password: admin123")
else:
    print("ℹ️ Admin user already exists")

db.close()