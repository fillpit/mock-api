# 🚀 自动化部署指南

## 一键部署到 Cloudflare Workers

无需本地操作，只需在 GitHub 和 Cloudflare 两个平台配置即可实现自动部署！

---

## 📋 前置准备

### 1. Fork 或推送代码到 GitHub

将此项目推送到您的 GitHub 仓库。

### 2. 获取 Cloudflare 凭据

#### 2.1 获取 Account ID

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在右侧找到您的 **Account ID**（或在任意 Workers 页面的 URL 中查看）

#### 2.2 创建 API Token

1. 访问 [API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 使用 **Edit Cloudflare Workers** 模板
4. 或自定义权限：
   - Account - Workers Scripts - Edit
   - Account - Workers KV Storage - Edit
5. 点击 **Continue to summary** → **Create Token**
6. **复制并保存** 生成的 Token（只显示一次）

#### 2.3 获取 KV Namespace ID

```bash
# 如果已创建 KV namespace
npx wrangler kv:namespace list
```

或在 Cloudflare Dashboard → Workers & Pages → KV 中查看。

如果还没有创建，运行：
```bash
npx wrangler kv:namespace create MOCK_KV
```

---

## ⚙️ 配置 GitHub Secrets

1. 进入您的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下三个密钥：

| Secret Name | 值 | 说明 |
|------------|-----|------|
| `CLOUDFLARE_API_TOKEN` | 您的 API Token | 步骤 2.2 中创建的 |
| `CLOUDFLARE_ACCOUNT_ID` | 您的 Account ID | 步骤 2.1 中获取的 |
| `KV_NAMESPACE_ID` | KV Namespace ID | 步骤 2.3 中获取的，例如 `c31ff2e799ca4438a1063d863f633574` |

---

## 🎯 自动部署

配置完成后，每次推送代码到 `main` 分支，GitHub Actions 会自动：

1. ✅ 安装依赖
2. ✅ 构建项目
3. ✅ 上传静态文件到 KV
4. ✅ 部署 Worker 到 Cloudflare

### 查看部署状态

1. 进入 GitHub 仓库的 **Actions** 标签
2. 查看最新的工作流运行状态
3. 点击查看详细日志

### 手动触发部署

1. 进入 **Actions** 标签
2. 选择 **Deploy to Cloudflare Workers** 工作流
3. 点击 **Run workflow** → **Run workflow**

---

## 🔐 设置管理员密码

部署成功后，还需要设置管理员密码：

### 方法 1: 使用 Cloudflare Dashboard（推荐）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击您的 Worker (`mock-api-server`)
4. 进入 **Settings** → **Variables**
5. 在 **Environment Variables** 部分，点击 **Add variable**
6. 添加以下两个密钥：

| Variable Name | Type | Value |
|--------------|------|-------|
| `ADMIN_PASSWORD` | Secret | 您的管理员密码 |
| `JWT_SECRET` | Secret | 随机字符串（用于 JWT 签名） |

7. 点击 **Save and Deploy**

### 方法 2: 使用 Wrangler CLI

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
```

---

## ✅ 完成！

现在您可以：

1. 访问 `https://mock-api-server.YOUR_SUBDOMAIN.workers.dev/`
2. 使用以下凭据登录：
   - 用户名: `admin`
   - 密码: 您设置的密码
3. 开始配置您的 Mock API！

---

## 📝 工作流程总结

```
推送代码到 GitHub
    ↓
GitHub Actions 自动触发
    ↓
构建 + 上传静态文件 + 部署
    ↓
自动部署到 Cloudflare Workers
    ↓
完成！🎉
```

---

## 🔧 故障排除

### 部署失败

1. 检查 GitHub Actions 日志
2. 确认所有 Secrets 都已正确配置
3. 确认 API Token 权限正确

### 无法登录

1. 确认已在 Cloudflare Dashboard 设置 `ADMIN_PASSWORD` 和 `JWT_SECRET`
2. 检查浏览器控制台错误信息

### 静态文件未更新

1. 检查 GitHub Actions 中的 "Upload static files to KV" 步骤
2. 手动触发一次部署

---

## 📚 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
