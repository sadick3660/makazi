"""
FastAPI Application Entry Point
================================
NyumbaLink — AI-Powered Accommodation Brokerage API
Dar es Salaam, Tanzania.
"""
from __future__ import annotations

import structlog
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.ml.price_predictor import price_predictor

logger = structlog.get_logger(__name__)
settings = get_settings()

# ── API metadata ──────────────────────────────────────────────────────────────

API_TITLE       = "NyumbaLink API"
API_VERSION     = "2.0.0"
API_DESCRIPTION = """
## NyumbaLink — AI-Powered Accommodation Brokerage System
**Dar es Salaam, Tanzania**

---

### Overview
NyumbaLink is a full-stack platform for finding and listing rental accommodation across
Dar es Salaam's five municipalities. It connects **Seekers** (tenants) with verified
**Landlords** through AI-powered search, fair-price detection, and M-Pesa payments.

### Authentication
All protected endpoints require a **Bearer JWT token** in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /api/v1/auth/login`.  
Access tokens expire after **24 hours**. Use `POST /api/v1/auth/refresh` to renew.

### Roles
| Role | Description |
|------|-------------|
| `SEEKER` | Tenant searching for accommodation |
| `LANDLORD` | Property owner managing listings |
| `ADMIN` | Platform administrator with full access |

### Base URL
- **Development:** `http://localhost:8000`
- **Production:** `https://api.nyumbalink.co.tz`

### Interactive Docs
- **Swagger UI:** `/docs`
- **ReDoc:** `/redoc`
- **OpenAPI JSON:** `/openapi.json`
"""

CONTACT = {
    "name":  "NyumbaLink Support",
    "email": "mnemosadick@gmail.com",
    "url":   "https://nyumbalink.co.tz",
}

LICENSE = {
    "name": "MIT License",
    "url":  "https://opensource.org/licenses/MIT",
}

TAGS_METADATA = [
    {
        "name": "Auth",
        "description": (
            "Registration, login, JWT token management, and profile updates. "
            "Supports three roles: **SEEKER**, **LANDLORD**, **ADMIN**."
        ),
    },
    {
        "name": "Properties",
        "description": (
            "Full property CRUD — hostels, rooms, apartments, houses. "
            "Includes image/video upload, amenity management, and advanced search filters "
            "(ward, type, rent range, gender restriction)."
        ),
    },
    {
        "name": "Rentals",
        "description": (
            "Tenant-facing features: save favourites, submit rental applications, "
            "book property viewing appointments."
        ),
    },
    {
        "name": "Payments",
        "description": (
            "Initiate and track payments via M-Pesa, Airtel Money, Tigo Pesa, "
            "HaloPesa, or card. Auto-generates receipts."
        ),
    },
    {
        "name": "Reviews",
        "description": (
            "Submit, read, and moderate property reviews. "
            "Includes rule-based sentiment analysis (POSITIVE / NEUTRAL / NEGATIVE)."
        ),
    },
    {
        "name": "Messaging",
        "description": (
            "Direct seeker ↔ landlord messaging threads. "
            "Also logs AI chatbot conversation turns."
        ),
    },
    {
        "name": "Notifications",
        "description": "In-app notifications with read/unread state management.",
    },
    {
        "name": "Admin",
        "description": (
            "Admin-only endpoints: platform analytics, user management (suspend/activate), "
            "property verification, complaint resolution, system settings, audit logs."
        ),
    },
    {
        "name": "Price Intelligence",
        "description": (
            "XGBoost hedonic price prediction engine. "
            "Predicts fair market rent and flags overpriced (dalali) listings."
        ),
    },
    {
        "name": "Conversation",
        "description": (
            "Bilingual AI chatbot (Swahili + English). "
            "REST endpoint and real-time WebSocket channel."
        ),
    },
    {
        "name": "Amenities",
        "description": "Points-of-interest near properties — hospitals, transit nodes, cafeterias.",
    },
    {
        "name": "System",
        "description": "Health check and system status.",
    },
]


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting NyumbaLink API — warming ML price predictor…")
    price_predictor._ensure_loaded()
    logger.info("ML model ready.")
    yield
    logger.info("NyumbaLink API shutting down.")


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        description=API_DESCRIPTION,
        contact=CONTACT,
        license_info=LICENSE,
        openapi_tags=TAGS_METADATA,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
        swagger_ui_parameters={
            "defaultModelsExpandDepth": 2,
            "defaultModelExpandDepth": 3,
            "docExpansion": "list",
            "filter": True,
            "tryItOutEnabled": True,
            "persistAuthorization": True,
        },
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── GZip ──────────────────────────────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(api_v1_router)

    # Also register new routers (they share the same v1 prefix)
    try:
        from app.api.v1.routers.properties    import router as properties_router
        from app.api.v1.routers.payments      import router as payments_router
        from app.api.v1.routers.reviews       import router as reviews_router
        from app.api.v1.routers.messaging     import router as messaging_router
        from app.api.v1.routers.notifications import router as notifications_router
        from app.api.v1.routers.admin         import router as admin_router
        from fastapi import APIRouter
        extra = APIRouter(prefix="/api/v1")
        extra.include_router(properties_router)
        extra.include_router(payments_router)
        extra.include_router(reviews_router)
        extra.include_router(messaging_router)
        extra.include_router(notifications_router)
        extra.include_router(admin_router)
        app.include_router(extra)
    except ImportError:
        pass  # routers not yet created — safe to ignore

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get(
        "/health",
        tags=["System"],
        summary="Health check",
        response_description="Service status, version, and environment",
        responses={
            200: {
                "description": "Service is healthy",
                "content": {
                    "application/json": {
                        "example": {
                            "status": "ok",
                            "service": "NyumbaLink API",
                            "version": API_VERSION,
                            "environment": "development",
                        }
                    }
                },
            }
        },
    )
    async def health_check() -> dict:
        return {
            "status": "ok",
            "service": API_TITLE,
            "version": API_VERSION,
            "environment": settings.APP_ENV,
        }

    # ── Global exception handler ───────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception", path=request.url.path, error=str(exc))
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
        )

    return app


app = create_app()
