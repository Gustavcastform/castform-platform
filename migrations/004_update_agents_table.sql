DROP TABLE IF EXISTS Agents;

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