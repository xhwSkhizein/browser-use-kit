---
name: browser-control
description: Control browsers via browser-use-kit HTTP API. Use when automating browser tasks, testing web applications, scraping content, or interacting with web pages. Supports Chrome/Brave/Edge/Chromium via Playwright and CDP.
---

# Browser Control via HTTP API

Control browsers programmatically using the `browser-use-kit` server's HTTP API. The server provides comprehensive browser automation capabilities including navigation, interaction, screenshots, JavaScript execution, and more.

## Quick Start

### Starting the Server

```bash
cd browser-use-kit
bun install
bun run build
bun start
```

Default: `http://127.0.0.1:18791`

Custom configuration:
```bash
bun start -- --host 0.0.0.0 --port 8080 --token my-secret-token
```

### Base URL and Authentication

- **Base URL**: `http://127.0.0.1:18791` (default)
- **Profile**: Default is `clawd` (isolated browser instance)
- **Auth**: If token is set, include `Authorization: Bearer <token>` header

## Core Workflows

### 1. Browser Lifecycle

**Start browser:**
```bash
POST /start?profile=clawd
Body (optional): {
  "executablePath": "/path/to/browser",
  "userDataDir": "/path/to/user-data",
  "headless": false,
  "noSandbox": false,
  "cdpPort": 18800
}
```

**Check status:**
```bash
GET /?profile=clawd
```

**Stop browser:**
```bash
POST /stop?profile=clawd
```

**Reset profile (clear user data):**
```bash
POST /reset-profile?profile=clawd
```

### 2. Profile Management

**List profiles:**
```bash
GET /profiles
```

**Create profile:**
```bash
POST /profiles/create?profile=clawd
Body: {
  "name": "my-profile",
  "color": "#FF4500",
  "cdpUrl": "http://127.0.0.1:18801",
  "driver": "clawd" | "extension"
}
```

**Delete profile:**
```bash
DELETE /profiles/:name?profile=clawd
```

### 3. Tab Management

**List tabs:**
```bash
GET /tabs?profile=clawd
```

**Open a tab:**
```bash
POST /tabs/open?profile=clawd
Body: { "url": "https://example.com" }
```

**Focus tab:**
```bash
POST /tabs/focus?profile=clawd
Body: { "targetId": "ABCD1234" }
```

**Close tab:**
```bash
DELETE /tabs/:targetId?profile=clawd
```

**Tab actions (alternative API):**
```bash
POST /tabs/action?profile=clawd
Body: {
  "action": "list" | "new" | "close" | "select",
  "index": 0  // for close/select actions
}
```

### 4. Page Navigation and Snapshot

**Navigate:**
```bash
POST /navigate?profile=clawd
Body: {
  "url": "https://example.com",
  "targetId": "ABCD1234"
}
```

**Get page snapshot (AI format):**
```bash
GET /snapshot?profile=clawd&targetId=ABCD1234&format=ai&refs=role
```

**Query Parameters:**
- `targetId` (optional): Target tab ID
- `format`: `ai` or `aria` (default: `ai` if Playwright AI module available)
- `refs`: `role` or `aria` (default: `role`)
- `limit` (optional): Limit node count (for aria format)
- `maxChars` (optional): Max character count (for ai format)
- `interactive` (optional): Boolean, return only interactive elements
- `compact` (optional): Boolean, compact mode
- `depth` (optional): Max depth
- `selector` (optional): CSS selector to filter elements
- `frame` (optional): Iframe selector
- `labels` (optional): Boolean, include screenshot labels
- `mode` (optional): `efficient` for efficient mode (sets interactive=true, compact=true, depth=3)

### 5. Element Interaction

**Get snapshot first to find element refs:**
```bash
GET /snapshot?profile=clawd&format=ai&refs=role
```

Response includes `refs` object with element references like `e12`, `e34`.

**Click element:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "click",
  "ref": "e12",
  "targetId": "ABCD1234",
  "doubleClick": false,
  "button": "left" | "right" | "middle",
  "modifiers": ["Control", "Shift", "Alt", "Meta"],
  "timeoutMs": 30000
}
```

**Type text:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "type",
  "ref": "e34",
  "text": "Hello World",
  "targetId": "ABCD1234",
  "submit": false,
  "slowly": false,
  "timeoutMs": 30000
}
```

