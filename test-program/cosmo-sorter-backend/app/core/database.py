from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    database = None

    async def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.database = self.client[settings.MONGODB_DB_NAME]
        print(f"Connected to MongoDB: {settings.MONGODB_URL}")

    async def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

    def get_collection(self, collection_name: str):
        return self.database[collection_name]

db = Database()