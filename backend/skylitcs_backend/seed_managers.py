"""
Seed manager + admin accounts with airport assignments.

Usage:
    ./venv/bin/python3 seed_managers.py

Accounts created:
    atl.manager@skylytics.com  / test123  → ATL manager
    jfk.manager@skylytics.com  / test123  → JFK manager
    ord.manager@skylytics.com  / test123  → ORD manager
    admin@skylytics.com        / test123  → ADMIN (no airport scope)
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.core.config import settings
from app.core.security import get_password_hash
from app.modules.users.models import User, UserRole

ACCOUNTS = [
    {
        "email":        "atl.manager@skylytics.com",
        "full_name":    "ATL Manager",
        "role":         UserRole.MANAGER,
        "airport_code": "ATL",
        "password":     "test123",
    },
    {
        "email":        "jfk.manager@skylytics.com",
        "full_name":    "JFK Manager",
        "role":         UserRole.MANAGER,
        "airport_code": "JFK",
        "password":     "test123",
    },
    {
        "email":        "ord.manager@skylytics.com",
        "full_name":    "ORD Manager",
        "role":         UserRole.MANAGER,
        "airport_code": "ORD",
        "password":     "test123",
    },
    {
        "email":        "admin@skylytics.com",
        "full_name":    "Skylytics Admin",
        "role":         UserRole.ADMIN,
        "airport_code": None,
        "password":     "test123",
    },
]


async def main() -> None:
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for acct in ACCOUNTS:
            result = await session.execute(
                select(User).where(User.email == acct["email"])
            )
            existing = result.scalars().first()

            if existing:
                # Update airport_code and role in case they changed
                existing.role         = acct["role"]
                existing.airport_code = acct["airport_code"]
                existing.is_active    = True
                session.add(existing)
                print(f"  UPDATED  {acct['email']} → airport={acct['airport_code']}")
            else:
                user = User(
                    email         = acct["email"].lower(),
                    full_name     = acct["full_name"],
                    password_hash = get_password_hash(acct["password"]),
                    role          = acct["role"],
                    airport_code  = acct["airport_code"],
                    is_active     = True,
                    is_verified   = True,
                )
                session.add(user)
                print(f"  CREATED  {acct['email']} → airport={acct['airport_code']}")

        await session.commit()

    await engine.dispose()
    print("\nDone. Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
