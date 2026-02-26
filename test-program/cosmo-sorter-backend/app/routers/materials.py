from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schemas.material import Material, MaterialCreate, MaterialUpdate, MaterialListResponse, MaterialCategory
from app.schemas.user import User
from app.routers.auth import get_current_user
from app.services.material_service import material_service
from app.services.universe_service import universe_service

router = APIRouter()


@router.get("/materials", response_model=MaterialListResponse)
async def list_materials(
    universe_id: Optional[str] = Query(None, description="Filter by universe"),
    category: Optional[MaterialCategory] = Query(None, description="Filter by category"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags (comma separated)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    if universe_id:
        # Verify the universe exists and user has access
        universe = await universe_service.get_by_id(universe_id)
        if not universe:
            raise HTTPException(status_code=404, detail="Universe not found")
        if universe["user_id"] != current_user.id and current_user.id not in universe.get("collaborators", []):
            raise HTTPException(status_code=403, detail="Not authorized to access this universe")
        materials = await material_service.get_by_universe(universe_id, skip, page_size)
        total = len(materials)  # This is approximate; for production, use count_documents
    else:
        materials = await material_service.search(
            user_id=current_user.id,
            universe_id=universe_id,
            category=category,
            tags=tags,
            skip=skip,
            limit=page_size
        )
        total = await material_service.count_by_user(current_user.id)

    return MaterialListResponse(
        items=materials,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/materials", response_model=Material, status_code=status.HTTP_201_CREATED)
async def create_material(
    material_create: MaterialCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify the universe exists and user has access
    universe = await universe_service.get_by_id(material_create.universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if universe["user_id"] != current_user.id and current_user.id not in universe.get("collaborators", []):
        raise HTTPException(status_code=403, detail="Not authorized to add materials to this universe")

    material = await material_service.create(current_user.id, material_create)
    return material


@router.get("/materials/{material_id}", response_model=Material)
async def get_material(
    material_id: str,
    current_user: User = Depends(get_current_user)
):
    material = await material_service.get_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material["user_id"] != current_user.id:
        # Check if user is a collaborator in the universe
        universe = await universe_service.get_by_id(material["universe_id"])
        if not universe or current_user.id not in universe.get("collaborators", []):
            raise HTTPException(status_code=403, detail="Not authorized to access this material")
    return material


@router.put("/materials/{material_id}", response_model=Material)
async def update_material(
    material_id: str,
    material_update: MaterialUpdate,
    current_user: User = Depends(get_current_user)
):
    material = await material_service.get_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this material")

    updated = await material_service.update(material_id, material_update)
    return updated


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: str,
    current_user: User = Depends(get_current_user)
):
    material = await material_service.get_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this material")

    await material_service.delete(material_id)
    return None