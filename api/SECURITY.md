# API 提交前安全说明

## 不应提交的内容

- `wrangler.toml`：包含实际 Cloudflare 资源 ID，虽然 `database_id` 不是访问令牌，也不应把本地部署配置提交到公开仓库；
- `.dev.vars`、`.env*`：本地变量和可能的密钥；
- `.data/`：生成的 SQL、NDJSON、清单和断点文件，可能包含完整数据内容；
- `.wrangler/`、`node_modules/`、`coverage/`、构建目录和日志；
- 任何 token、密码、私钥或 Cloudflare API 凭据。

这些路径已在 `api/.gitignore` 中处理。`wrangler.toml.example` 只保留占位符，可以提交。

## 当前 API 暴露面

- API 是公开只读接口，当前不使用登录或 API Key；
- 根路径调试页只发起 GET 请求，不提供写入操作；
- Worker 不把异常堆栈返回给客户端，只返回统一的 `INTERNAL_ERROR`；
- CORS 当前由 `ALLOWED_ORIGIN` 控制，公开部署默认使用 `*`；如改为前端专用，应在部署配置中设置明确域名；
- `console.error` 仅用于 Cloudflare 日志，新增日志时不要打印请求头、令牌、完整 SQL 或原始敏感字段。

## 提交前建议

```powershell
cd api
npm test
git status --short --ignored
git diff --check
git check-ignore -v wrangler.toml .data\seed-cf .wrangler node_modules .env .dev.vars
```

提交前检查 staged 文件内容，不要只依赖文件名判断：

```powershell
git diff --cached --name-only
git diff --cached -- . ':!package-lock.json'
```
