from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, materials, universes, ai, sync

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(universes.router, prefix=settings.API_V1_STR, tags=["universes"])
app.include_router(materials.router, prefix=settings.API_V1_STR, tags=["materials"])
app.include_router(ai.router, prefix=settings.API_V1_STR, tags=["ai"])
app.include_router(sync.router, prefix=settings.API_V1_STR, tags=["sync"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Cosmo Sorter API", "version": settings.VERSION}