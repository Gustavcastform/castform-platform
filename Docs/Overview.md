# Castform Voice Platform - Technical Documentation

This document provides a comprehensive technical overview of the Castform Voice platform, including its architecture, core features, database schema, and key API endpoints.

## 1. Project Overview

Castform Voice is a platform for creating, managing, and deploying AI-powered voice agents. Users can design agents with specific goals, voices, and knowledge bases, and then deploy them to handle phone calls. The platform integrates with Vapi for voice AI capabilities and Twilio for telephony services.

## 2. Core Features

- **Agent Management**: Full CRUD functionality for voice agents. Users can create, view, edit, and delete agents.
- **Unified Agent Modal**: A single, reusable React component (`AgentModal.tsx`) for both creating and editing agents, simplifying the user experience and reducing code duplication.
- **Prompt Templates**: A library of predefined prompts (e.g., Customer Service, Appointment Scheduler) that users can select to quickly configure an agent's core behavior.
- **Dynamic Prompts**: Supports using variables like `{{name}}` in prompts to dynamically insert caller information.
- **Knowledge Base Integration**: Agents can be equipped with knowledge by providing website URLs, which are summarized and included in the agent's system prompt.
- **Tool Integration**: Agents can be enhanced with tools, such as the `book_meeting` tool, which integrates with the user's calendar.
- **Phone Number Management**: Users can manage their phone numbers for making outbound calls.
- **Contact Management**: A complete system for managing contacts, including a CSV import feature for bulk uploads.
- **Billing and Subscription Management**: A dedicated billing page to manage subscriptions, view usage, and see payment history, powered by Stripe.

## 3. Architecture

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Backend**: Next.js API Routes
- **Database**: Cloudflare D1 (SQLite-based)
- **Voice AI**: Vapi
- **Telephony**: Twilio (via Vapi integration)

## 4. Key API Endpoints

- `POST /api/agents`: Creates a new agent.
- `PATCH /api/agents`: Updates an existing agent.
- `DELETE /api/agents`: Deletes an agent.
- `GET /api/agents`: Retrieves all agents for the user.
- `POST /api/calls`: Initiates an outbound call.
- `POST /api/contacts/bulk`: Handles bulk import of contacts from a CSV file.
- `GET /api/billing/dashboard`: Retrieves all billing data for the user's dashboard.
- `POST /api/billing/subscribe`: Creates a Stripe Checkout session for a new subscription.
- `POST /api/billing/manage`: Creates a Stripe Customer Portal session for managing a subscription.
- `POST /api/webhooks/stripe`: Handles incoming webhooks from Stripe for subscription events.

## 5. Billing System

The Castform Voice platform uses Stripe to handle all subscription and usage-based billing.

### Features

- **Subscription Management**: Users can subscribe to the `Castform Voice Pro` plan ($149/month) via a Stripe Checkout session.
- **Customer Portal**: Existing subscribers can manage their payment methods, view invoices, and cancel their subscription through the Stripe Customer Portal.
- **Usage-Based Billing**: In addition to the monthly subscription, call costs are tracked and billed separately. When a user's unbilled usage reaches a certain threshold (e.g., $50), an invoice is automatically generated and charged to their payment method.
- **Payment Alerts**: The UI provides clear alerts if a payment fails, guiding the user to update their payment method.
- **Dashboard Integration**: The `/billing` page provides a comprehensive overview of the user's subscription status, current usage, recent calls, and invoice history.

### Key API Endpoints

- `GET /api/billing/dashboard`: Fetches all necessary data for the billing page, including subscription status, usage metrics, and recent activity.
- `POST /api/billing/subscribe`: Creates and returns a URL for a new Stripe Checkout session.
- `POST /api/billing/manage`: Creates and returns a URL for a Stripe Customer Portal session.
- `POST /api/webhooks/stripe`: An endpoint to receive and process webhooks from Stripe for events like `invoice.payment_succeeded`, `customer.subscription.deleted`, etc. (Note: The handler logic is not yet fully implemented).

## 6. Database Schema

Below are the primary tables in the Castform D1 database.

### `Agents` Table

Stores the configuration for each voice agent.

