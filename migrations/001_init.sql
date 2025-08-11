-- Users
CREATE TABLE Users (
    id TEXT UNIQUE PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agents
CREATE TABLE Agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    agent_goal TEXT NOT NULL,
    website_url TEXT,
    website_summary TEXT,
    tone TEXT NOT NULL DEFAULT 'neutral',
    pacing TEXT NOT NULL DEFAULT 'normal',
    transcriber_provider TEXT NOT NULL,
    transcriber_model TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    voice_provider TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    first_message TEXT,
    end_call_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX agents_user_id_index ON Agents(user_id);

-- ContactLists
CREATE TABLE ContactLists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
CREATE INDEX contactlists_user_id_index ON ContactLists(user_id);

-- Contacts
CREATE TABLE Contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    gender TEXT,
    location TEXT,
    job TEXT,
    info TEXT,
    list_id INTEGER NOT NULL,
    FOREIGN KEY (list_id) REFERENCES ContactLists(id)
);
CREATE INDEX contacts_list_id_index ON Contacts(list_id);

-- Calls
CREATE TABLE Calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    logs TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES Agents(id),
    FOREIGN KEY (contact_id) REFERENCES Contacts(id)
);

-- Teams (stub)
CREATE TABLE Teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT
);

-- Billing (stub)
CREATE TABLE Billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT
);

-- Calendar
CREATE TABLE Calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    provider TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    connected_at TIMESTAMP NOT NULL,
    bookings_count INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
