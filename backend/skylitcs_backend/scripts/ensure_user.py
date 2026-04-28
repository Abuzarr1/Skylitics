import asyncio
import sys
import os

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def ensure_demo_user():
    async with AsyncSessionLocal() as db:
        email = "abuzarr819@gmail.com"
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"[Core] Creating user {email} as MANAGER...")
            user = User(
                email=email,
                full_name="Abuzarr Operator",
                password_hash=get_password_hash("password123"), # Temporary
                role=UserRole.MANAGER,
                airport_code="SEA",
                is_active=True
            )
            db.add(user)
            await db.commit()
            print(f"[Core] SUCCESS.")
        else:
            print(f"[Core] User {email} already exists.")

if __name__ == "__main__":
    asyncio.run(ensure_demo_user())
