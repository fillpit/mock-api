# 如何访问 Cloudflare Workers 上的管理控制台

## 快速开始

您的 Mock API Server 已成功部署到 Cloudflare Workers！

**访问地址**: https://mock-api-server.kenfei-219.workers.dev/

## 登录管理控制台

1. **访问管理控制台**
   - 打开浏览器访问: https://mock-api-server.kenfei-219.workers.dev/
   - 您将看到登录页面

2. **登录凭据**
   - 用户名: `admin`
   - 密码: 需要通过 Cloudflare Workers 密钥设置

## 设置管理员密码

首次部署时，您需要设置管理员密码和 JWT 密钥：

```bash
# 设置管理员密码
npx wrangler secret put ADMIN_PASSWORD
# 输入您的密码，例如: admin123

# 设置 JWT 密钥（用于生成登录令牌）
npx wrangler secret put JWT_SECRET
# 输入一个随机字符串，例如: your-secret-key-here
```

设置完成后，您就可以使用以下凭据登录：
- 用户名: `admin`
- 密码: 您刚才设置的密码

## 部署流程

### 首次部署

```bash
# 1. 构建项目
npm run build

# 2. 上传静态文件到 KV
npm run upload-static

# 3. 部署 Worker
npm run deploy

# 4. 设置密钥
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
```

### 后续更新

如果您修改了代码或静态文件：

```bash
# 完整部署（包含静态文件上传）
npm run deploy:full
```

如果只修改了 Worker 代码：

```bash
npm run build && npm run deploy
```

如果只修改了前端文件（HTML/CSS/JS）：

```bash
npm run upload-static && npm run deploy
```

## 功能说明

### 管理控制台功能

登录后，您可以：

1. **项目管理**
   - 创建、编辑、删除项目
   - 每个项目有独立的 basePath

2. **接口配置**
   - 为每个项目创建 Mock 接口
   - 配置 HTTP 方法（GET、POST、PUT、DELETE 等）
   - 设置响应状态码、响应头、响应体
   - 配置响应延迟

3. **全局设置**
   - CORS 配置
   - 默认响应头设置

### API 端点

- **管理 API**: `https://mock-api-server.kenfei-219.workers.dev/api/admin/*`
- **Mock API**: `https://mock-api-server.kenfei-219.workers.dev/mock/*`

## 本地开发

如果您想在本地开发和测试：

```bash
# 启动本地开发服务器
npm run dev

# 访问 http://localhost:3000
```

本地开发时，静态文件直接从 `public` 目录读取，无需上传到 KV。

## 故障排除

### 无法登录

1. 确认已设置 `ADMIN_PASSWORD` 和 `JWT_SECRET`：
   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put JWT_SECRET
   ```

2. 检查浏览器控制台是否有错误信息

### 页面显示空白或加载失败

1. 确认静态文件已上传到 KV：
   ```bash
   npm run upload-static
   ```

2. 重新部署：
   ```bash
   npm run deploy
   ```

### 查看 Worker 日志

```bash
npx wrangler tail --format pretty
```

然后访问您的网站，日志会实时显示。

## 技术架构

- **前端**: 纯 HTML/CSS/JavaScript（存储在 Cloudflare KV）
- **后端**: Hono.js 框架运行在 Cloudflare Workers
- **存储**: Cloudflare KV（用于存储项目、接口配置和静态文件）
- **认证**: JWT Token

## 下一步

1. 设置管理员密码
2. 登录管理控制台
3. 创建您的第一个项目
4. 配置 Mock 接口
5. 开始使用！
