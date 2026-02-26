from typing import Optional
from bson import ObjectId
from app.core.database import db
from app.models.user import UserModel
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import get_password_hash, verify_password


class UserService:
    collection_name = "users"

    async def get_by_id(self, user_id: str) -> Optional[UserModel]:
        collection = db.get_collection(self.collection_name)
        user_data = await collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return UserModel(**user_data)
        return None

    async def get_by_username(self, username: str) -> Optional[UserModel]:
        collection = db.get_collection(self.collection_name)
        user_data = await collection.find_one({"username": username})
        if user_data:
            return UserModel(**user_data)
        return None

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        collection = db.get_collection(self.collection_name)
        user_data = await collection.find_one({"email": email})
        if user_data:
            return UserModel(**user_data)
        return None

    async def create(self, user_create: UserCreate) -> UserModel:
        collection = db.get_collection(self.collection_name)
        # Check if username or email already exists
        existing_user = await collection.find_one({
            "$or": [
                {"username": user_create.username},
                {"email": user_create.email}
            ]
        })
        if existing_user:
            raise ValueError("Username or email already registered")

        user_dict = user_create.dict(exclude={"password"})
        user_dict["password_hash"] = get_password_hash(user_create.password)
        user_dict["_id"] = ObjectId()

        result = await collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return UserModel(**user_dict)

    async def update(self, user_id: str, user_update: UserUpdate) -> Optional[UserModel]:
        collection = db.get_collection(self.collection_name)
        update_data = user_update.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))

        if update_data:
            await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
        return await self.get_by_id(user_id)

    async def authenticate(self, username: str, password: str) -> Optional[UserModel]:
        user = await self.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def delete(self, user_id: str) -> bool:
        collection = db.get_collection(self.collection_name)
        result = await collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0


user_service = UserService()