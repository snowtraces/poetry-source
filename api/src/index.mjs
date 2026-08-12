import { normalizeSearchText, toFtsQuery } from "./search.mjs";

const API_PREFIX = "/v1";
const WORK_TYPES = new Set(["poetry", "ci", "qu", "other"]);
const MAX_PAGE_SIZE = 50;
const MAX_QUERY_LENGTH = 64;
const RATE_LIMIT_PER_IP = 60;
const RATE_LIMIT_PERIOD_SECONDS = 60;
const DEBUG_EXAMPLES = [
  {
    section: "健康检查",
    title: "检查 API 是否正常",
    path: "/v1/health",
    displayPath: "/v1/health",
    description: "检查 Worker 和 D1 是否可以正常响应。",
    parameters: []
  },
  {
    section: "数据集",
    title: "查看数据集统计",
    path: "/v1/meta",
    displayPath: "/v1/meta",
    description: "查看作品、作者、类型和朝代统计。",
    parameters: []
  },
  {
    section: "数据集",
    title: "查看朝代列表",
    path: "/v1/dynasties",
    displayPath: "/v1/dynasties",
    description: "获取当前数据中所有朝代。",
    parameters: []
  },
  {
    section: "作品",
    title: "分页查询明代诗",
    path: "/v1/works?type=poetry&dynasty=%E6%98%8E&page_size=2",
    displayPath: "/v1/works?type=poetry&dynasty=明&page_size=2",
    description: "按作品类型和朝代筛选，并使用游标分页。",
    parameters: [
      { name: "type", value: "poetry", description: "作品类型：poetry、ci、qu、other" },
      { name: "dynasty", value: "明", description: "精确匹配朝代" },
      { name: "page_size", value: "2", description: "每页数量，范围 1～50" }
    ]
  },
  {
    section: "作品",
    title: "搜索静夜思",
    path: "/v1/works?q=%E9%9D%99%E5%A4%9C%E6%80%9D&page_size=20",
    displayPath: "/v1/works?q=静夜思&page_size=20",
    description: "按标题或作者进行全文搜索。",
    parameters: [
      { name: "q", value: "静夜思", description: "搜索标题或作者，最长 64 个字符" },
      { name: "page_size", value: "20", description: "每页数量，范围 1～50" }
    ]
  },
  {
    section: "作品",
    title: "按作者查询作品",
    path: "/v1/works?author_id=4cf4377652a89257d1457b72d1457b72",
    displayPath: "/v1/works?author_id=4cf4377652a89257d1457b72d1457b72",
    description: "查询指定作者的作品列表。",
    parameters: [
      { name: "author_id", value: "4cf4377652a89257d1457b72d1457b72", description: "作者 ID，当前示例作者有实际作品" }
    ]
  },
  {
    section: "作品",
    title: "查看作品详情",
    path: "/v1/works/9c41898501e1b55003d67772f7612e48",
    displayPath: "/v1/works/9c41898501e1b55003d67772f7612e48",
    description: "获取一首作品的完整原始字段。",
    parameters: [
      { name: "id", value: "9c41898501e1b55003d67772f7612e48", description: "作品 ID，路径参数" }
    ]
  },
  {
    section: "作品",
    title: "查看作品详情和拼音",
    path: "/v1/works/9c41898501e1b55003d67772f7612e48?include=pinyin",
    displayPath: "/v1/works/9c41898501e1b55003d67772f7612e48?include=pinyin",
    description: "获取作品详情，并请求附加拼音字段。",
    parameters: [
      { name: "id", value: "9c41898501e1b55003d67772f7612e48", description: "作品 ID，路径参数" },
      { name: "include", value: "pinyin", description: "附加返回拼音数据" }
    ]
  },
  {
    section: "作品",
    title: "随机获取作品",
    path: "/v1/works/random",
    displayPath: "/v1/works/random",
    description: "随机返回一首作品。",
    parameters: []
  },
  {
    section: "作品",
    title: "随机获取明诗",
    path: "/v1/works/random?type=poetry&dynasty=%E6%98%8E",
    displayPath: "/v1/works/random?type=poetry&dynasty=明",
    description: "按类型和朝代筛选后随机返回作品。",
    parameters: [
      { name: "type", value: "poetry", description: "作品类型：poetry、ci、qu、other" },
      { name: "dynasty", value: "明", description: "精确匹配朝代" }
    ]
  },
  {
    section: "作者",
    title: "搜索李姓作者",
    path: "/v1/authors?q=%E6%9D%8E&page_size=20",
    displayPath: "/v1/authors?q=李&page_size=20",
    description: "按作者姓名前缀查询作者。",
    parameters: [
      { name: "q", value: "李", description: "作者姓名前缀匹配" },
      { name: "page_size", value: "20", description: "每页数量，范围 1～50" }
    ]
  },
  {
    section: "作者",
    title: "查看作者详情",
    path: "/v1/authors/e647d10f022b315ed1457b72d1457b72",
    displayPath: "/v1/authors/e647d10f022b315ed1457b72d1457b72",
    description: "获取唐文凤的完整信息。",
    parameters: [
      { name: "id", value: "e647d10f022b315ed1457b72d1457b72", description: "作者 ID，路径参数" }
    ]
  },
  {
    section: "作者",
    title: "查看作者作品",
    path: "/v1/authors/e647d10f022b315ed1457b72d1457b72/works?page_size=20",
    displayPath: "/v1/authors/e647d10f022b315ed1457b72d1457b72/works?page_size=20",
    description: "查询唐文凤的作品列表。",
    parameters: [
      { name: "id", value: "e647d10f022b315ed1457b72d1457b72", description: "作者 ID，路径参数" },
      { name: "page_size", value: "20", description: "每页数量，范围 1～50" }
    ]
  },
  {
    section: "作者",
    title: "查询作者作品并继续分页",
    path: "/v1/authors/e647d10f022b315ed1457b72d1457b72/works?type=poetry&cursor=eyJyb3dfaWQiOjY0MDE3fQ",
    displayPath: "/v1/authors/e647d10f022b315ed1457b72d1457b72/works?type=poetry&cursor=eyJyb3dfaWQiOjY0MDE3fQ",
    description: "按作品类型筛选，并使用已验证有效的 cursor 继续查询。",
    parameters: [
      { name: "id", value: "e647d10f022b315ed1457b72d1457b72", description: "作者 ID，路径参数" },
      { name: "type", value: "poetry", description: "作品类型" },
      { name: "cursor", value: "eyJyb3dfaWQiOjY0MDE3fQ", description: "从上一页 meta.next_cursor 获取" }
    ]
  }
];

