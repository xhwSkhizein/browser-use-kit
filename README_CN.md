# Browser Control Server

> copy from [Clawdbot(Moltbot)](https://github.com/moltbot/moltbot)

独立的浏览器控制服务器，为 Python Agent 和其他外部服务提供 HTTP API 接口来控制 Chrome/Brave/Edge/Chromium 浏览器。

## 架构概述

系统通过多层架构来操作浏览器，控制层级如下：

- **HTTP API 层**：本地 HTTP 服务器（默认监听 127.0.0.1:18791）接收控制请求
- **Playwright + CDP 层**：使用 Playwright 库连接到 Chrome DevTools Protocol (CDP)
- **浏览器进程层**：实际的 Chrome/Brave/Edge/Chromium 浏览器实例

系统支持 **clawd 管理模式**（独立浏览器），每个浏览器实例使用独立的用户数据目录，完全隔离。

## 快速开始

### 安装依赖

```bash
cd browser-use-kit
npm install
```

### 构建

```bash
npm run build
```

### 启动服务器

```bash
# 使用默认配置（127.0.0.1:18791）
npm start

# 自定义配置
npm start -- --host 0.0.0.0 --port 8080 --token my-secret-token

# 使用配置文件
npm start -- --config /path/to/config.json
```

### CLI 选项

```
--host <host>     绑定主机地址（默认: 127.0.0.1）
--port <port>     绑定端口（默认: 18791）
--token <token>   认证令牌（Bearer）
--config <path>   配置文件路径（JSON 格式）
--help, -h        显示帮助信息
```

## API 接口

### 基础操作

#### GET `/` - 获取状态
获取浏览器控制服务器和指定 profile 的状态。

**查询参数：**
- `profile` (可选): Profile 名称，默认为 `clawd`

**响应示例：**
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

#### POST `/start` - 启动浏览器
启动指定 profile 的浏览器实例。

**查询参数：**
- `profile` (可选): Profile 名称

#### POST `/stop` - 停止浏览器
停止指定 profile 的浏览器实例。

**查询参数：**
- `profile` (可选): Profile 名称

#### GET `/profiles` - 列出所有 profiles
获取所有可用的 browser profiles。

**响应示例：**
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

### 标签页操作

#### GET `/tabs` - 列出所有标签页
获取指定 profile 的所有标签页。

**查询参数：**
- `profile` (可选): Profile 名称

**响应示例：**
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

#### POST `/tabs/open` - 打开新标签页
打开一个新标签页并导航到指定 URL。

**查询参数：**
- `profile` (可选): Profile 名称

**请求体：**
```json
{
  "url": "https://example.com"
}
```

#### POST `/tabs/focus` - 聚焦标签页
将焦点切换到指定标签页。

**查询参数：**
- `profile` (可选): Profile 名称

**请求体：**
```json
{
  "targetId": "ABCD1234"
}
```

#### DELETE `/tabs/:targetId` - 关闭标签页
关闭指定的标签页。

**查询参数：**
- `profile` (可选): Profile 名称

### 快照和截图

#### GET `/snapshot` - 获取页面快照
获取当前页面的 AI 快照或 ARIA 树。

**查询参数：**
- `profile` (可选): Profile 名称
- `targetId` (可选): 目标标签页 ID
- `format`: `ai` 或 `aria`（默认: `ai`）
- `limit` (可选): 限制节点数量
- `maxChars` (可选): 最大字符数
- `refs` (可选): `role` 或 `aria`
- `interactive` (可选): 布尔值，仅返回可交互元素
- `compact` (可选): 布尔值，紧凑模式
- `depth` (可选): 最大深度
- `selector` (可选): CSS 选择器
- `frame` (可选): iframe 选择器
- `labels` (可选): 布尔值，包含标签截图
- `mode` (可选): `efficient` 高效模式

**响应示例（AI 格式）：**
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

#### POST `/screenshot` - 截图
捕获页面或元素的截图。

**查询参数：**
- `profile` (可选): Profile 名称

**请求体：**
```json
{
  "targetId": "ABCD1234",
  "fullPage": false,
  "ref": "e12",
  "element": "#main",
  "type": "png"
}
```

**响应：**
返回图片文件路径。

### 操作

#### POST `/navigate` - 导航
导航到指定 URL。

**查询参数：**
- `profile` (可选): Profile 名称

**请求体：**
```json
{
  "url": "https://example.com",
  "targetId": "ABCD1234"
}
```

#### POST `/act` - 执行操作
执行浏览器操作（点击、输入、拖拽等）。

**查询参数：**
- `profile` (可选): Profile 名称

**请求体示例（点击）：**
```json
{
  "kind": "click",
  "targetId": "ABCD1234",
  "ref": "e12",
  "doubleClick": false,
  "button": "left"
}
```

**请求体示例（输入）：**
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

**支持的操作类型：**
- `click`: 点击
- `type`: 输入文本
- `press`: 按键
- `hover`: 悬停
- `drag`: 拖拽
- `select`: 选择选项
- `fill`: 填充表单
- `resize`: 调整窗口大小
- `wait`: 等待
- `evaluate`: 执行 JavaScript
- `close`: 关闭标签页

### 其他接口

- `GET /console` - 获取控制台消息
- `POST /pdf` - 生成 PDF
- `POST /hooks/file-chooser` - 设置文件选择器
- `POST /hooks/dialog` - 设置对话框处理
- `GET /cookies` - 获取 Cookies
- `POST /cookies/set` - 设置 Cookie
- `POST /cookies/clear` - 清除 Cookies
- `GET /storage/:kind` - 获取存储（local/session）
- `POST /storage/:kind/set` - 设置存储
- `POST /storage/:kind/clear` - 清除存储

## 配置文件

可以通过 `--config` 参数指定配置文件，格式如下：

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

## 认证

如果启动时指定了 `--token`，所有请求都需要在 `Authorization` header 中包含 Bearer token：

```bash
curl -H "Authorization: Bearer your-token" http://127.0.0.1:18791/
```

## Python 客户端示例

```python
import requests

BASE_URL = "http://127.0.0.1:18791"
PROFILE = "clawd"
HEADERS = {
    "Authorization": "Bearer your-token"  # 如果启用了认证
}

# 获取状态
response = requests.get(f"{BASE_URL}/", params={"profile": PROFILE}, headers=HEADERS)
status = response.json()
print(f"Browser running: {status['running']}")

# 启动浏览器
if not status['running']:
    requests.post(f"{BASE_URL}/start", params={"profile": PROFILE}, headers=HEADERS)

# 打开标签页
response = requests.post(
    f"{BASE_URL}/tabs/open",
    params={"profile": PROFILE},
    json={"url": "https://example.com"},
    headers=HEADERS
)
tab = response.json()
target_id = tab['targetId']

# 获取快照
response = requests.get(
    f"{BASE_URL}/snapshot",
    params={"profile": PROFILE, "targetId": target_id, "format": "ai"},
    headers=HEADERS
)
snapshot = response.json()
print(snapshot['snapshot'])

# 执行点击操作
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

## 目录结构

```
browser-use-kit/
├── src/
│   ├── index.ts              # 主入口，导出 API
│   ├── cli.ts                 # CLI 入口
│   ├── bridge-server.ts       # HTTP 服务器
│   ├── chrome.ts              # Chrome 启动和管理
│   ├── pw-session.ts          # Playwright 会话管理
│   ├── pw-tools-core.ts       # Playwright 工具核心
│   ├── config.ts              # 配置解析
│   ├── server-context.ts       # 服务器上下文
│   ├── routes/                 # 路由处理
│   └── ...                    # 其他支持文件
├── package.json
├── tsconfig.json
└── README.md
```

## 依赖

- Node.js >= 22.0.0
- express: HTTP 服务器
- playwright-core: 浏览器自动化
- ws: WebSocket 客户端

## 注意事项

1. **端口范围**：CDP 端口默认从 18800 开始分配，确保这些端口可用
2. **浏览器可执行文件**：系统会自动检测 Chrome/Brave/Edge/Chromium，也可以通过 `executablePath` 指定
3. **用户数据目录**：每个 profile 使用独立的用户数据目录，位于 `~/.browser-control/browser/<profile-name>/user-data`
4. **内存管理**：在 standalone 模式下，profiles 配置仅保存在内存中，重启服务器后会丢失（除了默认的 `clawd` profile）

## Web API 测试界面

项目包含一个内置的 Web 测试界面，可以方便地测试所有 API 接口。

### 启动测试界面

**只需启动浏览器控制服务器，测试界面会自动可用！**

```bash
npm install
npm run build
npm start
```

然后在浏览器中打开 `http://127.0.0.1:18791/`（或你配置的服务器地址）即可使用测试界面。

**优势：**
- ✅ 无需单独启动 Web 服务器
- ✅ 无需担心 CORS 跨域问题
- ✅ 自动检测服务器地址
- ✅ 一个服务搞定所有功能

测试界面功能：
- 📋 所有 API 接口的完整列表
- 📝 每个接口的参数表单
- 🚀 实时发送请求并查看响应
- 📊 格式化显示 JSON 响应
- 🔐 支持认证 Token 配置
- 📱 响应式设计，支持移动设备

## 许可证

MIT
