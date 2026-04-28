import asyncio
import os
import sys
from sqlalchemy import select, update

# Add parent dir to path to import app correctly
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, UserRole

async def diagnostic_report():
    async with AsyncSessionLocal() as db:
        # 1. Audit all users
        result = await db.execute(select(User))
        users = result.scalars().all()
        print("\n=== SYSTEM USER AUDIT ===")
        print(f"{'EMAIL':<35} | {'ROLE':<12} | {'STATUS'}")
        print("-" * 65)
        
        found_manager = False
        for u in users:
            print(f"{u.email:<35} | {u.role:<12} | {'ACTIVE' if u.is_active else 'INACTIVE'}")
            if u.role == UserRole.MANAGER or u.role == UserRole.ADMIN:
                found_manager = True
        
        if not found_manager:
            print("\n[WARNING] No Manager/Admin accounts detected!")
        
        # 2. Repair 'test_manager@skylytics.io' if it exists
        target_email = "test_manager@skylytics.io"
        result = await db.execute(select(User).where(User.email == target_email))
        target_user = result.scalar_one_or_none()
        
        if target_user:
            if target_user.role != UserRole.MANAGER:
                print(f"\n[ACTION] Promoting {target_email} from {target_user.role} to MANAGER...")
                await db.execute(
                    update(User)
                    .where(User.email == target_email)
                    .values(role=UserRole.MANAGER)
                )
                await db.commit()
                print("[SUCCESS] Promotion complete.")
            else:
                print(f"\n[INFO] {target_email} is already a MANAGER.")
        else:
            print(f"\n[INFO] {target_email} not found. Suggesting user register it first.")

if __name__ == "__main__":
    asyncio.run(diagnostic_report())
