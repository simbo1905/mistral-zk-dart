# OPAQUE-TS Demo

A standalone browser demo of the [OPAQUE](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-opaque) password-authenticated key exchange protocol using pure TypeScript (no WASM).

## What is OPAQUE?

OPAQUE is a cryptographic protocol that allows a client to authenticate to a server using a password, without ever revealing the password to the server. The server only stores a cryptographic "registration record" - not the password or any password-equivalent.

**Key benefit**: After authentication, both client and server derive a shared **Export Key** (called `export_key` in the protocol). This key is deterministically derived from the user's password but is never sent over the network and cannot be recovered by the server.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Chrome Extension  │  HTTP   │    Express Server   │
│   (Client-side)     │◄───────►│    (Server-side)    │
│                     │         │                     │
│  - sidebar.html/js  │         │  - Node.js + tsx    │
│  - opaque-client.js │         │  - In-memory store  │
└─────────────────────┘         └─────────────────────┘
        │                                │
        │ Uses @cloudflare/opaque-ts     │ Uses @cloudflare/opaque-ts
        │ (bundled as ESM)               │ (native ESM)
        ▼                                ▼
   Export Key derived              Registration record stored
   (never leaves client)           (password-equivalent safe)
```

## Quick Start

### Prerequisites

- Node.js 20+
- Chrome browser

### 1. Install Dependencies

```bash
cd opaque-ts
npm install
```

### 2. Build Client Bundle

```bash
npm run build -w client
```

This builds `client/dist/opaque-client.js` and copies it to `extension/`.

### 3. Start the Server

```bash
npm run dev
```

Server runs at `http://localhost:3456`.

### 4. Load the Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `opaque-ts/extension` folder
5. Click the extension icon to open the sidebar

### 5. Test the Flow

1. Click **Health Check** to connect to the server
2. Enter a username and password
3. Click **Register** to create an account
4. Click **Login** to authenticate
5. The **Export Key** appears after successful login

## Project Structure

```
opaque-ts/
├── package.json          # Workspace root
├── server/               # Express server (server-side OPAQUE)
│   ├── src/
│   │   ├── index.ts          # HTTP endpoints
│   │   ├── opaque-server.ts  # OPAQUE protocol handlers
│   │   └── storage.ts        # In-memory user store
│   └── package.json
├── client/               # Browser client (client-side OPAQUE)
│   ├── src/
│   │   └── opaque-client.ts  # OPAQUE client API
│   └── package.json
└── extension/            # Chrome MV3 extension
    ├── manifest.json
    ├── sidebar.html
    ├── sidebar.js
    └── opaque-client.js  # Built client bundle
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server status + registered users |
| `/register/start` | POST | Begin registration (client sends request) |
| `/register/finish` | POST | Complete registration (client sends record) |
| `/login/start` | POST | Begin login (client sends KE1) |
| `/login/finish` | POST | Complete login (client sends KE3) |

## OPAQUE Protocol Flow

### Registration

```
Client                              Server
  │                                    │
  │ ── registerInit(password) ──────►  │
  │         (RegistrationRequest)      │
  │                                    │
  │ ◄── registerInit(request) ──────── │
  │       (RegistrationResponse)       │
  │                                    │
  │ ── registerFinish(response) ────►  │
  │       (RegistrationRecord)         │
  │                                    │
  ▼ export_key derived                 ▼ record stored
```

### Login

```
Client                              Server
  │                                    │
  │ ── authInit(password) ──────────►  │
  │              (KE1)                 │
  │                                    │
  │ ◄── authInit(ke1, record) ──────── │
  │              (KE2)                 │
  │                                    │
  │ ── authFinish(ke2) ─────────────►  │
  │              (KE3)                 │
  │                                    │
  ▼ export_key + session_key          ▼ session_key
    derived                             derived
```

## Dependencies

- [`@cloudflare/opaque-ts`](https://github.com/cloudflare/opaque-ts) - Pure TypeScript OPAQUE implementation
- `express` - HTTP server
- `esbuild` - Client bundling
- `tsx` - TypeScript execution

## Notes

- This is a **demo** - the server uses in-memory storage (data lost on restart)
- The Export Key (`export_key`) is derived client-side and never sent to the server
- Chrome MV3 compatible - no WASM, pure JavaScript
