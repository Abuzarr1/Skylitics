from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Any, List
from datetime import datetime, timezone

from app.db.session import get_db
from app.modules.saved.models import SavedFlight
from app.modules.auth.router import get_current_user
from app.modules.users.models import User

router = APIRouter()


class SavedFlightCreate(BaseModel):
    callsign: str
    route: str
    notify: bool = True


class SavedFlightResponse(BaseModel):
    id: str
    callsign: str
    route: str
    notify: bool
    created_at: str


@router.get("/", response_model=List[SavedFlightResponse])
async def get_saved_flights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return all saved flights for the authenticated user."""
    result = await db.execute(
        select(SavedFlight)
        .where(SavedFlight.user_id == current_user.id)
        .order_by(SavedFlight.created_at.desc())
    )
    flights = result.scalars().all()
    return [
        SavedFlightResponse(
            id=str(f.id),
            callsign=f.callsign,
            route=f.route,
            notify=f.notify,
            created_at=f.created_at.isoformat() if f.created_at else "",
        )
        for f in flights
    ]


@router.post("/", response_model=SavedFlightResponse, status_code=201)
async def save_flight(
    flight_in: SavedFlightCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Save a flight to the authenticated user's watchlist."""
    # Prevent duplicates for same user + callsign
    existing = await db.execute(
        select(SavedFlight).where(
            SavedFlight.user_id == current_user.id,
            SavedFlight.callsign == flight_in.callsign.upper(),
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Flight already in watchlist")

    saved = SavedFlight(
        user_id=current_user.id,
        callsign=flight_in.callsign.upper(),
        route=flight_in.route,
        notify=flight_in.notify,
    )
    db.add(saved)
    await db.commit()
    await db.refresh(saved)

    return SavedFlightResponse(
        id=str(saved.id),
        callsign=saved.callsign,
        route=saved.route,
        notify=saved.notify,
        created_at=saved.created_at.isoformat() if saved.created_at else "",
    )


@router.delete("/{saved_id}", status_code=200)
async def delete_saved_flight(
    saved_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Remove a flight from the authenticated user's watchlist."""
    result = await db.execute(
        select(SavedFlight).where(
            SavedFlight.id == saved_id,
            SavedFlight.user_id == current_user.id,
        )
    )
    saved = result.scalars().first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved flight not found")

    await db.delete(saved)
    await db.commit()
    return {"message": "Flight removed from watchlist"}
