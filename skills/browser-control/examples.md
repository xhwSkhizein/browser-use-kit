# Browser Control Examples

Practical examples for common browser automation tasks.

## Example 1: Form Submission

```bash
# Step 1: Open page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/form"}'

# Response: {"targetId": "t1", "title": "...", "url": "..."}

# Step 2: Get snapshot to find form fields
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Response includes refs like:
# "refs": {
#   "e12": {"role": "textbox", "name": "Email"},
#   "e34": {"role": "textbox", "name": "Password"},
#   "e56": {"role": "button", "name": "Submit"}
# }

# Step 3: Fill email field
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "type",
    "ref": "e12",
    "text": "user@example.com",
    "targetId": "t1"
  }'

# Step 4: Fill password field
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "type",
    "ref": "e34",
    "text": "password123",
    "targetId": "t1"
  }'

# Step 5: Submit form
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e56",
    "targetId": "t1"
  }'
```

## Example 2: Fill Form with Multiple Fields

```bash
# Step 1: Get snapshot to find form fields
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Fill multiple fields at once
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "fill",
    "targetId": "t1",
    "fields": [
      {"ref": "e12", "type": "text", "value": "John Doe"},
      {"ref": "e34", "type": "text", "value": "john@example.com"},
      {"ref": "e56", "type": "checkbox", "value": true},
      {"ref": "e78", "type": "select", "value": "option1"}
    ]
  }'
```

## Example 3: Data Extraction

```bash
# Step 1: Navigate to page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/products"}'

# Response: {"targetId": "t1", ...}

# Step 2: Extract data using JavaScript
curl -X POST "http://127.0.0.1:18791/evaluate?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "() => { return Array.from(document.querySelectorAll(\".product\")).map(el => ({ name: el.querySelector(\".name\")?.textContent, price: el.querySelector(\".price\")?.textContent })); }",
    "targetId": "t1"
  }'

# Response: {"ok": true, "result": [{"name": "Product 1", "price": "$10"}, ...]}
```

## Example 4: Screenshot Workflow

```bash
# Step 1: Navigate
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Response: {"targetId": "t1", ...}

# Step 2: Wait for page load
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "loadState": "networkidle",
    "timeoutMs": 5000
  }'

# Step 3: Take full page screenshot
curl -X POST "http://127.0.0.1:18791/screenshot?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "fullPage": true,
    "type": "png"
  }'

# Response: {"ok": true, "path": "/path/to/screenshot.png", ...}
```

## Example 5: Element Screenshot

```bash
# Step 1: Get snapshot to find element
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Response includes: "e78": {"role": "img", "name": "Product Image"}

# Step 2: Screenshot specific element
curl -X POST "http://127.0.0.1:18791/screenshot?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "ref": "e78",
    "type": "png"
  }'
```

## Example 6: File Upload

```bash
# Step 1: Navigate to upload page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/upload"}'

# Response: {"targetId": "t1", ...}

# Step 2: Get snapshot to find upload button
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Response includes: "e90": {"role": "button", "name": "Choose File"}

# Step 3: Arm file chooser and click
curl -X POST "http://127.0.0.1:18791/hooks/file-chooser?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/path/to/file.pdf"],
    "ref": "e90",
    "targetId": "t1"
  }'

# Alternative: Set files directly on input element
curl -X POST "http://127.0.0.1:18791/hooks/file-chooser?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/path/to/file1.pdf", "/path/to/file2.jpg"],
    "inputRef": "e90",
    "targetId": "t1"
  }'
```

## Example 7: Dialog Handling

```bash
# Step 1: Navigate to page with alert
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Response: {"targetId": "t1", ...}

# Step 2: Arm dialog handler (before action that triggers dialog)
curl -X POST "http://127.0.0.1:18791/hooks/dialog?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "accept": true,
    "promptText": "Custom text",
    "targetId": "t1",
    "timeoutMs": 5000
  }'

# Step 3: Trigger action that shows dialog
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e12",
    "targetId": "t1"
  }'
```

## Example 8: Multi-Tab Workflow

```bash
# Step 1: Open first tab
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/page1"}'

# Response: {"targetId": "t1", ...}

# Step 2: Open second tab
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/page2"}'

# Response: {"targetId": "t2", ...}

# Step 3: List all tabs
curl "http://127.0.0.1:18791/tabs?profile=clawd"

# Response: {"running": true, "tabs": [{"targetId": "t1", ...}, {"targetId": "t2", ...}]}

# Step 4: Switch focus
curl -X POST "http://127.0.0.1:18791/tabs/focus?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'

# Step 5: Close tab
curl -X DELETE "http://127.0.0.1:18791/tabs/t2?profile=clawd"
```

## Example 9: Cookie Management

