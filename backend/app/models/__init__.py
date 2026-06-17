"""
Import all ORM models here so Alembic auto-discovers them via Base.metadata.
"""
from app.models.user            import User, UserRole, AccountStatus
from app.models.landlord_profile import LandlordProfile
from app.models.property        import Property, PropertyImage, PropertyVideo, Amenity, PropertyType, GenderRestriction, AvailabilityStatus
from app.models.rental          import Favorite, RentalApplication, Appointment
from app.models.payment         import Payment, Receipt
from app.models.review          import Review
from app.models.messaging       import Conversation, Message, ChatbotConversation
from app.models.ai_models       import AIRecommendation, PricePrediction, FraudDetectionLog, PropertyAnalytics, SearchHistory
from app.models.system          import Notification, Complaint, AuditLog, SystemSetting

__all__ = [
    # Users
    "User", "UserRole", "AccountStatus",
    "LandlordProfile",
    # Properties
    "Property", "PropertyImage", "PropertyVideo", "Amenity",
    "PropertyType", "GenderRestriction", "AvailabilityStatus",
    # Rentals
    "Favorite", "RentalApplication", "Appointment",
    # Payments
    "Payment", "Receipt",
    # Reviews
    "Review",
    # Messaging
    "Conversation", "Message", "ChatbotConversation",
    # AI / Analytics
    "AIRecommendation", "PricePrediction", "FraudDetectionLog",
    "PropertyAnalytics", "SearchHistory",
    # System
    "Notification", "Complaint", "AuditLog", "SystemSetting",
]
