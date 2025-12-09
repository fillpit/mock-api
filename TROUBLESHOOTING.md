# GitHub Actions 部署错误修复指南

## 🔴 错误信息

```
ERROR: A request to the Cloudflare API (/memberships) failed.
Unable to authenticate request [code: 10001]
```

![错误截图](file:///Users/fei/.gemini/antigravity/brain/e39abc67-3c6d-4245-b6b3-8025d61ca4f8/uploaded_image_1765286820114.png)

## 🔍 问题原因

API Token 认证失败，可能的原因：
1. ❌ GitHub Secret `CLOUDFLARE_API_TOKEN` 未设置或值错误
2. ❌ API Token 权限不足
3. ❌ API Token 已过期或被删除

## ✅ 解决方案

### 步骤 1：重新创建 Cloudflare API Token

1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 选择 **Edit Cloudflare Workers** 模板
4. 或者使用 **Custom Token**，设置以下权限：

   **Account 权限**：
   - ✅ `Workers Scripts` - **Edit**
   - ✅ `Workers KV Storage` - **Edit**
   - ✅ `Account Settings` - **Read**

   **Zone 权限**（可选）：
   - 如果需要，可以添加特定 zone 的权限

5. 点击 **Continue to summary**
6. 点击 **Create Token**
7. **立即复制** Token（只显示一次！）

### 步骤 2：更新 GitHub Secret

1. 进入您的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 找到 `CLOUDFLARE_API_TOKEN`
4. 点击 **Update** 或 **Remove** 后重新添加
5. 粘贴新的 API Token
6. 点击 **Update secret** 或 **Add secret**

### 步骤 3：验证其他 Secrets

确认以下 Secrets 都已正确设置：

| Secret 名称 | 如何获取 | 示例值 |
|------------|---------|--------|
| `CLOUDFLARE_API_TOKEN` | 步骤 1 创建的 Token | `xxxxx-xxxxxxxxx-xxxxx` |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard 右侧或 URL 中 | `219d3edb6ebc1cd8c0add11f6bb36c2e` |
| `KV_NAMESPACE_ID` | `wrangler kv:namespace list` | `c31ff2e799ca4438a1063d863f633574` |

#### 获取 Account ID

- 方法 1：登录 Cloudflare Dashboard，右侧显示
- 方法 2：访问任意 Workers 页面，URL 中 `/accounts/` 后面的字符串

#### 获取 KV Namespace ID

```bash
# 本地运行
npx wrangler kv:namespace list
```

或在 Cloudflare Dashboard → **Workers & Pages** → **KV** 中查看

### 步骤 4：重新运行工作流

1. 进入 GitHub 仓库的 **Actions** 标签
2. 选择失败的工作流运行
3. 点击右上角 **Re-run all jobs**

或者推送一个新的提交：

```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

## 🔧 额外检查

### 检查 API Token 权限

确保 Token 有以下权限：
- ✅ Account - Workers Scripts - Edit
- ✅ Account - Workers KV Storage - Edit
- ✅ Account - Account Settings - Read

### 检查 wrangler.toml

确认 `wrangler.toml` 中的配置正确：

```toml
name = "mock-api-server"
main = "dist/index.js"
compatibility_date = "2024-11-01"

[vars]
ADMIN_USERNAME = "admin"

[[kv_namespaces]]
binding = "MOCK_KV"
id = "c31ff2e799ca4438a1063d863f633574"  # 确保这是正确的 ID
```

## 📝 常见问题

### Q: Token 创建后立即失效？
A: 等待 1-2 分钟后再使用，Cloudflare 需要时间同步

### Q: 仍然认证失败？
A: 
1. 确认复制 Token 时没有多余空格
2. 删除旧 Secret，重新创建（不要更新）
3. 尝试创建新的 API Token

### Q: 如何测试 Token 是否有效？
A: 本地运行以下命令测试：

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
npx wrangler whoami
```

应该显示您的账户信息。

## ✅ 验证部署成功

部署成功后，您应该看到：

```
✅ Upload static files to KV
✅ Deploy to Cloudflare Workers
   Deployed mock-api-server triggers
   https://mock-api-server.YOUR_SUBDOMAIN.workers.dev
```

## 🆘 仍然有问题？

如果按照以上步骤仍然失败：

1. 检查 GitHub Actions 日志的详细错误信息
2. 确认 Cloudflare 账户状态正常
3. 尝试手动部署验证本地环境：
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token"
   npm run build
   npx wrangler deploy
   ```