```bash
# Step 1: Navigate to site
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Response: {"targetId": "t1", ...}

# Step 2: Set authentication cookie
curl -X POST "http://127.0.0.1:18791/cookies/set?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "cookie": {
      "name": "session",
      "value": "abc123xyz",
      "url": "https://example.com",
      "domain": ".example.com",
      "path": "/",
      "expires": 1735689600,
      "secure": true,
      "httpOnly": true,
      "sameSite": "Lax"
    }
  }'

# Step 3: Get all cookies
curl "http://127.0.0.1:18791/cookies?profile=clawd&targetId=t1"

# Step 4: Clear cookies
curl -X POST "http://127.0.0.1:18791/cookies/clear?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'
```

## Example 10: Storage Management

```bash
# Step 1: Set localStorage value
curl -X POST "http://127.0.0.1:18791/storage/local/set?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "key": "userPrefs",
    "value": "{\"theme\":\"dark\",\"lang\":\"en\"}"
  }'

# Step 2: Get localStorage value
curl "http://127.0.0.1:18791/storage/local?profile=clawd&targetId=t1&key=userPrefs"

# Step 3: Get all localStorage items
curl "http://127.0.0.1:18791/storage/local?profile=clawd&targetId=t1"

# Step 4: Set sessionStorage value
curl -X POST "http://127.0.0.1:18791/storage/session/set?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "key": "tempData",
    "value": "temporary"
  }'

# Step 5: Clear localStorage
curl -X POST "http://127.0.0.1:18791/storage/local/clear?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'
```

## Example 11: PDF Generation

```bash
# Step 1: Navigate to page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/report"}'

# Response: {"targetId": "t1", ...}

# Step 2: Wait for content to load
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "loadState": "networkidle",
    "timeoutMs": 5000
  }'

# Step 3: Generate PDF
curl -X POST "http://127.0.0.1:18791/pdf?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'

# Response: {"ok": true, "path": "/path/to/output.pdf", ...}
```

## Example 12: Scroll to Bottom (Infinite Scroll)

```bash
# Step 1: Navigate to page with infinite scroll
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/infinite-scroll"}'

# Response: {"targetId": "t1", ...}

# Step 2: Scroll to bottom with infinite scroll support
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "scrollToBottom",
    "targetId": "t1",
    "maxElementCount": 500,
    "waitTimeoutMs": 5000
  }'

# Response:
# {
#   "ok": true,
#   "targetId": "t1",
#   "scrolled": true,
#   "scrollCount": 3,
#   "finalHeight": 5000,
#   "initialHeight": 2000,
#   "scrollableInfo": {
#     "isWindow": true,
#     "selector": null,
#     "scrollHeight": 5000,
#     "clientHeight": 800
#   }
# }
```

## Example 13: Wait Conditions

```bash
# Wait for specific time
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "timeMs": 2000
  }'

# Wait for text to appear
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "text": "Loading complete",
    "timeoutMs": 10000
  }'

# Wait for text to disappear
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "textGone": "Loading...",
    "timeoutMs": 10000
  }'

# Wait for selector
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "selector": ".loaded",
    "timeoutMs": 10000
  }'

# Wait for URL change
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "url": "https://example.com/success",
    "timeoutMs": 10000
  }'

# Wait for load state
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "loadState": "networkidle",
    "timeoutMs": 30000
  }'

# Wait for custom function
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "fn": "() => document.readyState === \"complete\" && window.jQuery !== undefined",
    "timeoutMs": 10000
  }'
```

## Example 14: Drag and Drop

```bash
# Step 1: Get snapshot to find elements
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Drag element from startRef to endRef
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "drag",
    "startRef": "e12",
    "endRef": "e34",
    "targetId": "t1",
    "timeoutMs": 30000
  }'
```

## Example 15: Select Options

```bash
# Step 1: Get snapshot to find select element
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Select single option
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "select",
    "ref": "e12",
    "values": ["option1"],
    "targetId": "t1"
  }'

# Step 3: Select multiple options
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "select",
    "ref": "e12",
    "values": ["option1", "option2", "option3"],
    "targetId": "t1"
  }'
```

## Example 16: Keyboard Interactions

```bash
# Press Enter key
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "press",
    "key": "Enter",
    "targetId": "t1"
  }'

# Press key with delay
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "press",
    "key": "Tab",
    "targetId": "t1",
    "delayMs": 100
  }'

# Click with modifiers (Ctrl+Click)
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e12",
    "targetId": "t1",
    "modifiers": ["Control"]
  }'

# Double click
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e12",
    "targetId": "t1",
    "doubleClick": true
  }'

# Right click
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e12",
    "targetId": "t1",
    "button": "right"
  }'
```

## Example 17: Hover and Scroll

```bash
# Hover over element
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "hover",
    "ref": "e12",
    "targetId": "t1"
  }'

# Scroll element into view
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "scrollIntoView",
    "ref": "e12",
    "targetId": "t1"
  }'
```

