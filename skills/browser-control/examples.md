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

## Example 2: Data Extraction

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

## Example 3: Screenshot Workflow

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

## Example 4: Element Screenshot

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

## Example 5: File Upload

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
```

## Example 6: Dialog Handling

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
    "targetId": "t1"
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

## Example 7: Multi-Tab Workflow

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

## Example 8: Cookie Management

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
    "name": "session",
    "value": "abc123xyz",
    "url": "https://example.com",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  }'

# Step 3: Get all cookies
curl "http://127.0.0.1:18791/cookies?profile=clawd&targetId=t1"

# Step 4: Clear cookies
curl -X POST "http://127.0.0.1:18791/cookies/clear?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'
```

## Example 9: PDF Generation

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
    "timeoutMs": 3000
  }'

# Step 3: Generate PDF
curl -X POST "http://127.0.0.1:18791/pdf?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "t1"}'

# Response: {"ok": true, "path": "/path/to/output.pdf", ...}
```

## Example 10: JavaScript Data Extraction

```bash
# Navigate and extract structured data
curl -X POST "http://127.0.0.1:18791/tabs/open?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/data"}'

# Response: {"targetId": "t1", ...}

# Extract multiple data points
curl -X POST "http://127.0.0.1:18791/evaluate?profile=clawd" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "() => ({ title: document.title, url: window.location.href, headings: Array.from(document.querySelectorAll(\"h1, h2\")).map(h => h.textContent), links: Array.from(document.querySelectorAll(\"a\")).slice(0, 10).map(a => ({ text: a.textContent, href: a.href })) })",
    "targetId": "t1"
  }'
```
