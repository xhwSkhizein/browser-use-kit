# 使用说明

## 快速开始

### 1. 安装依赖

```bash
cd browser-use-kit
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 启动服务器

```bash
# 使用默认配置
npm start

# 或直接运行
node dist/cli.js
```

## Python Agent 集成示例

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
        """获取浏览器状态"""
        return self._get("/", params={"profile": self.profile})
    
    def start(self):
        """启动浏览器"""
        return self._post("/start", params={"profile": self.profile})
    
    def stop(self):
        """停止浏览器"""
        return self._post("/stop", params={"profile": self.profile})
    
    def tabs(self):
        """列出所有标签页"""
        result = self._get("/tabs", params={"profile": self.profile})
        return result.get("tabs", [])
    
    def open_tab(self, url):
        """打开新标签页"""
        return self._post("/tabs/open", json_data={"url": url}, params={"profile": self.profile})
    
    def snapshot(self, target_id=None, format="ai"):
        """获取页面快照"""
        params = {"profile": self.profile, "format": format}
        if target_id:
            params["targetId"] = target_id
        return self._get("/snapshot", params=params)
    
    def screenshot(self, target_id=None, full_page=False):
        """截图"""
        json_data = {}
        if target_id:
            json_data["targetId"] = target_id
        json_data["fullPage"] = full_page
        return self._post("/screenshot", json_data=json_data, params={"profile": self.profile})
    
    def navigate(self, url, target_id=None):
        """导航到 URL"""
        json_data = {"url": url}
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/navigate", json_data=json_data, params={"profile": self.profile})
    
    def click(self, ref, target_id=None, double=False):
        """点击元素"""
        json_data = {
            "kind": "click",
            "ref": ref,
            "doubleClick": double
        }
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/act", json_data=json_data, params={"profile": self.profile})
    
    def type(self, ref, text, target_id=None, submit=False):
        """输入文本"""
        json_data = {
            "kind": "type",
            "ref": ref,
            "text": text,
            "submit": submit
        }
        if target_id:
            json_data["targetId"] = target_id
        return self._post("/act", json_data=json_data, params={"profile": self.profile})

# 使用示例
if __name__ == "__main__":
    browser = BrowserControl()
    
    # 检查状态
    status = browser.status()
    print(f"Browser running: {status['running']}")
    
    # 启动浏览器（如果未运行）
    if not status['running']:
        browser.start()
    
    # 打开标签页
    tab = browser.open_tab("https://example.com")
    target_id = tab['targetId']
    print(f"Opened tab: {target_id}")
    
    # 获取快照
    snapshot = browser.snapshot(target_id)
    print(f"Snapshot: {snapshot['snapshot'][:200]}...")
    
    # 截图
    screenshot = browser.screenshot(target_id)
    print(f"Screenshot saved: {screenshot['path']}")
```

## 常见操作流程

### 1. 自动化网页操作

```python
browser = BrowserControl()

# 启动浏览器
browser.start()

# 打开页面
tab = browser.open_tab("https://example.com")
target_id = tab['targetId']

# 等待页面加载
import time
time.sleep(2)

# 获取页面快照
snapshot = browser.snapshot(target_id, format="ai")

# 从快照中找到元素引用（例如 e12）
# 然后执行操作
browser.click("e12", target_id=target_id)
browser.type("e23", "Hello, World!", target_id=target_id)
```

### 2. 批量操作多个标签页

```python
browser = BrowserControl()

# 打开多个标签页
tabs = []
for url in ["https://example.com", "https://google.com", "https://github.com"]:
    tab = browser.open_tab(url)
    tabs.append(tab)

# 对每个标签页进行操作
for tab in tabs:
    target_id = tab['targetId']
    snapshot = browser.snapshot(target_id)
    print(f"Tab {target_id}: {snapshot['url']}")
```

### 3. 错误处理

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

## 注意事项

1. **端口冲突**：确保默认端口 18791 和 CDP 端口（18800+）未被占用
2. **浏览器可执行文件**：系统会自动检测 Chrome/Brave/Edge，也可通过配置文件指定
3. **Profile 隔离**：每个 profile 使用独立的用户数据目录，互不干扰
4. **内存配置**：Standalone 模式下，profiles 配置仅保存在内存中，重启后丢失（除了默认的 `clawd` profile）
