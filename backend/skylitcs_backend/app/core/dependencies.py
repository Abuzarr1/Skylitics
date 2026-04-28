from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable, Any

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db
# In the future we will import the real user fetching functions here
# from app.modules.users.service import get_user_by_id

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> Any:
    """ Dependency to retrieve the logged in User model from DB (Auth Mock) """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    # user = await get_user_by_id(db, id=token_data)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user
    
    # Returning a mock user dictionary for now until service layer is built
    return {"id": token_data, "role": payload.get("role", "PUBLIC")}

async def require_role(allowed_roles: list[str]) -> Callable:
    """ Dependency factory for Role-Based Access Control """
    async def role_checker(current_user: Any = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough privileges"
            )
        return current_user
    return role_checker
