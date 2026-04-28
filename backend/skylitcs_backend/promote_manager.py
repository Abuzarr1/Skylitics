import asyncio
import os
import sys
from sqlalchemy import update

# Add parent dir to path to import app correctly
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, UserRole

async def promote_user():
    async with AsyncSessionLocal() as db:
        target_email = "manager@skylytics.io"
        print(f"--- ATTEMPTING TO PROMOTE {target_email} ---")
        
        await db.execute(
            update(User)
            .where(User.email == target_email)
            .values(role=UserRole.MANAGER)
        )
        await db.commit()
        print(f"[SUCCESS] {target_email} is now a MANAGER.")

if __name__ == "__main__":
    asyncio.run(promote_user())