**Press key:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "press",
  "key": "Enter",
  "targetId": "ABCD1234",
  "delayMs": 100
}
```

**Hover:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "hover",
  "ref": "e12",
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

**Scroll into view:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "scrollIntoView",
  "ref": "e12",
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

**Scroll to bottom (supports infinite scroll):**
```bash
POST /act?profile=clawd
Body: {
  "kind": "scrollToBottom",
  "targetId": "ABCD1234",
  "maxElementCount": 500,
  "waitTimeoutMs": 5000
}
```

**Response:**
```json
{
  "ok": true,
  "targetId": "ABCD1234",
  "scrolled": true,
  "scrollCount": 3,
  "finalHeight": 5000,
  "initialHeight": 2000,
  "scrollableInfo": {
    "isWindow": true,
    "selector": null,
    "scrollHeight": 5000,
    "clientHeight": 800
  }
}
```

**Drag and drop:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "drag",
  "startRef": "e12",
  "endRef": "e34",
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

**Select option:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "select",
  "ref": "e12",
  "values": ["option1", "option2"],
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

**Fill form:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "fill",
  "fields": [
    { "ref": "e12", "type": "text", "value": "John" },
    { "ref": "e34", "type": "checkbox", "value": true }
  ],
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

**Resize viewport:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "resize",
  "width": 1920,
  "height": 1080,
  "targetId": "ABCD1234"
}
```

**Wait:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "wait",
  "targetId": "ABCD1234",
  "timeMs": 1000,
  "text": "Loading...",
  "textGone": "Loading...",
  "selector": ".loaded",
  "url": "https://example.com",
  "loadState": "load" | "domcontentloaded" | "networkidle",
  "fn": "() => document.readyState === 'complete'",
  "timeoutMs": 30000
}
```

**Evaluate JavaScript:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "evaluate",
  "fn": "() => document.title",
  "ref": "e12",  // optional, evaluate on element
  "targetId": "ABCD1234"
}
```

