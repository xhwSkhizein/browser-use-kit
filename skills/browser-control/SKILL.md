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
npm install
npm run build
npm start
```

Default: `http://127.0.0.1:18791`

Custom configuration:
```bash
npm start -- --host 0.0.0.0 --port 8080 --token my-secret-token
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
```

**Check status:**
```bash
GET /?profile=clawd
```

**Stop browser:**
```bash
POST /stop?profile=clawd
```

### 2. Page Navigation and Snapshot

**Open a tab:**
```bash
POST /tabs/open?profile=clawd
Body: { "url": "https://example.com" }
```

**Get page snapshot (AI format):**
```bash
GET /snapshot?profile=clawd&format=ai&targetId=<targetId>
```

**Navigate:**
```bash
POST /navigate?profile=clawd
Body: { "url": "https://example.com", "targetId": "<targetId>" }
```

### 3. Element Interaction

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
  "targetId": "<targetId>"
}
```

**Type text:**
```bash
POST /act?profile=clawd
Body: {
  "kind": "type",
  "ref": "e34",
  "text": "Hello World",
  "submit": false
}
```

### 4. JavaScript Execution

**Execute code:**
```bash
POST /evaluate?profile=clawd
Body: {
  "code": "() => document.title",
  "targetId": "<targetId>"
}
```

**Execute on element:**
```bash
POST /evaluate?profile=clawd
Body: {
  "code": "(el) => el.textContent",
  "ref": "e12",
  "targetId": "<targetId>"
}
```

### 5. Screenshots and PDFs

**Screenshot:**
```bash
POST /screenshot?profile=clawd
Body: {
  "targetId": "<targetId>",
  "fullPage": false,
  "ref": "e12",
  "type": "png"
}
```

**Generate PDF:**
```bash
POST /pdf?profile=clawd
Body: { "targetId": "<targetId>" }
```

## Common Operations

### Available Act Kinds

- `click` - Click element (supports doubleClick, button, modifiers)
- `type` - Type text (supports submit, slowly)
- `press` - Press keyboard key
- `hover` - Hover over element
- `scrollIntoView` - Scroll element into view
- `select` - Select option(s) in dropdown
- `drag` - Drag and drop
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

## Advanced Features

### File Upload

```bash
POST /hooks/file-chooser?profile=clawd
Body: {
  "paths": ["/path/to/file.txt"],
  "ref": "e12",
  "targetId": "<targetId>"
}
```

### Dialog Handling

```bash
POST /hooks/dialog?profile=clawd
Body: {
  "accept": true,
  "promptText": "optional text",
  "targetId": "<targetId>"
}
```

### Cookie Management

**Get cookies:**
```bash
GET /cookies?profile=clawd&targetId=<targetId>
```

**Set cookie:**
```bash
POST /cookies/set?profile=clawd
Body: {
  "name": "session",
  "value": "abc123",
  "url": "https://example.com"
}
```

### Console Messages

```bash
GET /console?profile=clawd&targetId=<targetId>&level=error
```

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
- `500` - Server error

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
Body: { "kind": "wait", "targetId": "t1", "timeoutMs": 5000 }

# 3. Screenshot
POST /screenshot
Body: { "targetId": "t1", "fullPage": true, "type": "png" }
```

## API Reference

### Base Endpoints

- `GET /` - Status
- `POST /start` - Start browser
- `POST /stop` - Stop browser
- `GET /profiles` - List profiles

### Tab Management

- `GET /tabs` - List tabs
- `POST /tabs/open` - Open tab
- `POST /tabs/focus` - Focus tab
- `DELETE /tabs/:targetId` - Close tab

### Page Operations

- `GET /snapshot` - Get page snapshot
- `POST /navigate` - Navigate to URL
- `POST /screenshot` - Take screenshot
- `POST /pdf` - Generate PDF
- `POST /evaluate` - Execute JavaScript

### Interactions

- `POST /act` - Execute action (click, type, etc.)
- `POST /hooks/file-chooser` - File upload
- `POST /hooks/dialog` - Handle dialogs

### Debugging

- `GET /console` - Console messages
- `GET /errors` - Page errors
- `GET /requests` - Network requests

### Storage

- `GET /cookies` - Get cookies
- `POST /cookies/set` - Set cookie
- `POST /cookies/clear` - Clear cookies
- `GET /storage/:kind` - Get storage (localStorage/sessionStorage)

## Testing

Use the built-in web UI:
1. Start server: `npm start`
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
