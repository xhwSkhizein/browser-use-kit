# Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
cd browser-use-standalone
npm install
```

### 2. Build Project

```bash
npm run build
```

### 3. Start Server

```bash
# Default configuration
npm start

# Or run directly
node dist/cli.js
```

## Python Agent Integration Example

```python
import requests
import json

class BrowserControl:
    def __init__(self, base_url="http://127.0.0.1:18791", token=None):
        self.base_url = base_url.rstrip('/')
        self.headers = {}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
        self.profile = "clawd"

    def _get(self, path, params=None):
        url = f"{self.base_url}{path}"
        resp = requests.get(url, params=params, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path, json_data=None, params=None):
        url = f"{self.base_url}{path}"
        resp = requests.post(url, json=json_data, params=params, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def _delete(self, path, params=None):
        url = f"{self.base_url}{path}"
        resp = requests.delete(url, params=params, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def status(self):
        """Get browser status"""
        return self._get("/", params={"profile": self.profile})

    def start(self):
        """Start browser"""
        return self._post("/start", params={"profile": self.profile})

    def stop(self):
        """Stop browser"""
        return self._post("/stop", params={"profile": self.profile})

    def tabs(self):
        """List all tabs"""
        result = self._get("/tabs", params={"profile": self.profile})
        return result.get("tabs", [])

    def open_tab(self, url):
        """Open new tab"""
        return self._post("/tabs/open", json_data={"url": url}, params={"profile": self.profile})

    def snapshot(self, target_id=None, format="ai"):
        """Get page snapshot"""
        params = {"profile": self.profile, "format": format}
        if target_id:
            params["targetId"] = target_id
        return self._get("/snapshot", params=params)

    def screenshot(self, target_id=None, full_page=False):
        """Take screenshot"""
        json_data = {}
        if target_id:
            json_data["targetId"] = target_id
        json_data["fullPage"] = full_page
        return self._post("/screenshot", json_data=json_data, params={"profile": self.profile})

    def navigate(self, url, target_id=None):
        """Navigate to URL"""
        json_data = {"url": url}
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/navigate", json_data=json_data, params={"profile": self.profile})

    def click(self, ref, target_id=None, double=False):
        """Click element"""
        json_data = {
            "kind": "click",
            "ref": ref,
            "doubleClick": double
        }
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/act", json_data=json_data, params={"profile": self.profile})

    def type(self, ref, text, target_id=None, submit=False):
        """Type text"""
        json_data = {
            "kind": "type",
            "ref": ref,
            "text": text,
            "submit": submit
        }
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/act", json_data=json_data, params={"profile": self.profile})

# Usage example
if __name__ == "__main__":
    browser = BrowserControl()

    # Check status
    status = browser.status()
    print(f"Browser running: {status['running']}")

    # Start browser (if not running)
    if not status['running']:
        browser.start()

    # Open tab
    tab = browser.open_tab("https://example.com")
    target_id = tab['targetId']
    print(f"Opened tab: {target_id}")

    # Get snapshot
    snapshot = browser.snapshot(target_id)
    print(f"Snapshot: {snapshot['snapshot'][:200]}...")

    # Take screenshot
    screenshot = browser.screenshot(target_id)
    print(f"Screenshot saved: {screenshot['path']}")
```

## Common Operation Flows

### 1. Automated Webpage Operations

```python
browser = BrowserControl()

# Start browser
browser.start()

# Open page
tab = browser.open_tab("https://example.com")
target_id = tab['targetId']

# Wait for page load
import time
time.sleep(2)

# Get page snapshot
snapshot = browser.snapshot(target_id, format="ai")

# Find element references from snapshot (e.g., e12)
# Then perform actions
browser.click("e12", target_id=target_id)
browser.type("e23", "Hello, World!", target_id=target_id)
```

### 2. Batch Operations Across Multiple Tabs

```python
browser = BrowserControl()

# Open multiple tabs
tabs = []
for url in ["https://example.com", "https://google.com", "https://github.com"]:
    tab = browser.open_tab(url)
    tabs.append(tab)

# Perform operations on each tab
for tab in tabs:
    target_id = tab['targetId']
    snapshot = browser.snapshot(target_id)
    print(f"Tab {target_id}: {snapshot['url']}")
```

### 3. Error Handling

```python
import requests

browser = BrowserControl()

try:
    browser.start()
    tab = browser.open_tab("https://example.com")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Error: {e}")
```

## Notes

1. **Port Conflicts**: Ensure default ports 18791 and CDP ports (18800+) are not occupied
2. **Browser Executables**: System will auto-detect Chrome/Brave/Edge, or specify via config file
3. **Profile Isolation**: Each profile uses an independent user data directory with no interference
4. **Memory Configuration**: In standalone mode, profile configurations are stored in memory only and lost after restart (except the default `clawd` profile)
