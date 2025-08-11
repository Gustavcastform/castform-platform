-- Add new columns to Calls table for enhanced call tracking
ALTER TABLE Calls ADD COLUMN status TEXT DEFAULT 'in-progress';
ALTER TABLE Calls ADD COLUMN end_reason TEXT;
ALTER TABLE Calls ADD COLUMN transcript TEXT;
ALTER TABLE Calls ADD COLUMN recording_url TEXT;