```sql
CREATE TABLE Agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    agent_goal TEXT,
    website_url TEXT,
    website_summary TEXT,
    tone TEXT,
    pacing TEXT,
    transcriber_provider TEXT,
    transcriber_model TEXT,
    model_provider TEXT,
    model_name TEXT,
    voice_provider TEXT,
    voice_id TEXT,
    first_message TEXT,
    tool TEXT,
    vapi_tool_id TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

### `Contacts` Table

Stores contact information for outbound calls.

```sql
CREATE TABLE Contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    info TEXT,
    list_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

## Recent Updates (August 2025)

This section summarizes the key improvements and fixes implemented recently.

### 1. Contact Management Enhancements

- **Contact Form Consistency**: Aligned `AddContactModal` and `EditContactModal` to ensure consistent handling of optional fields (`age`, `gender`, `location`, `job`). Both modals now correctly parse and save these fields as plain text lines within the main `info` field (e.g., `Job: Engineer`). This resolves a critical bug where the edit modal was incorrectly attempting to parse the `info` field as JSON.

- **Bulk Deletion Security**: The `DELETE /api/contacts/bulk` endpoint has been secured. It now requires a `contactListId` and verifies that the list belongs to the authenticated user before deleting contacts, preventing unauthorized data modification.

- **UI/UX Fixes**: 
  - Replaced the generic confirmation modal for bulk deletes with a custom modal that matches the application's design language.
  - The bulk delete button now uses a `destructive` variant for clearer user intent.
  - Removed unwanted blank space at the bottom of the contacts table for a cleaner layout.

### 2. API and Backend Fixes

- **Agent Lookup**: Corrected a bug in the `/api/calls` route where the agent lookup was using an incorrect ID, ensuring calls are associated with the correct agent.
- **Validation Fixes**: The bulk delete API's validation schema was updated to correctly handle numeric or string inputs for `contactListId`.

## 7. Recent Major Changes & Refactoring

- **Unified Vapi Assistant ID**: The `vapi_assistant_id` field was removed from the `Agents` table. The agent's own `id` is now used as the unique identifier when interacting with the Vapi API. This simplifies the data model and removes redundancy.
- **Unified AgentModal**: The separate `CreateAgentModal` and `EditAgentModal` components were consolidated into a single `AgentModal.tsx` component to improve maintainability and ensure a consistent UX.
- **Vapi PATCH Payload Correction**: Fixed a critical bug in the `PATCH /api/agents` endpoint where an incorrect payload was being sent to the Vapi API, causing `400 Bad Request` errors. The payload is now constructed with only the fields Vapi accepts.
- **Prompt Templates Integration**: Added a dropdown in the `AgentModal` to allow users to select from a list of predefined prompt templates, autofilling the agent's prompt to speed up configuration.

## 1. Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Edge Runtime (Cloudflare Pages)
- **Authentication**: Auth.js v5 (formerly NextAuth.js)
- **Storage**: Cloudflare D1 for relational data, Cloudflare KV for key-value storage.
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Shadcn UI, Lucide React
- **Notifications**: Sonner (for toast notifications)
- **Type Safety**: TypeScript throughout

### Key Directories

```
castform-voice/
├── app/
│   ├── (dashboard)/         # Dashboard routes (protected)
│   │   ├── agents/         # Agent management
│   │   ├── billing/        # Billing and subscription
│   │   ├── calendar/       # Calendar connections
│   │   ├── calls/          # Call logs and monitoring
│   │   ├── contacts/       # Contact management
│   │   ├── phone-number/   # Twilio phone number connection
│   │   └── layout.tsx      # Dashboard layout with navigation
│   ├── api/                # API routes
│   │   ├── agents/         # Agent management API
│   │   ├── auth/           # Auth.js routes
│   │   ├── book-meeting/   # Booking tool API
│   │   ├── contacts/       # Contacts API
│   │   ├── phone-numbers/  # Phone number management API
│   │   └── oauth/          # OAuth callback handlers
│   ├── components/         # Shared components
│   │   ├── agents/        # Agent-related components
│   │   ├── contacts/      # Contact-related components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── landing/       # Landing page components
│   └── lib/               # Shared utilities and types
├── auth.ts                # Central auth configuration
└── wrangler.jsonc         # Cloudflare configuration
```

## 2. Authentication System

- Uses Auth.js v5 with a JWT strategy for stateless authentication.
- Integrates Google as the primary OAuth provider.
- Session data is stored in secure, HTTP-only JWT cookies.
- A `signIn` callback handles user creation and updates in KV storage upon successful login.

