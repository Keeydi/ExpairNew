-- =====================================================
-- EXPAIR DATABASE SCHEMA
-- Generated from Django Models
-- =====================================================

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users_tbl (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    profilepic VARCHAR(100),
    bio VARCHAR(150),
    location VARCHAR(300),
    ratingcount INTEGER DEFAULT 0,
    avgstars DECIMAL(3,2) DEFAULT 0.00,
    tot_xppts INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    userverifyid VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    links JSONB DEFAULT '[]'::jsonb,
    verification_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 2. PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_token_tbl (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =====================================================
-- 3. GENERAL SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS genskills_tbl (
    genskills_id SERIAL PRIMARY KEY,
    gencateg VARCHAR(100) UNIQUE NOT NULL
);

-- =====================================================
-- 4. SPECIALIZED SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS specskills_tbl (
    specskills_id SERIAL PRIMARY KEY,
    speccateg VARCHAR(150) UNIQUE NOT NULL,
    genskills_id INTEGER NOT NULL REFERENCES genskills_tbl(genskills_id) ON DELETE RESTRICT
);

-- =====================================================
-- 5. USER INTERESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS userinterests_tbl (
    userinterests_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    genskills_id INTEGER NOT NULL REFERENCES genskills_tbl(genskills_id) ON DELETE CASCADE
);

-- =====================================================
-- 6. USER SKILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS userskills_tbl (
    userskills_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    specskills_id INTEGER NOT NULL REFERENCES specskills_tbl(specskills_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, specskills_id)
);

-- =====================================================
-- 7. USER CREDENTIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS usercredentials_tbl (
    usercred_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    credential_title VARCHAR(150) NOT NULL,
    issuer VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    cred_id VARCHAR(100),
    cred_url TEXT,
    genskills_id INTEGER REFERENCES genskills_tbl(genskills_id) ON DELETE RESTRICT,
    specskills_id INTEGER REFERENCES specskills_tbl(specskills_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. TRADE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tradereq_tbl (
    tradereq_id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    responder_id INTEGER REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    reqname VARCHAR(100) NOT NULL,
    reqdeadline DATE,
    status VARCHAR(15),
    exchangename VARCHAR(255),
    classifiedcategory VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    requester_rated BOOLEAN DEFAULT FALSE,
    responder_rated BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 9. TRADE DETAILS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_details_tbl (
    tradedetails_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    skillprof VARCHAR(13),
    modedel VARCHAR(25),
    reqtype VARCHAR(35),
    contextpic VARCHAR(100),
    reqbio VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_xp INTEGER DEFAULT 0,
    UNIQUE(tradereq_id, user_id)
);

-- =====================================================
-- 10. EVALUATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluation_tbl (
    evaluation_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    taskcomplexity INTEGER NOT NULL,
    timecommitment INTEGER NOT NULL,
    skilllevel INTEGER NOT NULL,
    evaluationdescription VARCHAR(500) NOT NULL,
    requester_evaluation_status VARCHAR(20),
    responder_evaluation_status VARCHAR(20),
    requester_responded_at TIMESTAMP WITH TIME ZONE,
    responder_responded_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 11. TRADE INTERESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_interests_tbl (
    trade_interests_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    interested_user_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) DEFAULT 'PENDING',
    UNIQUE(tradereq_id, interested_user_id)
);

-- =====================================================
-- 12. TRADE HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tradehis_tbl (
    tradehis_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE,
    requester_proof VARCHAR(100),
    responder_proof VARCHAR(100),
    requester_proof_status VARCHAR(20) DEFAULT 'PENDING',
    responder_proof_status VARCHAR(20) DEFAULT 'PENDING'
);

-- =====================================================
-- 13. REPUTATION SYSTEM TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS repsys_tbl (
    repsys_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    requester_starcount INTEGER,
    responder_starcount INTEGER,
    requester_rating_desc VARCHAR(500),
    responder_rating_desc VARCHAR(500),
    requester_rated_at TIMESTAMP WITH TIME ZONE,
    responder_rated_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 14. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations_tbl (
    conversation_id SERIAL PRIMARY KEY,
    tradereq_id INTEGER NOT NULL REFERENCES tradereq_tbl(tradereq_id) ON DELETE CASCADE,
    requester_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    responder_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tradereq_id)
);

-- =====================================================
-- 15. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages_tbl (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations_tbl(conversation_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users_tbl(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_tbl(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users_tbl(created_at);

-- Trade request indexes
CREATE INDEX IF NOT EXISTS idx_tradereq_requester ON tradereq_tbl(requester_id);
CREATE INDEX IF NOT EXISTS idx_tradereq_responder ON tradereq_tbl(responder_id);
CREATE INDEX IF NOT EXISTS idx_tradereq_status ON tradereq_tbl(status);
CREATE INDEX IF NOT EXISTS idx_tradereq_created_at ON tradereq_tbl(created_at);

-- Trade interests indexes
CREATE INDEX IF NOT EXISTS idx_trade_interests_user ON trade_interests_tbl(interested_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_interests_status ON trade_interests_tbl(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages_tbl(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages_tbl(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages_tbl(created_at);

-- Password reset token indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_token_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_token_tbl(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_token_tbl(expires_at);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE users_tbl IS 'Main user accounts table';
COMMENT ON TABLE genskills_tbl IS 'General skill categories';
COMMENT ON TABLE specskills_tbl IS 'Specialized skills within general categories';
COMMENT ON TABLE tradereq_tbl IS 'Trade requests made by users';
COMMENT ON TABLE trade_details_tbl IS 'Detailed information about trade requests';
COMMENT ON TABLE evaluation_tbl IS 'AI-generated evaluations for trade requests';
COMMENT ON TABLE trade_interests_tbl IS 'User interests in trade requests';
COMMENT ON TABLE tradehis_tbl IS 'Completed trade history';
COMMENT ON TABLE repsys_tbl IS 'Reputation and rating system';
COMMENT ON TABLE conversations_tbl IS '1:1 conversations for trade requests';
COMMENT ON TABLE messages_tbl IS 'Messages within conversations';
