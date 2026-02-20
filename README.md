# 📷 Telegram 图床

> 基于 Cloudflare Workers + Telegram Bot API 的免费图床解决方案

🆓 **完全免费** · 💾 **无限存储** · ⚡ **全球CDN** · 📱 **移动优化**

[![GitHub stars](https://img.shields.io/github/stars/CNLiuBei/Cloudflare-telegram-imgge?style=social)](https://github.com/CNLiuBei/Cloudflare-telegram-imgge)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/)

---

## ✨ 特性

### 📤 多种上传方式
- ✅ **点击上传** - 选择本地文件
- ✅ **拖拽上传** - 拖拽文件到页面
- ✅ **粘贴上传** - `Ctrl+V` / `Cmd+V` 直接粘贴
- ✅ **预览确认** - 上传前查看预览，点击可查看大图

### 🎯 核心功能
- 📋 **多格式链接** - URL / Markdown / HTML / BBCode
- 📊 **批量操作** - 批量复制、批量选择
- 🔍 **搜索过滤** - 快速搜索文件名和标签
- 🗑️ **同步删除** - Web端删除自动同步删除TG消息
- 🔒 **安全代理** - 图片URL不暴露Bot Token
- 📱 **响应式设计** - 完美适配桌面端和移动端

### 💡 技术亮点
- ✅ 零成本部署 - Cloudflare 免费额度完全够用
- ✅ 无限容量 - Telegram 作为图片存储后端
- ✅ 全球加速 - Cloudflare CDN 网络分发
- ✅ 无需服务器 - Serverless 架构
- ✅ 自动构建 - GitHub 推送自动部署
- ✅ 自定义域名 - 支持绑定个人域名

---

## 🚀 快速部署

### 方式一：Cloudflare Pages（推荐）

#### 第一步：准备工作

<details>
<summary><b>1. 创建 Telegram Bot</b></summary>

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 创建新 Bot
3. 按提示设置名称，获得 **Bot Token**

```
示例: 8540259082:AAHJ5TSo070bpg1Xnx2XYAqtlntTyc6OocY
```

</details>

<details>
<summary><b>2. 创建 Telegram 频道</b></summary>

1. 创建一个私有频道（用于存储图片）
2. 将 Bot 添加为频道管理员，**确保赋予以下权限：**
   - ✅ 发送消息（Post Messages）
   - ✅ 编辑消息（Edit Messages）
   - ✅ **删除消息（Delete Messages）** - 必需！用于同步删除
3. 获取频道 ID：
   - 发消息到频道，访问 `https://api.telegram.org/bot你的token/getUpdates`
   - 或使用 [@userinfobot](https://t.me/userinfobot) 转发频道消息

```
示例: -1002370158691
```

</details>

<details>
<summary><b>3. 创建 KV 命名空间</b></summary>

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Workers & Pages` → `KV`
3. 创建命名空间，命名为 `IMAGE_DB`
4. 记录命名空间 ID

```
示例: 856a4b0b473748d9963600c117cabbfd
```

</details>

#### 第二步：部署到 Cloudflare

1. **Fork 本项目**
   
   点击右上角 `Fork` 按钮

2. **连接 Cloudflare Pages**
   
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 `Workers & Pages` → `Create application` → `Pages`
   - 选择 `Connect to Git`
   - 授权并选择你 fork 的仓库

3. **配置构建设置**

   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: public
   Root directory: /
   ```

4. **配置环境变量**（重要！）
   
   进入 `Settings` → `Environment variables`，添加：
   
   ```
   TELEGRAM_BOT_TOKEN = 你的Bot Token
   TELEGRAM_CHAT_ID = 你的频道ID
   ```

5. **配置 KV 绑定**（重要！）
   
   进入 `Settings` → `Functions` → `KV namespace bindings`，添加：
   
   ```
   Variable name: IMAGE_DB
   KV namespace: 选择你创建的 IMAGE_DB
   ```

6. **重新部署**
   
   进入 `Deployments` → 点击最新部署的 `...` → `Retry deployment`

#### 第三步：完成 🎉

访问分配的域名即可使用：

```
https://你的项目名.pages.dev
```

#### 第四步（可选）：绑定自定义域名

<details>
<summary>点击展开查看域名绑定步骤</summary>

如果你有自己的域名，可以绑定到 Cloudflare Pages：

**1. 添加自定义域名**

在项目页面中：
- 点击 `Custom domains` 标签
- 点击 `Set up a custom domain`
- 输入你的域名，例如：`img.yourdomain.com`

**2. 配置 DNS**

根据提示配置 DNS 记录，有两种方式：

**方式 A：使用 Cloudflare DNS（推荐）**
- 将域名的 Nameservers 指向 Cloudflare
- Cloudflare 会自动配置所有记录
- 自动启用 SSL/TLS

**方式 B：使用其他 DNS 提供商**
- 添加 CNAME 记录：
  ```
  类型: CNAME
  名称: img (或你的子域名)
  值: 你的项目名.pages.dev
  ```
- 如果是根域名，添加：
  ```
  类型: A
  名称: @
  值: Cloudflare 提供的 IP 地址
  ```

**3. 等待 DNS 生效**
- 通常需要几分钟到几小时
- Cloudflare 会自动签发 SSL 证书
- 完成后可以通过自定义域名访问

**4. 设置域名重定向（可选）**
- 在 `Custom domains` 中可以设置：
  - www 重定向到非 www
  - HTTP 自动跳转到 HTTPS

</details>

---

### 方式二：Wrangler CLI

<details>
<summary>点击展开查看详细步骤</summary>

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

#### 3. 配置 wrangler.toml

编辑 `wrangler.toml`，填入你的配置：

```toml
name = "telegram-image-bed"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
TELEGRAM_BOT_TOKEN = "你的Bot Token"
TELEGRAM_CHAT_ID = "你的频道ID"

[[kv_namespaces]]
binding = "IMAGE_DB"
id = "你的KV命名空间ID"
```

#### 4. 部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Workers
npm run deploy
```

</details>

---

## 📖 使用说明

### 上传图片

1. **选择文件** - 点击 / 拖拽 / 粘贴
2. **预览确认** - 查看缩略图，点击可查看大图
3. **确认上传** - 点击"确认上传"按钮

### 获取链接

1. 选择链接格式（URL / Markdown / HTML / BBCode）
2. 点击"复制"按钮，或批量复制多张图片

### 搜索图片

在搜索框输入文件名或标签，点击"搜索"

### 删除图片

点击"删除"按钮，确认后即可删除

**同步删除：**
- ✅ Web端删除记录
- ✅ 自动删除Telegram频道消息
- ✅ 数据完全同步，不留垃圾

**注意：** Bot需要有频道的"删除消息"权限

---

## ⚙️ 配置说明

### 必需配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `8540259082:AAH...` |
| `TELEGRAM_CHAT_ID` | Telegram 频道 ID | `-1002370158691` |
| `IMAGE_DB` | KV 命名空间绑定 | 在 Cloudflare 控制台配置 |

### 可选配置

可在 `wrangler.toml` 的 `[vars]` 部分添加：

```toml
[vars]
# 允许的图片格式
ALLOWED_TYPES = "image/jpeg,image/png,image/gif,image/webp"

# 最大文件大小（字节）
MAX_FILE_SIZE = "10485760"  # 10MB
```

---

## 📁 项目结构

```
telegram-image-bed/
├── src/
│   ├── index.html       # 前端页面（含内联脚本）
│   └── build-worker.js  # 构建脚本（复制 HTML 到 public/）
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       ├── upload.js    # 图片上传API
│       ├── delete.js    # 图片删除API（含TG同步删除）
│       ├── images.js    # 图片列表API
│       ├── search.js    # 图片搜索API
│       └── image/[id].js # 图片代理API（保护Token）
├── wrangler.toml        # Cloudflare 配置
├── package.json         # 项目配置
└── README.md           # 项目说明
```

---

## 🛠️ 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 本地测试
wrangler dev
```

### 自动部署

推送到 GitHub 后，Cloudflare Pages 会自动构建和部署

```bash
git add .
git commit -m "更新说明"
git push
```

---

## 🌟 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **后端**: Cloudflare Pages Functions
- **存储**: Telegram Bot API（图片）+ Cloudflare KV（元数据）
- **部署**: Cloudflare Pages（GitHub自动部署）
- **CDN**: Cloudflare全球加速网络

---

## ⚠️ 注意事项

### Telegram 限制
- 单个文件最大 20MB
- API 上传速度受 Telegram 服务器限制

### Cloudflare 限制
- Workers 免费版：每天 100,000 次请求
- KV 免费版：每天 100,000 次读取
- Workers 脚本最大 1MB

### 隐私安全
- 图片存储在你的 Telegram 频道
- 建议设置频道为私有
- 图片URL不暴露Bot Token（通过代理API访问）
- 删除操作不可恢复，请谨慎操作
- Bot需要"删除消息"权限才能同步删除

---

## 📄 License

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📮 支持

如有问题，请提交 [Issue](https://github.com/CNLiuBei/Cloudflare-telegram-imgge/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [CNLiuBei](https://github.com/CNLiuBei)

</div>
