-- Migration number: 002 
-- Created at: 2025-08-01 02:08:00
-- Description: Create the phone_numbers table

CREATE TABLE phone_numbers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vapi_phone_number_id TEXT NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