function corsHeaders(request, env) {
  const requestedOrigin = request.headers.get("Origin");
  const configuredOrigin = env.ALLOWED_ORIGIN || "*";
  const allowOrigin = configuredOrigin === "*"
    ? "*"
    : requestedOrigin === configuredOrigin
      ? configuredOrigin
      : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function response(request, env, data, meta = {}, status = 200, options = {}) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(request, env)
  };
  if (options.cacheSeconds) {
    headers["Cache-Control"] = `public, max-age=0, s-maxage=${options.cacheSeconds}, stale-while-revalidate=300`;
  }
  return new Response(JSON.stringify({ data, meta, error: null }), { status, headers });
}

function errorResponse(request, env, status, code, message, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(request, env),
    ...extraHeaders
  };
  return new Response(JSON.stringify({
    data: null,
    meta: {},
    error: { code, message }
  }), { status, headers });
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function enforceRateLimit(request, env) {
  // Local unit tests and `wrangler dev` without the binding remain usable.
  // Production config declares IP_RATE_LIMITER, so D1 is protected before route handling.
  if (!env.IP_RATE_LIMITER?.limit) return null;

  try {
    const result = await env.IP_RATE_LIMITER.limit({
      key: `poetry-source:ip:${clientIp(request)}`
    });
    if (result.success) return null;
    return errorResponse(
      request,
      env,
      429,
      "RATE_LIMITED",
      `rate limit exceeded: at most ${RATE_LIMIT_PER_IP} requests per ${RATE_LIMIT_PERIOD_SECONDS} seconds per IP`,
      {
        "Cache-Control": "no-store",
        "Retry-After": String(RATE_LIMIT_PERIOD_SECONDS),
        "X-RateLimit-Limit": String(RATE_LIMIT_PER_IP),
        "X-RateLimit-Period": String(RATE_LIMIT_PERIOD_SECONDS)
      }
    );
  } catch (error) {
    console.error("rate limit check failed", error);
    return errorResponse(
      request,
      env,
      503,
      "RATE_LIMIT_UNAVAILABLE",
      "rate limit service unavailable",
      { "Cache-Control": "no-store", "Retry-After": "60" }
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function debugPage(request, env) {
  const examples = DEBUG_EXAMPLES.map((example, index) => `
    <button class="example-item${index === 0 ? " active" : ""}" data-index="${index}" data-path="${escapeHtml(example.path)}" data-display-path="${escapeHtml(example.displayPath)}" type="button">
      <span class="item-heading"><span class="section-label">${escapeHtml(example.section)}</span><span class="item-status" aria-label="请求状态">未请求</span></span>
      <strong>${escapeHtml(example.title)}</strong>
      <code><span>GET</span> ${escapeHtml(example.displayPath)}</code>
    </button>`).join("");

  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    ...corsHeaders(request, env)
  };
  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>poetry-source API 调试台</title>
  <style>
    :root { color-scheme: light; --ink: #20211f; --muted: #77766f; --line: #e7e3d8; --paper: #fbfaf7; --card: #fff; --accent: #b34e36; --accent-dark: #843a29; --ok: #27734a; --bad: #b63d3d; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; overflow: hidden; color: var(--ink); background: radial-gradient(circle at top left, #fff8ea 0, transparent 34rem), var(--paper); font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .shell { width: min(1400px, calc(100% - 20px)); height: 100dvh; margin: 0 auto; padding: 8px 0; display: flex; flex-direction: column; }
    .hero { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 2px 8px; }
    .eyebrow, .section-label { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font: 600 clamp(24px, 3vw, 34px)/1.08 Georgia, "Songti SC", serif; letter-spacing: -.03em; }
    .hero .eyebrow { display: none; }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    button, .plain-link { border: 1px solid var(--accent); border-radius: 999px; padding: 6px 12px; background: var(--accent); color: #fff; cursor: pointer; font: inherit; text-decoration: none; transition: background .18s, transform .18s; }
    button:hover, .plain-link:hover { background: var(--accent-dark); }
    button:active { transform: translateY(1px); }
    button:disabled { cursor: wait; opacity: .6; }
    .secondary { border-color: var(--line); background: transparent; color: var(--ink); }
    .secondary:hover { background: #f2eee5; }
    .counter { color: var(--muted); }
    .debug-layout { min-width: 0; min-height: 0; flex: 1; display: grid; grid-template-columns: clamp(180px, 26vw, 360px) minmax(0, 1fr); gap: 12px; }
    .examples { min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; display: grid; align-content: start; gap: 6px; padding: 1px 3px 1px 0; }
    .example-item { display: block; appearance: none; width: 100%; min-width: 0; min-height: 72px; max-width: 360px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; padding: 9px 11px; background: color-mix(in srgb, var(--card) 92%, transparent); color: var(--ink); box-shadow: 0 3px 10px rgba(84, 65, 35, .04); text-align: left; }
    .example-item:hover { border-color: #d5b5a6; background: #fffaf1; }
    .example-item.active { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(179, 78, 54, .12); }
    .item-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .item-status { color: var(--muted); font-size: 11px; font-weight: 500; }
    .item-status.ok { color: var(--ok); }
    .item-status.error { color: var(--bad); }
    .example-item strong { display: block; min-width: 0; overflow: hidden; margin-top: 2px; font: 600 16px/1.25 Georgia, "Songti SC", serif; text-overflow: ellipsis; white-space: nowrap; }
    .example-item code { display: block; min-width: 0; max-width: 100%; overflow: hidden; margin-top: 4px; color: var(--muted); font: 10px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
    .example-item code span, .request-line span { color: var(--ok); font-weight: 700; }
    .debug-panel { min-width: 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 12px; padding: 14px; background: color-mix(in srgb, var(--card) 94%, transparent); box-shadow: 0 5px 16px rgba(84, 65, 35, .05); }
    .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    h2 { margin: 2px 0 0; font: 600 23px/1.2 Georgia, "Songti SC", serif; }
    .panel-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .parameters { flex: none; margin-top: 10px; border: 1px solid var(--line); border-radius: 8px; background: #fcfaf5; }
    .parameters-title { padding: 6px 9px; border-bottom: 1px solid var(--line); color: var(--accent); font-size: 12px; font-weight: 700; }
    .parameter-list { display: grid; gap: 0; }
    .parameter-row { display: grid; grid-template-columns: 90px minmax(100px, .85fr) minmax(150px, 1.5fr); gap: 8px; align-items: start; padding: 6px 9px; border-bottom: 1px solid #eee9de; font-size: 12px; }
    .parameter-row:last-child { border-bottom: 0; }
    .parameter-name { color: var(--ink); font-weight: 700; }
    .parameter-value { min-width: 0; overflow-wrap: anywhere; color: #366b53; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .parameter-description { min-width: 0; color: var(--muted); }
    .parameter-empty { padding: 7px 9px; color: var(--muted); font-size: 12px; }
    .description { margin: 8px 0 12px; color: var(--muted); }
    .request-line { display: block; max-width: 100%; overflow-x: auto; padding: 9px 11px; border-radius: 7px; background: #f4f1ea; color: #50483e; font: 12px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre; }
    .result { min-height: 0; flex: 1; display: flex; flex-direction: column; margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
    .result-meta { display: flex; gap: 12px; align-items: center; min-height: 24px; color: var(--muted); font-size: 13px; }
    .status.ok { color: var(--ok); font-weight: 700; }
    .status.error { color: var(--bad); font-weight: 700; }
    .response-body { min-width: 0; min-height: 0; flex: 1; overflow: auto; margin: 6px 0 0; padding: 11px; border-radius: 7px; background: #20211f; color: #f5f0e6; font: 11px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
    @media (max-width: 900px) { .panel-heading { display: block; } .panel-actions { justify-content: flex-start; margin-top: 8px; } .parameter-row { grid-template-columns: 72px minmax(0, 1fr); } .parameter-description { grid-column: 2; } }
    @media (max-width: 430px) { body { overflow: auto; } .shell { width: min(100% - 20px, 1120px); height: auto; min-height: 100vh; padding-top: 16px; } .hero { align-items: flex-start; } .debug-layout { flex: none; grid-template-columns: 1fr; } .examples { max-height: 330px; } .debug-panel { min-height: 500px; } .response-body { min-height: 280px; flex: none; } }
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <h1>poetry-source API</h1>
      <div class="toolbar">
        <button id="run-all" type="button">全部调试</button>
        <span class="counter">${DEBUG_EXAMPLES.length} 个接口</span>
      </div>
    </header>
    <div class="debug-layout">
      <nav class="examples" aria-label="接口示例">
        ${examples}
      </nav>
      <section class="debug-panel" aria-label="调试结果">
        <div class="panel-heading">
          <div>
            <div class="eyebrow" id="selected-section">健康检查</div>
            <h2 id="selected-title">检查 API 是否正常</h2>
          </div>
          <div class="panel-actions">
            <button id="run-selected" class="run-button" type="button">调试</button>
            <a id="open-selected" class="plain-link secondary" href="/v1/health" target="_blank" rel="noreferrer">新窗口打开</a>
          </div>
        </div>
        <div class="parameters">
          <div class="parameters-title">参数说明</div>
          <div class="parameter-list" id="selected-parameters"></div>
        </div>
        <p class="description" id="selected-description">检查 Worker 和 D1 是否可以正常响应。</p>
        <code class="request-line"><span>GET</span> <span id="selected-path">/v1/health</span></code>
        <div class="result" aria-live="polite">
          <div class="result-meta"><span class="status" id="selected-status">尚未请求</span><span class="duration" id="selected-duration"></span></div>
          <pre class="response-body" id="selected-response">点击“调试”请求接口</pre>
        </div>
      </section>
    </div>
  </main>
  <script>
    const items = Array.from(document.querySelectorAll('.example-item'));
    const runAllButton = document.getElementById('run-all');
    const selectedSection = document.getElementById('selected-section');
    const selectedTitle = document.getElementById('selected-title');
    const selectedDescription = document.getElementById('selected-description');
    const selectedParameters = document.getElementById('selected-parameters');
    const selectedPath = document.getElementById('selected-path');
    const selectedStatus = document.getElementById('selected-status');
    const selectedDuration = document.getElementById('selected-duration');
    const selectedResponse = document.getElementById('selected-response');
    const runSelectedButton = document.getElementById('run-selected');
    const openSelectedLink = document.getElementById('open-selected');
    let selectedIndex = 0;
    const results = new Map();
    const exampleData = ${JSON.stringify(DEBUG_EXAMPLES)};

    function formatResponse(text) {
      try { return JSON.stringify(JSON.parse(text), null, 2); }
      catch { return text || '(empty response)'; }
    }

    function selectExample(index) {
      selectedIndex = index;
      const item = items[index];
      items.forEach((entry, itemIndex) => entry.classList.toggle('active', itemIndex === index));
      selectedSection.textContent = item.querySelector('.section-label').textContent;
      selectedTitle.textContent = item.querySelector('strong').textContent;
      selectedDescription.textContent = exampleData[index].description;
      const parameters = exampleData[index].parameters || [];
      selectedParameters.innerHTML = parameters.length
        ? parameters.map((parameter) => '<div class="parameter-row"><span class="parameter-name">' + parameter.name + '</span><span class="parameter-value">' + parameter.value + '</span><span class="parameter-description">' + parameter.description + '</span></div>').join('')
        : '<div class="parameter-empty">无参数</div>';
      selectedPath.textContent = item.dataset.displayPath;
      openSelectedLink.href = item.dataset.path;
      const result = results.get(index);
      if (result) {
        selectedStatus.textContent = result.status;
        selectedStatus.className = 'status' + (result.className ? ' ' + result.className : '');
        selectedDuration.textContent = result.duration;
        selectedResponse.textContent = result.body;
      } else {
        selectedStatus.textContent = '尚未请求';
        selectedStatus.className = 'status';
        selectedDuration.textContent = '';
        selectedResponse.textContent = '点击“调试”请求接口';
      }
    }

    async function runExample(index) {
      selectExample(index);
      const item = items[index];
      const startedAt = performance.now();
      runSelectedButton.disabled = true;
      selectedStatus.textContent = '请求中…';
      selectedStatus.className = 'status';
      selectedDuration.textContent = '';
      selectedResponse.textContent = 'Loading…';
      try {
        const response = await fetch(new URL(item.dataset.path, window.location.origin), {
          method: 'GET',
          headers: { Accept: 'application/json' }
        });
        const text = await response.text();
        const elapsed = Math.round(performance.now() - startedAt);
        const result = {
          status: response.ok ? response.status + ' OK' : response.status + ' Error',
          className: response.ok ? 'ok' : 'error',
          duration: elapsed + ' ms',
          body: formatResponse(text)
        };
        results.set(index, result);
        selectedStatus.textContent = result.status;
        selectedStatus.className = 'status ' + result.className;
        selectedDuration.textContent = result.duration;
        selectedResponse.textContent = result.body;
        const itemStatus = item.querySelector('.item-status');
        itemStatus.textContent = result.status;
        itemStatus.className = 'item-status ' + result.className;
        return response.ok;
      } catch (error) {
        const result = {
          status: '请求失败', className: 'error',
          duration: Math.round(performance.now() - startedAt) + ' ms',
          body: error instanceof Error ? error.message : String(error)
        };
        results.set(index, result);
        selectedStatus.textContent = result.status;
        selectedStatus.className = 'status error';
        selectedDuration.textContent = result.duration;
        selectedResponse.textContent = result.body;
        const itemStatus = item.querySelector('.item-status');
        itemStatus.textContent = result.status;
        itemStatus.className = 'item-status error';
        return false;
      } finally {
        runSelectedButton.disabled = false;
      }
    }

    items.forEach((item, index) => item.addEventListener('click', () => selectExample(index)));
    runSelectedButton.addEventListener('click', () => runExample(selectedIndex));

    runAllButton.addEventListener('click', async () => {
      runAllButton.disabled = true;
      runAllButton.textContent = '调试中…';
      for (let index = 0; index < items.length; index += 1) await runExample(index);
      runAllButton.disabled = false;
      runAllButton.textContent = '全部调试';
    });

    selectExample(0);
  </script>
</body>
</html>`, { status: 200, headers });
}

function parsePageSize(url) {
  const value = Number(url.searchParams.get("page_size") || 20);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
    throw new HttpError(400, "INVALID_PAGE_SIZE", `page_size must be between 1 and ${MAX_PAGE_SIZE}`);
  }
  return value;
}

function parseType(value) {
  if (!value) return null;
  if (!WORK_TYPES.has(value)) {
    throw new HttpError(400, "INVALID_TYPE", "type must be poetry, ci, qu, or other");
  }
  return value;
}

function parseCursor(value) {
  if (!value) return null;
  try {
    const decoded = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    const parsed = JSON.parse(decoded);
    if (!Number.isInteger(parsed.row_id) || parsed.row_id < 1) throw new Error("invalid cursor");
    return parsed.row_id;
  } catch {
    throw new HttpError(400, "INVALID_CURSOR", "cursor is invalid");
  }
}

function encodeCursor(rowId) {
  return btoa(JSON.stringify({ row_id: rowId }))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function parseQuery(url) {
  const value = url.searchParams.get("q")?.trim() || "";
  if (value.length > MAX_QUERY_LENGTH) {
    throw new HttpError(400, "QUERY_TOO_LONG", `q must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  return value;
}

function summaryFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    authorName: row.author_name,
    authorId: row.author_id,
    dynasty: row.dynasty,
    content: JSON.parse(row.content_json || "[]")
  };
}

function detailFromRow(row, includePinyin) {
  let payload;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    throw new HttpError(500, "CORRUPT_PAYLOAD", "stored payload is not valid JSON");
  }

  const data = {
    ...payload,
    type: row.type,
    sourceFile: row.source_file
  };
  if (includePinyin && row.pinyin_json) {
    data.pinyin = JSON.parse(row.pinyin_json);
  }
  return data;
}

function parseDatasetMetaValue(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isDatasetSummary(value) {
  return Boolean(
    value &&
    Number.isInteger(value.works) &&
    Number.isInteger(value.authors) &&
    Array.isArray(value.by_type) &&
    Array.isArray(value.by_dynasty) &&
    Array.isArray(value.dynasties)
  );
}

function requireDatasetSummary(datasetMeta) {
  if (!isDatasetSummary(datasetMeta.summary)) {
    throw new HttpError(
      503,
      "DATASET_META_UNAVAILABLE",
      "precomputed dataset summary is unavailable"
    );
  }
  return datasetMeta.summary;
}

async function readDatasetMeta(env) {
  const result = await env.DB.prepare(
    "SELECT key, value FROM dataset_meta WHERE key IN ('summary', 'manifest')"
  ).all();
  const values = new Map((result.results || []).map((row) => [row.key, row.value]));
  return {
    summary: parseDatasetMetaValue(values.get("summary")),
    manifest: parseDatasetMetaValue(values.get("manifest"))
  };
}

function workWhere(url, { includeCursor = true } = {}) {
  const conditions = ["1 = 1"];
  const bindings = [];
  const type = parseType(url.searchParams.get("type"));
  const dynasty = url.searchParams.get("dynasty")?.trim();
  const authorId = url.searchParams.get("author_id")?.trim();
  const q = parseQuery(url);

  if (type) {
    conditions.push("w.type = ?");
    bindings.push(type);
  }
  if (dynasty) {
    if (dynasty.length > 32) throw new HttpError(400, "INVALID_DYNASTY", "dynasty is too long");
    conditions.push("w.dynasty = ?");
    bindings.push(dynasty);
  }
  if (authorId) {
    if (authorId.length > 128) throw new HttpError(400, "INVALID_AUTHOR_ID", "author_id is too long");
    conditions.push("w.author_id = ?");
    bindings.push(authorId);
  }
  if (q) {
    const ftsQuery = toFtsQuery(q);
    if (ftsQuery) {
      if (Array.from(normalizeSearchText(q)).length < 2) {
        throw new HttpError(
          400,
          "QUERY_TOO_SHORT",
          "q must contain at least 2 characters for full-text search"
        );
      }
      conditions.push("w.row_id IN (SELECT rowid FROM works_fts WHERE works_fts MATCH ?)");
      bindings.push(ftsQuery);
    }
  }
  if (includeCursor) {
    const cursor = parseCursor(url.searchParams.get("cursor"));
    if (cursor !== null) {
      conditions.push("w.row_id > ?");
      bindings.push(cursor);
    }
  }

  return { conditions, bindings };
}

async function listWorks(request, env, url, extra = {}) {
  const pageSize = parsePageSize(url);
  const { conditions, bindings } = workWhere(url);
  if (extra.authorId) {
    conditions.push("w.author_id = ?");
    bindings.push(extra.authorId);
  }

  const result = await env.DB.prepare(`
    SELECT w.row_id, w.id, w.type, w.title, w.author_id, w.author_name,
           w.dynasty, w.content_json
    FROM works w
    WHERE ${conditions.join(" AND ")}
    ORDER BY w.row_id
    LIMIT ?
  `).bind(...bindings, pageSize + 1).all();

  const rows = result.results || [];
  const hasMore = rows.length > pageSize;
  const visibleRows = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursor = hasMore ? encodeCursor(visibleRows.at(-1).row_id) : null;
  return response(request, env, visibleRows.map(summaryFromRow), {
    page_size: pageSize,
    next_cursor: nextCursor,
    count: visibleRows.length
  }, 200, { cacheSeconds: 60 });
}

async function getWork(request, env, id, url) {
  const row = await env.DB.prepare(`
    SELECT row_id, id, type, source_file, payload_json, pinyin_json
    FROM works
    WHERE id = ?
    LIMIT 1
  `).bind(id).first();
  if (!row) return errorResponse(request, env, 404, "NOT_FOUND", "work not found");

  const include = url.searchParams.get("include") || "";
  return response(request, env, detailFromRow(row, include.split(",").includes("pinyin")), {}, 200, {
    cacheSeconds: 3600
  });
}

async function getRandomWork(request, env, url) {
  const { conditions, bindings } = workWhere(url, { includeCursor: false });
  const randomKey = Math.floor(Math.random() * 2147483647);
  const select = `
    SELECT row_id, id, type, source_file, payload_json, pinyin_json
    FROM works w
    WHERE ${conditions.join(" AND ")} AND w.random_key >= ?
    ORDER BY w.random_key
    LIMIT 1
  `;
  let row = await env.DB.prepare(select).bind(...bindings, randomKey).first();
  if (!row) {
    row = await env.DB.prepare(`
      SELECT row_id, id, type, source_file, payload_json, pinyin_json
      FROM works w
      WHERE ${conditions.join(" AND ")} AND w.random_key < ?
      ORDER BY w.random_key
      LIMIT 1
    `).bind(...bindings, randomKey).first();
  }
  if (!row) return errorResponse(request, env, 404, "NOT_FOUND", "no matching work");
  return response(request, env, detailFromRow(row, false), {}, 200, { cacheSeconds: 30 });
}

async function listAuthors(request, env, url) {
  const pageSize = parsePageSize(url);
  const query = parseQuery(url);
  const bindings = [];
  const conditions = ["1 = 1"];
  if (query) {
    conditions.push("name LIKE ?");
    bindings.push(`${query}%`);
  }
  const cursor = parseCursor(url.searchParams.get("cursor"));
  if (cursor) {
    conditions.push("rowid > ?");
    bindings.push(cursor);
  }
  const result = await env.DB.prepare(`
    SELECT rowid, id, name, dynasty, birth_year, death_year
    FROM authors
    WHERE ${conditions.join(" AND ")}
    ORDER BY rowid
    LIMIT ?
  `).bind(...bindings, pageSize + 1).all();
  const rows = result.results || [];
  const hasMore = rows.length > pageSize;
  const visibleRows = hasMore ? rows.slice(0, pageSize) : rows;
  return response(request, env, visibleRows.map((row) => ({
    id: row.id,
    name: row.name,
    dynasty: row.dynasty,
    birthYear: row.birth_year,
    deathYear: row.death_year
  })), {
    page_size: pageSize,
    next_cursor: hasMore ? encodeCursor(visibleRows.at(-1).rowid) : null,
    count: visibleRows.length
  }, 200, { cacheSeconds: 300 });
}

async function getAuthor(request, env, id) {
  const row = await env.DB.prepare(`
    SELECT id, name, dynasty, birth_year, death_year, description, payload_json
    FROM authors
    WHERE id = ?
    LIMIT 1
  `).bind(id).first();
  if (!row) return errorResponse(request, env, 404, "NOT_FOUND", "author not found");

  let payload = {};
  try {
    payload = JSON.parse(row.payload_json || "{}");
  } catch {
    throw new HttpError(500, "CORRUPT_PAYLOAD", "stored author payload is not valid JSON");
  }
  return response(request, env, {
    ...payload,
    id: row.id,
    name: row.name,
    dynasty: row.dynasty,
    birthYear: row.birth_year,
    deathYear: row.death_year,
    desc: row.description
  }, {}, 200, { cacheSeconds: 3600 });
}

async function getMeta(request, env) {
  const datasetMeta = await readDatasetMeta(env);
  const summary = requireDatasetSummary(datasetMeta);
  return response(request, env, {
    works: summary.works,
    authors: summary.authors,
    by_type: summary.by_type,
    by_dynasty: summary.by_dynasty,
    manifest: datasetMeta.manifest
  }, {}, 200, { cacheSeconds: 3600 });
}

async function getDynasties(request, env) {
  const datasetMeta = await readDatasetMeta(env);
  const summary = requireDatasetSummary(datasetMeta);
  return response(request, env, summary.dynasties, {}, 200, {
    cacheSeconds: 3600
  });
}

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function route(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/") return debugPage(request, env);
  if (url.pathname === `${API_PREFIX}/health`) {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return response(request, env, { status: "ok" }, {}, 200, { cacheSeconds: 30 });
  }
  if (url.pathname === `${API_PREFIX}/meta`) return getMeta(request, env);
  if (url.pathname === `${API_PREFIX}/dynasties`) return getDynasties(request, env);
  if (url.pathname === `${API_PREFIX}/works/random`) return getRandomWork(request, env, url);
  if (url.pathname === `${API_PREFIX}/works`) return listWorks(request, env, url);
  if (url.pathname === `${API_PREFIX}/authors`) return listAuthors(request, env, url);

  const match = url.pathname.match(/^\/v1\/(works|authors)\/([^/]+)(?:\/works)?$/);
  if (!match) return errorResponse(request, env, 404, "NOT_FOUND", "route not found");

  const [, resource, rawId] = match;
  const id = decodeURIComponent(rawId);
  if (resource === "works") return getWork(request, env, id, url);
  if (url.pathname.endsWith("/works")) {
    return listWorks(request, env, url, { authorId: id });
  }
  return getAuthor(request, env, id);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method !== "GET") {
      return errorResponse(request, env, 405, "METHOD_NOT_ALLOWED", "only GET is supported");
    }

    try {
      const rateLimitResponse = await enforceRateLimit(request, env);
      if (rateLimitResponse) return rateLimitResponse;
      return await route(request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return errorResponse(request, env, error.status, error.code, error.message);
      }
      console.error(error);
      return errorResponse(request, env, 500, "INTERNAL_ERROR", "internal server error");
    }
  }
};