## 3. Agent Management

- **Vapi Integration**: Agents are created and managed as "Assistants" via the Vapi API.
- **Agent Creation**: The `CreateAgentModal` component provides a form to define an agent's properties (name, voice, system prompt).
- **API Handling**: The `/api/agents` endpoint processes creation and update requests, sending the appropriate payload to the Vapi API.
- **Agent Tools**: Agents can be equipped with tools. The primary tool is `book_meeting`, which allows the AI to schedule appointments.

### Booking Tool and Calendar Validation

- To ensure data integrity, the system enforces that a user must have a connected Google Calendar before creating or updating an agent with the `book_meeting` tool.
- This validation is performed server-side in the `POST` and `PATCH` handlers of the `/api/agents` route.
- If no calendar connection is found, the API returns a `400 Bad Request` with a clear error message, which is then displayed to the user as a toast notification.

## 4. Contact Management

- **Contact Lists**: Users can organize contacts into different lists for targeted campaigns.
- **CRUD Operations**: The UI supports creating, editing, and deleting contacts. These actions are handled by the `/api/contacts` endpoint, which interacts with the D1 database.
- **Outbound Calling**: From the contacts page, a user can select a contact and an agent to initiate an outbound call. This action is handled by the `/api/calls` endpoint.
- **Call History**: Each contact shows a complete call history with status tracking, transcripts, and recordings.

## 5. Enhanced Call Tracking System

### Call Lifecycle Management

- **Real-time Status Updates**: Calls are tracked from initiation through completion with real-time status updates via Vapi webhooks.
- **Comprehensive Data Storage**: Each call stores detailed information including duration, cost, transcript, recording URL, status, and end reason.
- **Status Categories**:
  - 🔵 **In-Progress**: Active calls currently in session
  - 🟢 **Completed**: Successfully completed calls
  - 🔴 **Customer Busy**: Calls that couldn't connect due to busy line
  - ⚪ **Unknown**: Calls with undefined status

### Database Schema (Calls Table)

```sql
CREATE TABLE Calls (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_id TEXT,
    agent_id TEXT NOT NULL,
    call_name TEXT NOT NULL,
    status TEXT DEFAULT 'in-progress',
    end_reason TEXT,
    duration INTEGER,
    cost REAL,
    transcript TEXT,
    recording_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users (id),
    FOREIGN KEY (contact_id) REFERENCES Contacts (id),
    FOREIGN KEY (agent_id) REFERENCES Agents (id)
);

CREATE INDEX idx_calls_status ON Calls(status);
CREATE INDEX idx_calls_user_id ON Calls(user_id);
CREATE INDEX idx_calls_contact_id ON Calls(contact_id);
```

### Webhook Integration

- **Vapi Webhook Endpoint**: `/api/webhooks/vapi` processes real-time call updates
- **Event Types Handled**:
  - `end-of-call-report`: Complete call data with transcript, recording, cost
  - `status-update` (ended): Call termination events
- **Automatic Updates**: Call records are automatically updated with final status, duration, cost, transcript, and recording URL
- **Special Status Handling**: Customer busy scenarios are properly categorized with dedicated status

### Call Management Features

#### Transcript Viewer
- **Rich Modal Interface**: Beautiful, responsive modal for viewing full call transcripts
- **Formatted Display**: Proper text formatting with line breaks and spacing
- **Call Details**: Shows duration, cost, status, and end reason alongside transcript
- **Dark Mode Support**: Fully styled for both light and dark themes
- **Accessibility**: Keyboard navigation and screen reader support

#### Recording Management
- **One-Click Download**: Direct download of call recordings with proper file naming
- **Format Support**: Handles both mono and stereo recordings
- **Error Handling**: Graceful handling of failed downloads with user feedback
- **File Naming**: Downloads as `call-{id}-recording.mp3` for easy organization

#### User Interface Enhancements
- **Action Buttons**: Dedicated buttons for transcript viewing (📄) and recording download (⬇️)
- **Status Badges**: Color-coded status indicators with hover tooltips
- **Disabled States**: Buttons are disabled when content is unavailable
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### API Endpoints

#### Call Management
- `GET /api/calls` - Retrieve all calls with optional contact filtering
- `POST /api/calls` - Create new outbound call
- `GET /api/calls/[id]` - Get specific call details