## Example 18: Resize Viewport

```bash
# Resize browser viewport
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "resize",
    "width": 1920,
    "height": 1080,
    "targetId": "t1"
  }'

# Mobile viewport
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "resize",
    "width": 375,
    "height": 667,
    "targetId": "t1"
  }'
```

## Example 19: Browser Settings - Offline Mode

```bash
# Enable offline mode
curl -X POST "http://127.0.0.1:18791/set/offline?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "offline": true
  }'

# Disable offline mode
curl -X POST "http://127.0.0.1:18791/set/offline?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "offline": false
  }'
```

## Example 20: Browser Settings - HTTP Headers

```bash
# Set custom HTTP headers
curl -X POST "http://127.0.0.1:18791/set/headers?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Custom Bot)",
      "Authorization": "Bearer token123",
      "X-Custom-Header": "value"
    }
  }'
```

## Example 21: Browser Settings - Geolocation

```bash
# Set geolocation
curl -X POST "http://127.0.0.1:18791/set/geolocation?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 100,
    "origin": "https://example.com"
  }'

# Clear geolocation
curl -X POST "http://127.0.0.1:18791/set/geolocation?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "clear": true
  }'
```

## Example 22: Browser Settings - Media Emulation

```bash
# Set dark mode
curl -X POST "http://127.0.0.1:18791/set/media?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "colorScheme": "dark"
  }'

# Set light mode
curl -X POST "http://127.0.0.1:18791/set/media?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "colorScheme": "light"
  }'

# Reset media preferences
curl -X POST "http://127.0.0.1:18791/set/media?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "colorScheme": "none"
  }'
```

## Example 23: Browser Settings - Timezone and Locale

```bash
# Set timezone
curl -X POST "http://127.0.0.1:18791/set/timezone?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "timezoneId": "America/Los_Angeles"
  }'

# Set locale
curl -X POST "http://127.0.0.1:18791/set/locale?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "locale": "zh-CN"
  }'
```

## Example 24: Device Emulation

```bash
# Emulate iPhone 12
curl -X POST "http://127.0.0.1:18791/set/device?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "name": "iPhone 12"
  }'

# Emulate iPad
curl -X POST "http://127.0.0.1:18791/set/device?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "name": "iPad Pro"
  }'
```

## Example 25: HTTP Credentials

```bash
# Set HTTP basic authentication
curl -X POST "http://127.0.0.1:18791/set/credentials?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "username": "admin",
    "password": "secret123"
  }'

# Clear credentials
curl -X POST "http://127.0.0.1:18791/set/credentials?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "clear": true
  }'
```

## Example 26: Downloads

```bash
# Step 1: Get snapshot to find download link
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Download file from element
curl -X POST "http://127.0.0.1:18791/download?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "e12",
    "path": "/path/to/downloads/file.pdf",
    "targetId": "t1",
    "timeoutMs": 30000
  }'

# Step 3: Wait for download (alternative)
curl -X POST "http://127.0.0.1:18791/wait/download?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "path": "/path/to/downloads/file.pdf",
    "timeoutMs": 30000
  }'
```

## Example 27: Network Response Body

```bash
# Step 1: Navigate to page that makes API calls
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Response: {"targetId": "t1", ...}

# Step 2: Get response body from network request
curl -X POST "http://127.0.0.1:18791/response/body?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/api/data",
    "targetId": "t1",
    "timeoutMs": 30000,
    "maxChars": 10000
  }'

# Response: {"ok": true, "response": {...}, ...}
```

## Example 28: Element Highlighting

```bash
# Step 1: Get snapshot to find element
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Highlight element (useful for debugging)
curl -X POST "http://127.0.0.1:18791/highlight?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "e12",
    "targetId": "t1"
  }'
```

## Example 29: Debugging - Console Messages

```bash
# Get all console messages
curl "http://127.0.0.1:18791/console?profile=clawd&targetId=t1"

# Get only error messages
curl "http://127.0.0.1:18791/console?profile=clawd&targetId=t1&level=error"

# Get warnings
curl "http://127.0.0.1:18791/console?profile=clawd&targetId=t1&level=warning"
```

## Example 30: Debugging - Page Errors

```bash
# Get page errors
curl "http://127.0.0.1:18791/errors?profile=clawd&targetId=t1"

# Get and clear errors
curl "http://127.0.0.1:18791/errors?profile=clawd&targetId=t1&clear=true"
```

## Example 31: Debugging - Network Requests

```bash
# Get all network requests
curl "http://127.0.0.1:18791/requests?profile=clawd&targetId=t1"

# Filter requests by URL pattern
curl "http://127.0.0.1:18791/requests?profile=clawd&targetId=t1&filter=api"

# Get and clear requests
curl "http://127.0.0.1:18791/requests?profile=clawd&targetId=t1&clear=true"
```

