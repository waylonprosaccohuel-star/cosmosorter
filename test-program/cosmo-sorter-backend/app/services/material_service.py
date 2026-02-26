from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from app.core.database import db
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialCategory


class MaterialService:
    collection_name = "materials"

    async def get_by_id(self, material_id: str) -> Optional[dict]:
        collection = db.get_collection(self.collection_name)
        material = await collection.find_one({"_id": ObjectId(material_id)})
        if material:
            material["id"] = str(material["_id"])
            return material
        return None

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        collection = db.get_collection(self.collection_name)
        cursor = collection.find({"user_id": user_id}).skip(skip).limit(limit)
        materials = []
        async for material in cursor:
            material["id"] = str(material["_id"])
            materials.append(material)
        return materials

    async def get_by_universe(self, universe_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        collection = db.get_collection(self.collection_name)
        cursor = collection.find({"universe_id": universe_id}).skip(skip).limit(limit)
        materials = []
        async for material in cursor:
            material["id"] = str(material["_id"])
            materials.append(material)
        return materials

    async def create(self, user_id: str, material_create: MaterialCreate) -> dict:
        collection = db.get_collection(self.collection_name)
        material_dict = material_create.dict()
        material_dict["user_id"] = user_id
        material_dict["version"] = 1
        now = datetime.utcnow()
        material_dict["created_at"] = now
        material_dict["updated_at"] = now
        material_dict["_id"] = ObjectId()

        result = await collection.insert_one(material_dict)
        material_dict["id"] = str(result.inserted_id)
        return material_dict

    async def update(self, material_id: str, material_update: MaterialUpdate) -> Optional[dict]:
        collection = db.get_collection(self.collection_name)
        update_data = material_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await collection.update_one(
                {"_id": ObjectId(material_id)},
                {"$set": update_data}
            )
        return await self.get_by_id(material_id)

    async def delete(self, material_id: str) -> bool:
        collection = db.get_collection(self.collection_name)
        result = await collection.delete_one({"_id": ObjectId(material_id)})
        return result.deleted_count > 0

    async def search(
        self,
        user_id: str,
        universe_id: Optional[str] = None,
        category: Optional[MaterialCategory] = None,
        tags: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[dict]:
        collection = db.get_collection(self.collection_name)
        query: Dict[str, Any] = {"user_id": user_id}
        if universe_id:
            query["universe_id"] = universe_id
        if category:
            query["category"] = category
        if tags:
            query["ai_metadata.tags"] = {"$all": tags}

        cursor = collection.find(query).skip(skip).limit(limit)
        materials = []
        async for material in cursor:
            material["id"] = str(material["_id"])
            materials.append(material)
        return materials

    async def count_by_user(self, user_id: str) -> int:
        collection = db.get_collection(self.collection_name)
        return await collection.count_documents({"user_id": user_id})


material_service = MaterialService()