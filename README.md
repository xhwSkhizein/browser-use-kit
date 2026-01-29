# Browser Control Server

> copy from [Clawdbot(Moltbot)](https://github.com/moltbot/moltbot)

A standalone browser control server that provides HTTP APIs for Python agents and other external services to control Chrome/Brave/Edge/Chromium browsers.

## Architecture Overview

The system operates browsers using a layered architecture. Control hierarchy is as follows:

- **HTTP API Layer**: Local HTTP server (listening on 127.0.0.1:18791 by default) receives control requests
- **Playwright + CDP Layer**: Uses Playwright library to connect to Chrome DevTools Protocol (CDP)
- **Browser Process Layer**: Actual Chrome/Brave/Edge/Chromium browser instances

The system supports **clawd management mode** (standalone browsers), where each browser instance uses an independent user data directory for complete isolation.

## Quick Start

### Install Dependencies

```bash
cd browser-use-standalone
npm install
```

### Build

```bash
npm run build
```

### Start the Server

```bash
# Default configuration (127.0.0.1:18791)
npm start

# Custom configuration
npm start -- --host 0.0.0.0 --port 8080 --token my-secret-token

# Start with config file
npm start -- --config /path/to/config.json
```

### CLI Options

```
--host <host>     Host to bind (default: 127.0.0.1)
--port <port>     Port to bind (default: 18791)
--token <token>   Authentication token (Bearer)
--config <path>   Path to JSON config file
--help, -h        Show help
```

## API Endpoints

### Basic Operations

#### GET `/` - Server Status
Retrieves the status of the browser control server and the specified profile.

**Query Parameters:**
- `profile` (optional): Profile name, defaults to `clawd`

**Sample Response:**
```json
{
  "enabled": true,
  "controlUrl": "http://127.0.0.1:18791",
  "profile": "clawd",
  "running": true,
  "cdpReady": true,
  "cdpHttp": true,
  "pid": 12345,
  "cdpPort": 18800,
  "cdpUrl": "http://127.0.0.1:18800",
  "chosenBrowser": "chrome",
  "userDataDir": "/path/to/user-data",
  "color": "#FF4500",
  "headless": false
}
```

#### POST `/start` - Start Browser
Starts the browser instance for the specified profile.

**Query Parameters:**
- `profile` (optional): Profile name

#### POST `/stop` - Stop Browser
Stops the browser instance for the specified profile.

**Query Parameters:**
- `profile` (optional): Profile name

#### GET `/profiles` - List Profiles
Retrieves all available browser profiles.

**Sample Response:**
```json
{
  "profiles": [
    {
      "name": "clawd",
      "cdpPort": 18800,
      "cdpUrl": "http://127.0.0.1:18800",
      "color": "#FF4500",
      "running": true,
      "tabCount": 2,
      "isDefault": true,
      "isRemote": false
    }
  ]
}
```

### Tab Operations

#### GET `/tabs` - List Tabs
Retrieves all tabs for the specified profile.

**Query Parameters:**
- `profile` (optional): Profile name

**Sample Response:**
```json
{
  "running": true,
  "tabs": [
    {
      "targetId": "ABCD1234",
      "title": "Example Domain",
      "url": "https://example.com",
      "type": "page"
    }
  ]
}
```

#### POST `/tabs/open` - Open Tab
Opens a new tab and navigates to the specified URL.

**Query Parameters:**
- `profile` (optional): Profile name

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

#### POST `/tabs/focus` - Focus Tab
Switches focus to the specified tab.

**Query Parameters:**
- `profile` (optional): Profile name

**Request Body:**
```json
{
  "targetId": "ABCD1234"
}
```

#### DELETE `/tabs/:targetId` - Close Tab
Closes the specified tab.

**Query Parameters:**
- `profile` (optional): Profile name

### Snapshots and Screenshots

#### GET `/snapshot` - Page Snapshot
Retrieves the AI snapshot or ARIA tree for the current page.

**Query Parameters:**
- `profile` (optional): Profile name
- `targetId` (optional): Target tab ID
- `format`: `ai` or `aria` (default: `ai`)
- `limit` (optional): Limit node count
- `maxChars` (optional): Max character count
- `refs` (optional): `role` or `aria`
- `interactive` (optional): Boolean, return only interactive elements
- `compact` (optional): Boolean, compact mode
- `depth` (optional): Max depth
- `selector` (optional): CSS selector
- `frame` (optional): Iframe selector
- `labels` (optional): Boolean, include screenshot labels
- `mode` (optional): `efficient` for efficient mode

**Sample Response (AI format):**
```json
{
  "ok": true,
  "format": "ai",
  "targetId": "ABCD1234",
  "url": "https://example.com",
  "snapshot": "Page content description...",
  "refs": {
    "e1": { "role": "button", "name": "Submit" },
    "e2": { "role": "textbox", "name": "Email" }
  }
}
```

#### POST `/screenshot` - Screenshot
Captures a screenshot of the page or element.

**Query Parameters:**
- `profile` (optional): Profile name

**Request Body:**
```json
{
  "targetId": "ABCD1234",
  "fullPage": false,
  "ref": "e12",
  "element": "#main",
  "type": "png"
}
```

**Response:**
Returns the path to the generated image file.

### Actions

#### POST `/navigate` - Navigate
Navigates to the specified URL.

**Query Parameters:**
- `profile` (optional): Profile name

**Request Body:**
```json
{
  "url": "https://example.com",
  "targetId": "ABCD1234"
}
```

#### POST `/act` - Execute Action
Executes browser actions (click, type, drag, etc.).

**Query Parameters:**
- `profile` (optional): Profile name

**Sample Request Body (Click):**
```json
{
  "kind": "click",
  "targetId": "ABCD1234",
  "ref": "e12",
  "doubleClick": false,
  "button": "left"
}
```

**Sample Request Body (Type):**
```json
{
  "kind": "type",
  "targetId": "ABCD1234",
  "ref": "e23",
  "text": "Hello, World!",
  "submit": false,
  "slowly": false
}
```

**Supported Action Types:**
- `click`: Click
- `type`: Input text
- `press`: Key press
- `hover`: Hover
- `drag`: Drag
- `select`: Select option
- `fill`: Fill form
- `resize`: Resize window
- `wait`: Wait
- `evaluate`: Execute JavaScript
- `close`: Close tab

### Other Endpoints

- `GET /console` - Retrieve console messages
- `POST /pdf` - Generate PDF
- `POST /hooks/file-chooser` - Set file chooser handler
- `POST /hooks/dialog` - Set dialog handler
- `GET /cookies` - Get cookies
- `POST /cookies/set` - Set cookie
- `POST /cookies/clear` - Clear cookies
- `GET /storage/:kind` - Get storage (local/session)
- `POST /storage/:kind/set` - Set storage
- `POST /storage/:kind/clear` - Clear storage

## Configuration File

You can specify a configuration file via the `--config` parameter with the following JSON format:

```json
{
  "browser": {
    "enabled": true,
    "controlUrl": "http://127.0.0.1:18791",
    "headless": false,
    "noSandbox": false,
    "executablePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "defaultProfile": "clawd",
    "color": "#FF4500",
    "profiles": {
      "clawd": {
        "cdpPort": 18800,
        "color": "#FF4500"
      },
      "work": {
        "cdpPort": 18801,
        "color": "#0066CC"
      }
    }
  }
}
```

## Authentication

If a `--token` is specified during startup, all requests must include the Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your-token" http://127.0.0.1:18791/
```

## Python Client Example

```python
import requests

BASE_URL = "http://127.0.0.1:18791"
PROFILE = "clawd"
HEADERS = {
    "Authorization": "Bearer your-token"  # If authentication is enabled
}

# Get status
response = requests.get(f"{BASE_URL}/", params={"profile": PROFILE}, headers=HEADERS)
status = response.json()
print(f"Browser running: {status['running']}")

# Start browser
if not status['running']:
    requests.post(f"{BASE_URL}/start", params={"profile": PROFILE}, headers=HEADERS)

# Open tab
response = requests.post(
    f"{BASE_URL}/tabs/open",
    params={"profile": PROFILE},
    json={"url": "https://example.com"},
    headers=HEADERS
)
tab = response.json()
target_id = tab['targetId']

# Get snapshot
response = requests.get(
    f"{BASE_URL}/snapshot",
    params={"profile": PROFILE, "targetId": target_id, "format": "ai"},
    headers=HEADERS
)
snapshot = response.json()
print(snapshot['snapshot'])

# Execute click action
requests.post(
    f"{BASE_URL}/act",
    params={"profile": PROFILE},
    json={
        "kind": "click",
        "targetId": target_id,
        "ref": "e12"
    },
    headers=HEADERS
)
```

## Directory Structure

```
browser-use-standalone/
├── src/
│   ├── index.ts              # Main entry, exports API
│   ├── cli.ts                 # CLI entry
│   ├── bridge-server.ts       # HTTP server
│   ├── chrome.ts              # Chrome startup and management
│   ├── pw-session.ts          # Playwright session management
│   ├── pw-tools-core.ts       # Playwright tools core
│   ├── config.ts              # Configuration parsing
│   ├── server-context.ts       # Server context
│   ├── routes/                 # Route handlers
│   └── ...                    # Other support files
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- Node.js >= 22.0.0
- express: HTTP server
- playwright-core: Browser automation
- ws: WebSocket client

## Notes

1. **Port Range**: CDP ports start from 18800 by default, ensure these ports are available
2. **Browser Executables**: The system will auto-detect Chrome/Brave/Edge/Chromium, or specify via `executablePath`
3. **User Data Directory**: Each profile uses an independent user data directory located at `~/.browser-control/browser/<profile-name>/user-data`
4. **Memory Management**: In standalone mode, profile configurations are only stored in memory and will be lost after server restart (except for the default `clawd` profile)

## Web API Test Interface

The project includes a built-in web test interface for conveniently testing all API endpoints.

### Launch Test Interface

**Just start the browser control server, the test interface will be available automatically!**

```bash
npm install
npm run build
npm start
```

Then open `http://127.0.0.1:18791/` (or your configured server address) in a browser to use the test interface.

**Advantages:**
- ✅ No need to start a separate web server
- ✅ No CORS cross-domain issues
- ✅ Auto-detects server address
- ✅ One service handles all functionality

Test interface features:
- 📋 Complete list of all API endpoints
- 📝 Parameter forms for each endpoint
- 🚀 Send requests in real-time and view responses
- 📊 Formatted JSON response display
- 🔐 Support for authentication token configuration
- 📱 Responsive design, supports mobile devices

## License

Consistent with the main project.