## Example 32: Trace Recording

```bash
# Step 1: Start trace
curl -X POST "http://127.0.0.1:18791/trace/start?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "screenshots": true,
    "snapshots": true,
    "sources": true
  }'

# Step 2: Perform actions
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e12",
    "targetId": "t1"
  }'

# Step 3: Stop trace and save
curl -X POST "http://127.0.0.1:18791/trace/stop?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "path": "/path/to/trace.zip"
  }'
```

## Example 33: Profile Management

```bash
# List all profiles
curl "http://127.0.0.1:18791/profiles"

# Create new profile
curl -X POST "http://127.0.0.1:18791/profiles/create?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "work-profile",
    "color": "#0066CC",
    "driver": "clawd"
  }'

# Delete profile
curl -X DELETE "http://127.0.0.1:18791/profiles/work-profile?profile=clawd"

# Reset profile (clear user data)
curl -X POST "http://127.0.0.1:18791/reset-profile?profile=clawd"
```

## Example 34: Complete Workflow - E-commerce Scraping

```bash
# Step 1: Start browser and open page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/products"}'

# Response: {"targetId": "t1", ...}

# Step 2: Wait for page load
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "loadState": "networkidle",
    "timeoutMs": 10000
  }'

# Step 3: Scroll to load more products
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "scrollToBottom",
    "targetId": "t1",
    "maxElementCount": 100,
    "waitTimeoutMs": 3000
  }'

# Step 4: Extract product data
curl -X POST "http://127.0.0.1:18791/evaluate?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "() => Array.from(document.querySelectorAll(\".product\")).map(el => ({ name: el.querySelector(\".name\")?.textContent, price: el.querySelector(\".price\")?.textContent, image: el.querySelector(\"img\")?.src }))",
    "targetId": "t1"
  }'

# Step 5: Take screenshot
curl -X POST "http://127.0.0.1:18791/screenshot?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "t1",
    "fullPage": true,
    "type": "png"
  }'
```

## Example 35: Complete Workflow - Form Automation

```bash
# Step 1: Open form page
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/contact"}'

# Response: {"targetId": "t1", ...}

# Step 2: Get snapshot
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 3: Fill form using fill action
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "fill",
    "targetId": "t1",
    "fields": [
      {"ref": "e12", "type": "text", "value": "John Doe"},
      {"ref": "e34", "type": "text", "value": "john@example.com"},
      {"ref": "e56", "type": "text", "value": "Hello, I need help"},
      {"ref": "e78", "type": "select", "value": "support"}
    ]
  }'

# Step 4: Submit form
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "click",
    "ref": "e90",
    "targetId": "t1"
  }'

# Step 5: Wait for success message
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "wait",
    "targetId": "t1",
    "text": "Thank you",
    "timeoutMs": 10000
  }'
```

## Example 36: Snapshot with Labels

```bash
# Get snapshot with screenshot labels (useful for visual debugging)
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role&labels=true"

# Response includes:
# {
#   "ok": true,
#   "format": "ai",
#   "labels": true,
#   "labelsCount": 15,
#   "labelsSkipped": 2,
#   "imagePath": "/path/to/labeled-screenshot.png",
#   "imageType": "png",
#   "snapshot": "...",
#   "refs": {...}
# }
```

## Example 37: Efficient Snapshot Mode

```bash
# Get efficient snapshot (interactive only, compact, limited depth)
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&mode=efficient"

# Equivalent to:
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&interactive=true&compact=true&depth=3"
```

## Example 38: Snapshot with Selector Filter

```bash
# Get snapshot filtered by CSS selector
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&selector=.main-content"

# Get snapshot from iframe
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&frame=#my-iframe"
```

## Example 39: Type with Submit

```bash
# Type text and submit (press Enter)
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "type",
    "ref": "e12",
    "text": "search query",
    "targetId": "t1",
    "submit": true
  }'

# Type slowly (character by character)
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "type",
    "ref": "e12",
    "text": "Hello World",
    "targetId": "t1",
    "slowly": true
  }'
```

## Example 40: Evaluate on Element

```bash
# Step 1: Get snapshot
curl "http://127.0.0.1:18791/snapshot?profile=clawd&targetId=t1&format=ai&refs=role"

# Step 2: Evaluate JavaScript on specific element
curl -X POST "http://127.0.0.1:18791/evaluate?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "(el) => el.textContent.trim()",
    "ref": "e12",
    "targetId": "t1"
  }'

# Or using act endpoint
curl -X POST "http://127.0.0.1:18791/act?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "evaluate",
    "fn": "(el) => el.getAttribute(\"data-id\")",
    "ref": "e12",
    "targetId": "t1"
  }'
```