#### Webhook Processing
- `POST /api/webhooks/vapi` - Process Vapi webhook events for call updates

## 6. Phone Number Integration

- **Twilio Connection**: Connects a user's existing Twilio phone number via the Vapi API.
- **Secure Storage**: Phone number details are securely stored in the Cloudflare D1 database.
- **API Management**: The `/api/phone-numbers` route handles all GET, POST, and DELETE operations.

## 7. Calendar Integration

- **Google Calendar Connection**: Uses a separate OAuth flow to connect a user's Google Calendar for booking purposes.
- **Secure Token Handling**: OAuth tokens are encrypted using the Web Crypto API (AES-GCM) and stored in KV storage. The system also handles token refreshes automatically.
- **Booking API**: The `/api/book-meeting` endpoint provides the logic for the agent's booking tool to create events in the user's calendar.

## 8. Security Measures

### Environment Variables

- Stored securely in Cloudflare's environment.
- Include secrets like `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`, and `VAPI_PRIVATE_KEY`.

### Token Encryption

- AES-GCM encryption for calendar tokens with a unique IV for each encryption.

### CSRF Protection

- Handled by Auth.js and state parameter validation in OAuth flows.

## 9. UI and Error Handling

### UI Components

- **Dashboard Layout**: A responsive layout with a collapsible sidebar and user profile management.
- **Modals**: The application uses modals extensively for creating and editing resources (e.g., `CreateAgentModal`, `AddContactModal`).
- **Notifications**: User feedback for success or failure of operations is provided via toast notifications, powered by the `sonner` library.

### Error Handling Strategy

- **Server-Side Validation**: APIs perform strict validation on incoming data. For example, attempting to create an agent with a booking tool without a connected calendar will result in a specific error.
- **API Error Responses**: Failed API requests return a standardized JSON object: `{ "error": "A descriptive error message." }`.
- **Frontend Display**: The client-side logic catches these errors, parses the JSON response, and displays the specific error message in a toast notification, providing clear and actionable feedback to the user.

1. Authentication Errors
   - Invalid credentials
   - Expired sessions
   - Missing permissions
2. Calendar Errors
   - Connection failures
   - Token refresh errors
   - Booking creation errors
3. API Errors
   - Rate limiting
   - Invalid requests
   - Server errors

### Error Handling Pattern

```typescript
try {
  // Operation
} catch (error) {
  console.error("🚨 Error:", error);
  // Appropriate error response
}
```

## 10. Development Workflow

### Local Development

1. Set up environment variables in `wrangler.jsonc`
2. Run `npm run dev` for development server
3. Access at `http://localhost:3000`

### Build Process

```bash
npm run build
```

- Validates TypeScript
- Checks for linting errors
- Generates production build

### Deployment

- Hosted on Cloudflare Pages
- Edge runtime for optimal performance
- Automatic environment variable injection

## 11. Future Enhancements

### Call Tracking Enhancements

1. **Advanced Analytics**: Call performance metrics and reporting dashboards
2. **Sentiment Analysis**: AI-powered analysis of call transcripts for sentiment scoring
3. **Call Recording Playback**: In-browser audio player for call recordings
4. **Bulk Operations**: Mass actions for call management and analysis
5. **Export Functionality**: CSV/Excel export of call data and transcripts
6. **Search and Filtering**: Advanced search across transcripts and call metadata
7. **Webhook Security**: Authentication and verification for webhook endpoints
8. **Real-time Notifications**: Live updates for ongoing calls and status changes

### Planned Features

1. Microsoft Calendar Integration
2. Calendar Availability API
3. Booking Management UI
4. Multiple Calendar Support
5. Team Calendar Sharing

### Technical Debt

1. Improve error handling
2. Add comprehensive logging
3. Implement rate limiting
4. Add integration tests

## 12. API Routes

### Authentication

- `/api/auth/[...nextauth]` - Auth.js routes
- `/api/oauth/google/callback` - Google OAuth callback

### Calendar

- POST `/calendar` - Connect calendar
- DELETE `/calendar` - Disconnect calendar
- POST `/calendar/book` - Create booking

### Call Management

- GET `/api/calls` - Retrieve calls (with optional contact filtering)
- POST `/api/calls` - Create new outbound call
- GET `/api/calls/[id]` - Get specific call details

### Webhooks

