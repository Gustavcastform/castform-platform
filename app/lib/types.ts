export type User = {
    id: string;
    name: string;
    email: string;
    image?: string;
    created_at?: string;      // Timestamp from DB
    updated_at?: string;
    // Billing fields
    stripe_customer_id?: string | null;
    subscription_status?: string | null;
    can_make_calls?: boolean | null;
};

export type CalendarProvider = 'google' | 'microsoft';

export type CalendarConnection = {
    id?: number;              // Auto-increment primary key from DB
    account_email: string;
    user_id: string;          // Foreign key to Users.id (not user_auth_id)
    access_token: string;
    refresh_token: string;    // matches DB field name
    provider: 'google';
    expires_at: number;         // matches DB field name
    connected_at: number;       // matches DB field name
    bookings_count: number;   // matches DB field name
};

// Contact List Management Types
export interface ContactList {
    id?: number;              // Auto-increment primary key from DB
    user_id: string;          // Foreign key to Users.id - matches DB
    name: string;
    description: string;
    created_at?: string;      // matches DB field name
    updated_at?: string;      // matches DB field name
    // Computed field
    contactCount?: number;
}



export interface Contact {
    id: string;               // TEXT PRIMARY KEY in DB
    name: string;
    phone_number: string;     // matches DB field name
    email: string | null;
    info: string | null;
    list_id: number;          // Foreign key to ContactLists.id - matches DB field name
}

// CSV Import Types

// Vapi Agent Types
export type Agent = {
    id: string;                 // TEXT PRIMARY KEY (UUID)
    user_id: string;            // Foreign key to Users.id
    name: string;
    description?: string;
    prompt: string;             // System prompt for the model
    agent_goal: string;
    website_url?: string;
    website_summary?: string;
    tone: string;
    pacing: string;
    tool?: string;
    transcriber_provider: string;
    transcriber_model: string;
    model_provider: string;
    model_name: string;
    voice_provider: string;
    voice_id: string;
    first_message?: string;
    end_call_message?: string;
    created_at: string;         // ISO 8601 Timestamp
    updated_at: string;         // ISO 8601 Timestamp
};

export interface PhoneNumber {
    id: number;
    user_id: string;
    vapi_phone_number_id: string;
    name: string;
    number: string;
    created_at: string;
    updated_at: string;
}

// Call Management Types
export interface Call {
    id: string;               // TEXT PRIMARY KEY (UUID)
    user_id: string;          // Foreign key to Users.id
    contact_id: string;       // Foreign key to Contacts.id
    agent_id: string;         // Foreign key to Agents.id
    call_name: string;        // Generated name: contact_number + agent + date
    status?: string;          // Call status: 'in-progress', 'completed', etc.
    end_reason?: string;      // Reason call ended: 'customer-ended-call', etc.
    duration?: number;        // Call duration in seconds (if available)
    cost?: number;           // Call cost (if available)
    transcript?: string;      // Full call transcript
    recording_url?: string;   // URL to call recording
    created_at: string;       // ISO 8601 Timestamp
    updated_at: string;       // ISO 8601 Timestamp
}

// Vapi API Response Types
export interface VapiCallResponse {
    id: string;
    orgId: string;
    createdAt: string;
    updatedAt: string;
    type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
    phoneCallProvider?: string;
    phoneCallTransport?: string;
    status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
    endedReason?: string;
    messages?: VapiMessage[];
    transcript?: string;
    recordingUrl?: string;
    summary?: string;
    analysis?: any;
    artifacts?: any[];
    monitor?: any;
    stereoRecordingUrl?: string;
    startedAt?: string;
    endedAt?: string;
    cost?: number;
    costBreakdown?: any;
    phoneNumber?: {
        id: string;
        number: string;
    };
    customer?: {
        number: string;
        name?: string;
    };
    assistant?: {
        id: string;
        name?: string;
    };
}

export interface VapiMessage {
    role: 'assistant' | 'user' | 'system' | 'function';
    message: string;
    time: number;
    endTime?: number;
    secondsFromStart: number;
}
