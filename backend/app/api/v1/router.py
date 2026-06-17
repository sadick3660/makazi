"""
API v1 root router — aggregates all sub-routers.
Base prefix: /api/v1
"""
from fastapi import APIRouter

# Original routers
from app.api.v1.routers.amenities    import router as amenities_router
from app.api.v1.routers.auth         import router as auth_router
from app.api.v1.routers.conversation import router as conversation_router
from app.api.v1.routers.price        import router as price_router

# New routers (from dbschema.sql rebuild)
from app.api.v1.routers.properties    import router as properties_router
from app.api.v1.routers.rentals       import router as rentals_router
from app.api.v1.routers.payments      import router as payments_router
from app.api.v1.routers.reviews       import router as reviews_router
from app.api.v1.routers.messaging     import router as messaging_router
from app.api.v1.routers.notifications import router as notifications_router
from app.api.v1.routers.admin         import router as admin_router

api_v1_router = APIRouter(prefix="/api/v1")

# Auth & identity
api_v1_router.include_router(auth_router)

# Property search & management
api_v1_router.include_router(properties_router)
api_v1_router.include_router(amenities_router)

# Tenant features
api_v1_router.include_router(rentals_router)

# Payments & receipts
api_v1_router.include_router(payments_router)

# Reviews
api_v1_router.include_router(reviews_router)

# Messaging
api_v1_router.include_router(messaging_router)

# Notifications
api_v1_router.include_router(notifications_router)

# AI / price prediction
api_v1_router.include_router(price_router)

# Bilingual chatbot
api_v1_router.include_router(conversation_router)

# Admin
api_v1_router.include_router(admin_router)
