/**
 * Mock API Server - Main Entry Point (Cloudflare Workers)
 */

import { Hono } from 'hono';
import type { Env, GlobalSettings } from './types.js';
import { DEFAULT_SETTINGS } from './types.js';
import { createKVStorage, MemoryStorage, IStorage } from './storage/index.js';
import { corsMiddleware, staticCorsMiddleware } from './middleware/index.js';
import { createAdminRoutes, createMockRoutes } from './routes/index.js';

type Variables = {
    storage: IStorage;
};

// Get storage instance
function getStorage(env: Env): IStorage {
    // Try KV first (Cloudflare Workers)
    const kvStorage = createKVStorage(env);
    if (kvStorage) {
        return kvStorage;
    }

    // Fall back to memory storage (no persistence in workers without KV)
    return new MemoryStorage();
}

// Get settings from storage
async function getSettings(storage: IStorage): Promise<GlobalSettings> {
    try {
        return await storage.getSettings();
    } catch {
        return DEFAULT_SETTINGS;
    }
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Try to serve static files from KV
        if (
            url.pathname === '/' ||
            url.pathname === '/index.html' ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.ico') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.svg')
        ) {
            // Map root to index.html
            let filename = url.pathname === '/' ? 'index.html' : url.pathname.substring(1);
            const key = `static:${filename}`;

            if (env.MOCK_KV) {
                try {
                    const result = await env.MOCK_KV.getWithMetadata(key, 'arrayBuffer');

                    if (result.value) {
                        const metadata = result.metadata as { contentType?: string } | null;
                        const contentType = metadata?.contentType || 'application/octet-stream';

                        return new Response(result.value, {
                            headers: {
                                'Content-Type': contentType,
                                'Cache-Control': 'public, max-age=3600',
                            },
                        });
                    }
                } catch (e) {
                    console.error('Error serving static file:', e);
                }
            }

            // Fallback: serve a simple info page if static files not found
            if (url.pathname === '/' || url.pathname === '/index.html') {
                const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock API Server</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 800px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 10px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .endpoint { background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .endpoint code { color: #667eea; font-weight: bold; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        .put { background: #fca130; color: white; }
        .delete { background: #f93e3e; color: white; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning h3 { color: #856404; margin-bottom: 10px; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Mock API Server</h1>
        <p>欢迎使用 Mock API Server！这是一个可配置的 Mock API 服务。</p>
        
        <div class="warning">
            <h3>⚠️ 管理控制台未部署</h3>
            <p>要在 Cloudflare Workers 上使用 Web 管理控制台，请运行以下命令上传静态文件：</p>
            <div class="code">node scripts/upload-static-files.js</div>
            <p>然后重新部署：</p>
            <div class="code">npm run deploy</div>
        </div>
        
        <h2>📡 API 端点</h2>
        <div class="endpoint">
            <span class="method post">POST</span>
            <code>/api/admin/login</code>
            <p>管理员登录</p>
        </div>
        <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/admin/projects</code>
            <p>获取所有项目</p>
        </div>
        <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/admin/endpoints</code>
            <p>获取所有接口配置</p>
        </div>
        <div class="endpoint">
            <span class="method get">GET</span>
            <code>/mock/*</code>
            <p>访问配置的 Mock 接口</p>
        </div>
        
        <h2>💡 使用说明</h2>
        <p>1. 使用管理 API 创建项目和配置接口</p>
        <p>2. 通过 /mock/* 路径访问配置的 Mock 接口</p>
        <p>3. 本地开发时，可以使用 Web 管理界面（运行 <code>npm run dev</code>）</p>
        
        <p style="margin-top: 30px; color: #999; font-size: 14px;">
            Worker URL: ${url.origin}
        </p>
    </div>
</body>
</html>
                `;
                return new Response(html, {
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                });
            }

            // For other static files, return 404
            return new Response('Not Found', { status: 404 });
        }

        // Create storage
        const storage = getStorage(env);
        await storage.initialize();

        const storageGetter = () => storage;
        const settingsGetter = () => getSettings(storage);

        // Create app instance
        const workerApp = new Hono<{ Bindings: Env; Variables: Variables }>();

        // Initialize storage middleware
        workerApp.use('*', async (c, next) => {
            c.set('storage', storage);
            await next();
        });

        // Redirect root to index.html
        workerApp.get('/', (c) => c.redirect('/index.html'));

        // CORS for admin routes
        workerApp.use('/api/admin/*', staticCorsMiddleware());

        // Mount admin routes with proper env
        workerApp.route('/api/admin', createAdminRoutes(storageGetter, env));

        // Dynamic CORS for mock routes
        workerApp.use('/mock/*', corsMiddleware(settingsGetter));

        // Mount mock routes under /mock prefix
        workerApp.route('/mock', createMockRoutes(storageGetter, settingsGetter));

        // Handle any other paths as potential mock routes
        workerApp.all('*', async (c) => {
            const path = c.req.path;

            // Skip admin routes
            if (path.startsWith('/api/admin')) {
                return c.notFound();
            }

            // Apply dynamic CORS
            const settings = await settingsGetter();
            const origin = c.req.header('Origin') || '*';
            const isAllowed = settings.corsOrigins.includes('*') ||
                settings.corsOrigins.includes(origin);

            if (isAllowed) {
                const allowedOrigin = settings.corsOrigins.includes('*') ? '*' : origin;
                c.header('Access-Control-Allow-Origin', allowedOrigin);
                c.header('Access-Control-Allow-Methods', settings.corsMethods.join(', '));
                c.header('Access-Control-Allow-Headers', settings.corsHeaders.join(', '));
            }

            if (c.req.method === 'OPTIONS') {
                return new Response(null, { status: 204 });
            }

            // Try to find matching endpoint
            const endpoint = await storage.getEndpointByPath(path, '', c.req.method);

            if (!endpoint) {
                for (const [key, value] of Object.entries(settings.defaultHeaders)) {
                    c.header(key, value);
                }
                return c.json({
                    error: 'Not Found',
                    message: `No mock endpoint configured for ${c.req.method} ${path}`,
                }, 404);
            }

            // Apply delay
            if (endpoint.response.delay && endpoint.response.delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, endpoint.response.delay));
            }

            // Apply headers
            for (const [key, value] of Object.entries(settings.defaultHeaders)) {
                c.header(key, value);
            }
            for (const [key, value] of Object.entries(endpoint.response.headers)) {
                c.header(key, value);
            }

            return c.json(endpoint.response.body, endpoint.response.status as 200);
        });

        return workerApp.fetch(request, env, ctx);
    },
};