**Close page/tab:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "close",
  "targetId": "ABCD1234"
}
```

### 6. JavaScript Execution

**Execute code (standalone endpoint):**
```bash
POST /evaluate?profile=clawd
Body: {
  "code": "() => document.title",
  "fn": "() => document.title",  // alternative to code
  "ref": "e12",  // optional, evaluate on element
  "targetId": "ABCD1234"
}
```

### 7. Screenshots and PDFs

**Screenshot:**
```bash
POST /screenshot?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "fullPage": false,
  "ref": "e12",  // optional, screenshot element
  "element": "#main",  // optional, CSS selector
  "type": "png" | "jpeg"
}
```

**Generate PDF:**
```bash
POST /pdf?profile=clawd
Body: { "targetId": "ABCD1234" }
```

### 8. File Upload

**Set file chooser handler:**
```bash
POST /hooks/file-chooser?profile=clawd
Body: {
  "paths": ["/path/to/file.txt"],
  "ref": "e12",  // optional, click element to trigger chooser
  "inputRef": "e12",  // alternative: set files on input element
  "element": "#file-input",  // alternative: CSS selector
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

### 9. Dialog Handling

**Handle dialogs:**
```bash
POST /hooks/dialog?profile=clawd
Body: {
  "accept": true,
  "promptText": "optional text",
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

### 10. Downloads

**Wait for download:**
```bash
POST /wait/download?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "path": "/path/to/save",  // optional
  "timeoutMs": 30000
}
```

**Download from element:**
```bash
POST /download?profile=clawd
Body: {
  "ref": "e12",
  "path": "/path/to/save",
  "targetId": "ABCD1234",
  "timeoutMs": 30000
}
```

### 11. Network and Response

**Get response body:**
```bash
POST /response/body?profile=clawd
Body: {
  "url": "https://example.com/api/data",
  "targetId": "ABCD1234",
  "timeoutMs": 30000,
  "maxChars": 10000
}
```

### 12. Element Highlighting

**Highlight element:**
```bash
POST /highlight?profile=clawd
Body: {
  "ref": "e12",
  "targetId": "ABCD1234"
}
```

### 13. Cookie Management

**Get cookies:**
```bash
GET /cookies?profile=clawd&targetId=ABCD1234
```

**Set cookie:**
```bash
POST /cookies/set?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "cookie": {
    "name": "session",
    "value": "abc123",
    "url": "https://example.com",
    "domain": "example.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": false,
    "secure": true,
    "sameSite": "Lax" | "None" | "Strict"
  }
}
```

**Clear cookies:**
```bash
POST /cookies/clear?profile=clawd
Body: { "targetId": "ABCD1234" }
```

### 14. Storage Management

**Get storage:**
```bash
GET /storage/:kind?profile=clawd&targetId=ABCD1234&key=myKey
```
- `kind`: `local` or `session`
- `key` (optional): Specific key to retrieve

**Set storage:**
```bash
POST /storage/:kind/set?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "key": "myKey",
  "value": "myValue"
}
```

**Clear storage:**
```bash
POST /storage/:kind/clear?profile=clawd
Body: { "targetId": "ABCD1234" }
```

### 15. Browser Settings

**Set offline mode:**
```bash
POST /set/offline?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "offline": true
}
```

**Set extra HTTP headers:**
```bash
POST /set/headers?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "headers": {
    "User-Agent": "Custom Agent",
    "Authorization": "Bearer token"
  }
}
```

**Set HTTP credentials:**
```bash
POST /set/credentials?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "username": "user",
  "password": "pass",
  "clear": false
}
```

**Set geolocation:**
```bash
POST /set/geolocation?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 100,
  "origin": "https://example.com",
  "clear": false
}
```

**Set media emulation:**
```bash
POST /set/media?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "colorScheme": "dark" | "light" | "no-preference" | "none"
}
```

**Set timezone:**
```bash
POST /set/timezone?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "timezoneId": "America/Los_Angeles"
}
```

**Set locale:**
```bash
POST /set/locale?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "locale": "en-US"
}
```

**Set device emulation:**
```bash
POST /set/device?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "name": "iPhone 12"
}
```

### 16. Debugging

**Get console messages:**
```bash
GET /console?profile=clawd&targetId=ABCD1234&level=error
```
- `level` (optional): Filter by level (log, warning, error, etc.)

**Get page errors:**
```bash
GET /errors?profile=clawd&targetId=ABCD1234&clear=false
```
- `clear` (optional): Clear errors after retrieval

**Get network requests:**
```bash
GET /requests?profile=clawd&targetId=ABCD1234&filter=api&clear=false
```
- `filter` (optional): Filter requests by URL pattern
- `clear` (optional): Clear requests after retrieval

**Start trace:**
```bash
POST /trace/start?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "screenshots": true,
  "snapshots": true,
  "sources": true
}
```

**Stop trace:**
```bash
POST /trace/stop?profile=clawd
Body: {
  "targetId": "ABCD1234",
  "path": "/path/to/trace.zip"  // optional
}
```

## Common Operations

### Available Act Kinds

- `click` - Click element (supports doubleClick, button, modifiers)
- `type` - Type text (supports submit, slowly)
- `press` - Press keyboard key
- `hover` - Hover over element
- `scrollIntoView` - Scroll element into view
- `scrollToBottom` - Scroll page to bottom (supports infinite scroll)
- `select` - Select option(s) in dropdown
- `drag` - Drag and drop
- `fill` - Fill form fields
- `resize` - Resize viewport
- `wait` - Wait for condition
- `evaluate` - Execute JavaScript
- `close` - Close page/tab

### Snapshot Formats

- `ai` - AI-readable format with element refs (default)
- `aria` - ARIA tree format

### Element References

Use `refs` from snapshot responses:
- `refs=role` - Role-based refs (default): `e12`, `e34`
- `refs=aria` - ARIA-based refs: `aria-*` attributes

## Best Practices

### 1. Always Check Status First

Before operations, verify browser is running:
```bash
GET /?profile=clawd
```

### 2. Use Snapshot to Find Elements

Don't hardcode refs. Get fresh snapshot:
```bash
GET /snapshot?profile=clawd&format=ai&refs=role
```

### 3. Keep Target IDs

Store `targetId` from responses and reuse for subsequent operations on the same tab.

### 4. Error Handling

Check response status:
- `200` - Success
- `400` - Bad request (missing params, invalid ref)
- `404` - Tab not found
- `409` - Browser not running
- `500` - Server error
- `503` - Browser server not started

### 5. Profile Isolation

Each profile has isolated:
- User data directory
- CDP port (default: 18800+)
- Browser instance

## Common Patterns

### Pattern: Navigate and Interact

```bash
# 1. Open tab
POST /tabs/open
Body: { "url": "https://example.com" }
# Response: { "targetId": "t1", ... }

