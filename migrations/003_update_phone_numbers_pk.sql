-- Migration number: 003
-- Created at: 2025-08-01 02:15:00
-- Description: Change phone_numbers primary key to auto-incrementing integer.

DROP TABLE IF EXISTS phone_numbers;

CREATE TABLE phone_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    vapi_phone_number_id TEXT NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
