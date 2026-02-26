from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import User
from app.schemas.universe import UniverseCreate
from app.schemas.material import MaterialCreate, MaterialCategory
from app.routers.auth import get_current_user
from app.services.universe_service import universe_service
from app.services.material_service import material_service

router = APIRouter()


async def get_or_create_migration_universe(user_id: str) -> str:
    """Get or create a default universe for migration."""
    universes = await universe_service.get_by_user(user_id)
    for universe in universes:
        if universe.get("name") == "默认宇宙(迁移)":
            return universe["id"]
    
    # Create a new migration universe
    universe_create = UniverseCreate(name="默认宇宙(迁移)", description="由 LocalStorage 迁移而来的素材")
    universe = await universe_service.create(user_id, universe_create)
    return universe["id"]


def map_category(frontend_category: str) -> MaterialCategory:
    """Map frontend category to MaterialCategory."""
    mapping = {
        "character": MaterialCategory.CHARACTER,
        "geography": MaterialCategory.LOCATION,
        "items": MaterialCategory.ITEM,
        "worldview": MaterialCategory.CONCEPT,
    }
    return mapping.get(frontend_category, MaterialCategory.CONCEPT)


@router.post("/sync/localstorage")
async def sync_localstorage(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Migrate data from frontend LocalStorage to backend database.
    
    Expected data format:
    {
        "text_input": "optional text input",
        "analysis_data": {
            "character": { ... },
            "worldview": { ... },
            "geography": { ... },
            "items": { ... }
        }
    }
    """
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")
    
    # Get or create migration universe
    universe_id = await get_or_create_migration_universe(current_user.id)
    
    analysis_data = data.get("analysis_data", {})
    if not analysis_data:
        raise HTTPException(status_code=400, detail="No analysis data found")
    
    created_materials: List[Dict[str, Any]] = []
    
    # Process each category
    for frontend_category, content in analysis_data.items():
        if not isinstance(content, dict):
            continue
            
        category = map_category(frontend_category)
        
        # Create material
        material_create = MaterialCreate(
            category=category,
            content=content,
            universe_id=universe_id,
            attachments=[],
            ai_metadata=None
        )
        
        material = await material_service.create(current_user.id, material_create)
        created_materials.append({
            "id": material["id"],
            "category": material["category"],
            "name": content.get("name", "未命名")
        })
    
    return {
        "message": "Migration completed successfully",
        "universe_id": universe_id,
        "created_materials": created_materials,
        "total_created": len(created_materials)
    }