from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()
admin = User(
    username="admin",
    hashed_password=hash_password("yourpassword"),
    role="admin"
)
db.add(admin)
db.commit()
db.close()
print("Admin user created")