- POST `/api/webhooks/vapi` - Process Vapi webhook events

## 13. Environment Setup

### Required Variables

```jsonc
{
  "vars": {
    "GOOGLE_CLIENT_ID": "your-client-id",
    "GOOGLE_CLIENT_SECRET": "your-client-secret",
    "AUTH_SECRET": "your-auth-secret",
    "ENCRYPTION_KEY": "your-encryption-key",
    "AUTH_URL": "http://localhost:3000",
    "VAPI_PRIVATE_KEY": "your-vapi-private-key",
    "GEMINI_API_KEY": "your-google-gemini-api-key"
  }
}
```

### Google OAuth Configuration

- Authorized redirect URIs:
  - Development: `http://localhost:3000/api/oauth/google/callback`
  - Production: `https://your-domain.com/api/oauth/google/callback`
- Required scopes:
  - `https://www.googleapis.com/auth/calendar`
  - `email`
  - `profile`

## 14. Agent Management (Vapi Integration)

The platform integrates with Vapi to provide AI-powered voice agents. Users can create, manage, and customize agents through the dashboard.

### Key Features

- **Agent Creation**: Users can create agents with custom names, descriptions, and behaviors.
- **Dynamic Prompts**: Agent prompts are dynamically constructed based on user-defined goals, website summaries, tone, and pacing.
- **Knowledge Base**: Agents can be provided with a knowledge base by summarizing a website URL.
- **CRUD Operations**: Full support for creating, reading, updating, and deleting agents.

### Database Schema (Agents Table)

The `Agents` table stores the configuration for each user-created agent.

```sql
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
```

### API Endpoints

#### Agent CRUD

- **`GET /api/agents`**: Retrieves a list of agents for the authenticated user.
- **`POST /api/agents`**: Creates a new agent. The request body should conform to the `createAgentSchema`. It interacts with the Vapi API to create the assistant and then stores the configuration in the database.
- **`PATCH /api/agents/:id`**: Updates an existing agent's configuration. It updates the assistant on Vapi and then in the database.
- **`DELETE /api/agents/:id`**: Deletes an agent from Vapi and the database.

#### Website Summarization

- **`POST /api/summarize`**: Accepts a `{ "url": "..." }` payload. It fetches the content of the provided URL, summarizes it using the Gemini API, and returns the summary. This is used to generate the `website_summary` for an agent's knowledge base.

### Environment Variables

The following environment variables are required for agent management and must be added to `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "VAPI_PRIVATE_KEY": "your-vapi-private-key",
    "GEMINI_API_KEY": "your-google-gemini-api-key"
  }
}
```

## 12. Recent Updates (July 2025)

### API Route Handlers for Next.js 15

- **Context**: Resolved critical build errors in dynamic API routes (`/api/contact-lists/[listId]` and `/api/contacts/[contactId]`) caused by a change in Next.js 15.
- **Implementation**: The `params` object in dynamic App Router route handlers is now a `Promise`. The fix required updating the function signature and awaiting the `params` object before accessing its properties.

  ```typescript
  // Example from app/api/contacts/[contactId]/route.ts
  export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
  ) {
    const { contactId } = await params; // Must await the promise
    // ... rest of the logic
  }
  ```

### Responsive Dashboard Navigation

- **Feature**: The main dashboard navigation sidebar is now fully responsive and collapsible on mobile devices.
- **Implementation**:
  - The sidebar is hidden on screen widths below the `md` breakpoint (768px).
  - A "hamburger" menu button is displayed in the mobile header to toggle the sidebar's visibility.
  - When opened on mobile, the sidebar appears as an overlay and can be closed by clicking the "X" icon, a navigation link, or the overlay.
  - The active navigation link is highlighted based on the current URL path.
  - Implemented in `app/(dashboard)/layout.tsx` using React state (`useState`) and hooks (`useEffect`, `usePathname`).

### Contact Management UI/UX Improvements

- **Contacts Table**: The table in `app/components/contacts/ContactsTable.tsx` was updated to include `Age`, `Gender`, and `Info` columns. Horizontal scrolling is enabled to accommodate the new data.
- **Contact List Creation**: To simplify contact management, the UI now permits the creation of only one contact list per user. The "Create Contact List" button on the `/contacts` page is hidden if a list already exists or while lists are being fetched, preventing UI flicker.
