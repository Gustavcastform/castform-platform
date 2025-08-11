-- Drop the existing Calls table and recreate with new structure
DROP TABLE IF EXISTS Calls;

-- Create calls table for storing call records
CREATE TABLE Calls (
    id TEXT PRIMARY KEY,                    -- UUID for the call record
    user_id TEXT NOT NULL,                  -- Foreign key to Users.id
    contact_id TEXT NOT NULL,               -- Foreign key to Contacts.id
    agent_id TEXT NOT NULL,                 -- Foreign key to Agents.id
    call_name TEXT NOT NULL,                -- Generated name for display
    duration INTEGER,                       -- Call duration in seconds
    cost REAL,                             -- Call cost if available
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES Agents(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_calls_user_id ON Calls(user_id);
CREATE INDEX idx_calls_contact_id ON Calls(contact_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_calls_updated_at
    AFTER UPDATE ON Calls
    FOR EACH ROW
BEGIN
    UPDATE Calls SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
