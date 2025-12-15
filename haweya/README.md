# Haweya OAuth Provider (Mock)

A mock OAuth 2.0 identity provider simulating Egypt's National ID (Haweya) authentication system.

## Overview

This is a **development mock** for testing "Sign in with Haweya" functionality in the Sawtak platform. It mimics how a real government identity provider would work, similar to Google OAuth.

## Structure

```
haweya/
├── README.md           # This file
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── backend/
│   ├── src/
│   │   ├── index.ts        # Elysia server
│   │   ├── routes/         # Auth routes
│   │   ├── services/       # Auth logic
│   │   └── db.ts           # In-memory user store
│   └── Dockerfile
└── frontend/
    ├── index.html      # Main page
    ├── login.html      # Login page
    ├── signup.html     # Signup page
    ├── authorize.html  # OAuth consent page
    └── css/
        └── style.css   # Styling
```

## Quick Start

### 1. Install Dependencies

```bash
cd haweya
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start the Server

```bash
bun run dev
```

The server will start on `http://localhost:3030`

## OAuth 2.0 Flow

### 1. Authorization Request

Redirect users to:
```
GET http://localhost:3030/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http://your-app.com/callback
  &response_type=code
  &scope=openid profile email
  &state=YOUR_STATE
```

### 2. User Authentication

User logs in on the Haweya UI, then gets redirected to your callback:
```
http://your-app.com/callback?code=AUTH_CODE&state=YOUR_STATE
```

### 3. Token Exchange

```bash
POST http://localhost:3030/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://your-app.com/callback"
}
```

Response:
```json
{
  "access_token": "...",
  "id_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 4. Get User Info

```bash
GET http://localhost:3030/oauth/userinfo
Authorization: Bearer ACCESS_TOKEN
```

Response:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "Ahmed Mohamed",
  "picture": null,
  "national_id": "28XXXXXXXXXX"
}
```

## Integration with Sawtak

### 1. Register as OAuth Client

Configure your Sawtak backend with:
```
HAWEYA_CLIENT_ID=sawtak_client
HAWEYA_CLIENT_SECRET=your_secret
HAWEYA_ISSUER_URL=http://localhost:3030
```

### 2. Add Haweya Provider

Add to Sawtak's auth service (auth.service.ts):
```typescript
import { HaweyaAuthProvider } from "./haweya.provider";

this.providers = {
  google: new GoogleAuthProvider(),
  haweya: new HaweyaAuthProvider(),
};
```

## Development Notes

- **In-Memory Storage**: Users are stored in memory. Restart clears all data.
- **Mock National IDs**: Use any 14-digit number for testing.
- **JWT Tokens**: Tokens are signed with a development secret.

## Docker Deployment

```bash
docker build -t haweya-mock .
docker run -p 3030:3030 haweya-mock
```

## Test Accounts

Pre-registered test users:
| Email | Password | National ID |
|-------|----------|-------------|
| ahmed@test.com | password123 | 30001011234567 |
| sara@test.com | password123 | 29512311234567 |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Start OAuth flow |
| `/oauth/token` | POST | Exchange code for token |
| `/oauth/userinfo` | GET | Get authenticated user info |
| `/api/signup` | POST | Register new user |
| `/api/login` | POST | Login user |
| `/` | GET | Home page |
| `/login` | GET | Login page |
| `/signup` | GET | Signup page |
