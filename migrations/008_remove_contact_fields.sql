-- Remove unnecessary fields from Contacts table
-- This migration removes job, location, age, and gender fields

-- Create a new table without the unwanted fields
CREATE TABLE Contacts_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    info TEXT,
    list_id INTEGER NOT NULL,
    FOREIGN KEY (list_id) REFERENCES ContactLists(id)
);

-- Copy data from old table to new table
INSERT INTO Contacts_new (id, name, phone_number, email, info, list_id)
SELECT id, name, phone_number, email, info, list_id FROM Contacts;

-- Drop the old table
DROP TABLE Contacts;

-- Rename the new table
ALTER TABLE Contacts_new RENAME TO Contacts;

-- Recreate the index
CREATE INDEX contacts_list_id_index ON Contacts(list_id);