# 2. Get snapshot
GET /snapshot?targetId=t1&format=ai&refs=role
# Response: { "refs": { "e12": {...}, ... }, ... }

# 3. Click button
POST /act
Body: { "kind": "click", "ref": "e12", "targetId": "t1" }

# 4. Type in form
POST /act
Body: { "kind": "type", "ref": "e34", "text": "test", "targetId": "t1" }
```

### Pattern: Extract Data

```bash
# 1. Navigate
POST /navigate
Body: { "url": "https://example.com", "targetId": "t1" }

# 2. Execute JavaScript
POST /evaluate
Body: {
  "code": "() => ({ title: document.title, url: window.location.href })",
  "targetId": "t1"
}
```

### Pattern: Screenshot Workflow

```bash
# 1. Navigate and wait
POST /navigate
Body: { "url": "https://example.com", "targetId": "t1" }

# 2. Wait for load (if needed)
POST /act
Body: { "kind": "wait", "targetId": "t1", "loadState": "networkidle", "timeoutMs": 5000 }

# 3. Screenshot
POST /screenshot
Body: { "targetId": "t1", "fullPage": true, "type": "png" }
```

### Pattern: Infinite Scroll

```bash
# Scroll to bottom with infinite scroll support
POST /act
Body: {
  "kind": "scrollToBottom",
  "targetId": "t1",
  "maxElementCount": 500,
  "waitTimeoutMs": 5000
}
```

## API Reference

### Base Endpoints

- `GET /` - Get status
- `POST /start` - Start browser
- `POST /stop` - Stop browser
- `POST /reset-profile` - Reset profile (clear user data)
- `GET /profiles` - List profiles
- `POST /profiles/create` - Create profile
- `DELETE /profiles/:name` - Delete profile

### Tab Management

- `GET /tabs` - List tabs
- `POST /tabs/open` - Open tab
- `POST /tabs/focus` - Focus tab
- `DELETE /tabs/:targetId` - Close tab
- `POST /tabs/action` - Tab actions (list/new/close/select)

### Page Operations

- `GET /snapshot` - Get page snapshot
- `POST /navigate` - Navigate to URL
- `POST /screenshot` - Take screenshot
- `POST /pdf` - Generate PDF
- `POST /evaluate` - Execute JavaScript
- `POST /highlight` - Highlight element

### Interactions

- `POST /act` - Execute action (click, type, etc.)
- `POST /hooks/file-chooser` - File upload
- `POST /hooks/dialog` - Handle dialogs
- `POST /download` - Download from element
- `POST /wait/download` - Wait for download

### Network

- `POST /response/body` - Get response body

### Debugging

- `GET /console` - Console messages
- `GET /errors` - Page errors
- `GET /requests` - Network requests
- `POST /trace/start` - Start trace
- `POST /trace/stop` - Stop trace

### Storage

- `GET /cookies` - Get cookies
- `POST /cookies/set` - Set cookie
- `POST /cookies/clear` - Clear cookies
- `GET /storage/:kind` - Get storage (localStorage/sessionStorage)
- `POST /storage/:kind/set` - Set storage
- `POST /storage/:kind/clear` - Clear storage

### Browser Settings

- `POST /set/offline` - Set offline mode
- `POST /set/headers` - Set extra HTTP headers
- `POST /set/credentials` - Set HTTP credentials
- `POST /set/geolocation` - Set geolocation
- `POST /set/media` - Set media emulation
- `POST /set/timezone` - Set timezone
- `POST /set/locale` - Set locale
- `POST /set/device` - Set device emulation

## Testing

Use the built-in web UI:
1. Start server: `bun start`
2. Open browser: `http://127.0.0.1:18791`
3. Test all APIs interactively

## Troubleshooting

**Browser not starting:**
- Check if port is available
- Verify browser executable path
- Check user data directory permissions

**Tab not found:**
- Get fresh tab list: `GET /tabs`
- Use correct `targetId` from response

**Element ref not found:**
- Get fresh snapshot: `GET /snapshot`
- Check if element exists in current page state
- Verify `refs` parameter matches snapshot format

**Timeout errors:**
- Increase timeout in request
- Check if page is fully loaded
- Use `wait` action if needed

## Additional Resources

- For detailed examples and use cases, see [examples.md](examples.md)
- For API documentation, see `browser-use-kit/README.md`
- For interactive testing, use the web UI at `http://127.0.0.1:18791` (when server is running)
