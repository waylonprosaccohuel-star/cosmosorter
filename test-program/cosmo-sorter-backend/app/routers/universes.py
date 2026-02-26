from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.universe import Universe, UniverseCreate, UniverseUpdate
from app.schemas.user import User
from app.routers.auth import get_current_user
from app.services.universe_service import universe_service

router = APIRouter()


@router.get("/universes", response_model=List[Universe])
async def list_universes(current_user: User = Depends(get_current_user)):
    universes = await universe_service.get_by_user(current_user.id)
    return universes


@router.post("/universes", response_model=Universe, status_code=status.HTTP_201_CREATED)
async def create_universe(
    universe_create: UniverseCreate,
    current_user: User = Depends(get_current_user)
):
    universe = await universe_service.create(current_user.id, universe_create)
    return universe


@router.get("/universes/{universe_id}", response_model=Universe)
async def get_universe(
    universe_id: str,
    current_user: User = Depends(get_current_user)
):
    universe = await universe_service.get_by_id(universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if universe["user_id"] != current_user.id and current_user.id not in universe.get("collaborators", []):
        raise HTTPException(status_code=403, detail="Not authorized to access this universe")
    return universe


@router.put("/universes/{universe_id}", response_model=Universe)
async def update_universe(
    universe_id: str,
    universe_update: UniverseUpdate,
    current_user: User = Depends(get_current_user)
):
    universe = await universe_service.get_by_id(universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if universe["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this universe")
    updated = await universe_service.update(universe_id, universe_update)
    return updated


@router.delete("/universes/{universe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_universe(
    universe_id: str,
    current_user: User = Depends(get_current_user)
):
    universe = await universe_service.get_by_id(universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if universe["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this universe")
    await universe_service.delete(universe_id)
    return None