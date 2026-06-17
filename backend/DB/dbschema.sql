
-- AI-Based Accommodation Brokerage System Database Schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK(role IN ('SEEKER','LANDLORD','ADMIN')),
    profile_image TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE landlord_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    national_id VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verification_date TIMESTAMP,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES users(id),
    property_type VARCHAR(20) CHECK(property_type IN ('HOSTEL','ROOM','APARTMENT','HOUSE')),
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    monthly_rent DECIMAL(12,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    size_sqm DECIMAL(10,2),
    gender_restriction VARCHAR(20) CHECK(gender_restriction IN ('MALE','FEMALE','MIXED')),
    capacity INTEGER,
    availability_status VARCHAR(20) DEFAULT 'AVAILABLE',
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE property_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    video_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE amenities (
    id SERIAL PRIMARY KEY,
    amenity_name VARCHAR(100)
);

CREATE TABLE property_amenities (
    property_id UUID REFERENCES properties(id),
    amenity_id INTEGER REFERENCES amenities(id),
    PRIMARY KEY(property_id, amenity_id)
);

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    application_status VARCHAR(20) DEFAULT 'PENDING',
    move_in_date DATE,
    message TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    appointment_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    payment_status VARCHAR(20),
    paid_at TIMESTAMP
);

CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    receipt_number VARCHAR(100) UNIQUE,
    receipt_url TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    landlord_id UUID REFERENCES users(id),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    review_text TEXT,
    sentiment VARCHAR(20),
    moderation_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID REFERENCES users(id),
    landlord_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES users(id),
    message TEXT,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    question TEXT,
    response TEXT,
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    recommendation_score DECIMAL(5,2),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    predicted_price DECIMAL(12,2),
    confidence_score DECIMAL(5,2),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fraud_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    fraud_score DECIMAL(5,2),
    reason TEXT,
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    notification_type VARCHAR(30),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complainant_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    complaint_text TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE property_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    total_views INTEGER DEFAULT 0,
    total_inquiries INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    search_query TEXT,
    location VARCHAR(255),
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255),
    entity_name VARCHAR(100),
    entity_id UUID,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
