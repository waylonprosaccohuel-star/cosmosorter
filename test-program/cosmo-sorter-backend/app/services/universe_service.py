from typing import List, Optional
from bson import ObjectId
from app.core.database import db
from app.schemas.universe import UniverseCreate, UniverseUpdate


class UniverseService:
    collection_name = "universes"

    async def get_by_id(self, universe_id: str) -> Optional[dict]:
        collection = db.get_collection(self.collection_name)
        universe = await collection.find_one({"_id": ObjectId(universe_id)})
        if universe:
            universe["id"] = str(universe["_id"])
            return universe
        return None

    async def get_by_user(self, user_id: str) -> List[dict]:
        collection = db.get_collection(self.collection_name)
        cursor = collection.find({"user_id": user_id})
        universes = []
        async for universe in cursor:
            universe["id"] = str(universe["_id"])
            universes.append(universe)
        return universes

    async def create(self, user_id: str, universe_create: UniverseCreate) -> dict:
        collection = db.get_collection(self.collection_name)
        universe_dict = universe_create.dict()
        universe_dict["user_id"] = user_id
        universe_dict["collaborators"] = []
        universe_dict["_id"] = ObjectId()

        result = await collection.insert_one(universe_dict)
        universe_dict["id"] = str(result.inserted_id)
        return universe_dict

    async def update(self, universe_id: str, universe_update: UniverseUpdate) -> Optional[dict]:
        collection = db.get_collection(self.collection_name)
        update_data = universe_update.dict(exclude_unset=True)
        if update_data:
            await collection.update_one(
                {"_id": ObjectId(universe_id)},
                {"$set": update_data}
            )
        return await self.get_by_id(universe_id)

    async def delete(self, universe_id: str) -> bool:
        collection = db.get_collection(self.collection_name)
        result = await collection.delete_one({"_id": ObjectId(universe_id)})
        return result.deleted_count > 0

    async def add_collaborator(self, universe_id: str, user_id: str) -> bool:
        collection = db.get_collection(self.collection_name)
        result = await collection.update_one(
            {"_id": ObjectId(universe_id)},
            {"$addToSet": {"collaborators": user_id}}
        )
        return result.modified_count > 0

    async def remove_collaborator(self, universe_id: str, user_id: str) -> bool:
        collection = db.get_collection(self.collection_name)
        result = await collection.update_one(
            {"_id": ObjectId(universe_id)},
            {"$pull": {"collaborators": user_id}}
        )
        return result.modified_count > 0


universe_service = UniverseService()