import asyncio
import sys
import os

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def reset_agent_password():
    async with AsyncSessionLocal() as db:
        email = "agent@skylytics.local"
        new_password = "skylytics123"
        hash = get_password_hash(new_password)
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print(f"[Reset] Found user {email}. Updating password...")
            user.password_hash = hash
            db.add(user)
        else:
            print(f"[Reset] User {email} not found. Creating new ADMIN user...")
            user = User(
                email=email,
                full_name="Operations Agent",
                password_hash=hash,
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(user)
            
        await db.commit()
        print(f"[Reset] SUCCESS.")
        print(f"IDENTIFICATION: {email}")
        print(f"ACCESS KEY: {new_password}")

if __name__ == "__main__":
    asyncio.run(reset_agent_password())
