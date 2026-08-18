import sys
sys.path.insert(0, ".")
from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import verify_password, hash_password, create_access_token
from app.schemas.auth_schemas import UserOut

db = SessionLocal()
users = db.query(User).all()
print(f"Total users: {len(users)}")
for u in users:
    print(f"User: id={u.id}, email={u.email}, role={u.role}, active={u.is_active}")
    print(f"  hashed_pwd={u.hashed_password}")
    is_valid = verify_password("wildlife123", u.hashed_password)
    print(f"  Password 'wildlife123' valid? {is_valid}")
    try:
        token = create_access_token(data={"sub": u.id, "role": u.role.value if hasattr(u.role, 'value') else u.role})
        user_out = UserOut.model_validate(u)
        print(f"  Token generated successfully: {token[:20]}...")
        print(f"  UserOut schema valid: {user_out}")
    except Exception as e:
        print(f"  ERROR generating token / validating schema: {e}")
