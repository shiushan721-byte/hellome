/**
 * 运行 react-snap 预渲染（被 `build` 的 postbuild 钩子与 `build:prod` 串联调用）。
 *
 * 解决三个历史问题：
 *   1) build:prod 不会触发 npm 的 postbuild 钩子 —— build:prod 现在显式调用本脚本。
 *   2) 构建产物的资源前缀（assetPrefix）是 CDN 绝对地址，无头浏览器从本地 dist
 *      预渲染时无法加载 CDN 上还不存在的新文件，导致：
 *        - HTML 里静态引用的入口 JS 加载失败；
 *        - 更关键：JS runtime 动态加载的异步 chunk 也走 CDN → ChunkLoadError → 空壳。
 *      本脚本在预渲染前把【HTML 和 JS 文件里】的 CDN 前缀都临时改成相对路径（让
 *      puppeteer 从本地 dist 加载入口 JS 与异步 chunk），渲染完成后：
 *        - JS 文件用预处理前的原始内容精确还原（回到 CDN assetPrefix，线上使用）；
 *        - HTML 里的 /static/ 还原成 CDN 绝对地址（线上 HTML 在 nginx、JS 在 CDN）。
 *   3) 预渲染只是 GEO 增强项：失败时降级为普通 SPA、exit 0，绝不阻断构建/部署，
 *      且无论成败都把资源路径还原回 CDN，避免残留相对路径导致线上白屏。
 */
const { spawnSync } = require('child_process');
const { existsSync, readdirSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const pkgPath = path.join(root, 'package.json');
// 原始文本：跑完用它精确还原 package.json，避免临时配置/行尾（CRLF→LF）残留在工作区。
const pkgText = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgText);

// ---------- 1. 定位 Chrome / Chromium（含 Windows、Edge 回退）----------
function findBundledChrome() {
  try {
    const puppeteerRoot = path.dirname(require.resolve('puppeteer/package.json'));
    for (const base of [
      path.join(puppeteerRoot, '.local-chromium'),
      path.join(puppeteerRoot, '.cache'),
    ]) {
      if (!existsSync(base)) continue;
      for (const dir of readdirSync(base)) {
        const guesses = [
          path.join(base, dir, 'chrome-win', 'chrome.exe'),
          path.join(base, dir, 'chrome-win64', 'chrome.exe'),
          path.join(base, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
          path.join(base, dir, 'chrome-linux', 'chrome'),
        ];
        const hit = guesses.find((g) => existsSync(g));
        if (hit) return hit;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const localAppData = process.env.LOCALAPPDATA;
const candidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  // Windows - Chrome
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
  // Windows - Edge（回退）
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // Linux
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  findBundledChrome(),
].filter(Boolean);

const executablePath = candidates.find((candidate) => existsSync(candidate));

// ---------- 2. 工具函数 ----------
function detectCdnPrefix() {
  const indexPath = path.join(distDir, 'index.html');
  if (!existsSync(indexPath)) return null;
  const html = readFileSync(indexPath, 'utf8');
  const match = html.match(/(?:src|href)="(https?:\/\/[^"]+?\/)static\//);
  return match ? match[1] : null;
}

function collectFiles(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, exts));
    else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function replaceAllInFile(file, from, to) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(from)) return false;
  writeFileSync(file, content.split(from).join(to));
  return true;
}

if (!existsSync(distDir)) {
  console.error('[react-snap] dist 目录不存在，请先执行构建');
  process.exit(1);
}

const cdnPrefix = detectCdnPrefix();

// ---------- 3. 预处理：CDN 绝对路径 → 本地相对路径（HTML + JS）----------
// JS 也要处理：异步 chunk 的 base URL（assetPrefix）编译在 JS runtime 里，只改 HTML
// 不够。备份被改的 JS 原始内容，预渲染后精确还原——绝不能反向替换 `/`（会误伤海量斜杠）。
const jsBackups = new Map();
if (cdnPrefix) {
  console.log(`[react-snap] 探测到 CDN 前缀 ${cdnPrefix}，预渲染期间临时改为相对路径（含 JS 内的 assetPrefix）`);
  for (const f of collectFiles(distDir, ['.html'])) {
    replaceAllInFile(f, cdnPrefix, '/');
  }
  for (const f of collectFiles(distDir, ['.js'])) {
    const content = readFileSync(f, 'utf8');
    if (content.includes(cdnPrefix)) {
      jsBackups.set(f, content);
      writeFileSync(f, content.split(cdnPrefix).join('/'));
    }
  }
  console.log(`[react-snap] 预处理完成：JS 命中 ${jsBackups.size} 个`);
} else {
  console.log('[react-snap] 未探测到 CDN 前缀，按相对路径直接预渲染');
}

// ---------- 4. 运行 react-snap ----------
if (executablePath) {
  console.log(`[react-snap] 使用浏览器: ${executablePath}`);
  pkg.reactSnap = { ...pkg.reactSnap, puppeteerExecutablePath: executablePath };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
} else {
  console.warn('[react-snap] 未找到本地 Chrome/Edge，交给 react-snap 自行查找');
}

const result = spawnSync('react-snap', { stdio: 'inherit', shell: true, cwd: root });

// 用原始文本精确还原 package.json（移除临时 puppeteerExecutablePath，且不改动行尾/格式）
writeFileSync(pkgPath, pkgText);

// ---------- 5. 后处理 ----------
// 5a. JS 用备份精确还原（回到 CDN assetPrefix —— 线上浏览器加载异步 chunk 时要走 CDN）。
for (const [file, original] of jsBackups) {
  writeFileSync(file, original);
}
if (jsBackups.size) {
  console.log(`[react-snap] 已还原 ${jsBackups.size} 个 JS 的 CDN assetPrefix`);
}

// 5b. HTML 的相对 /static/ → CDN 绝对地址。无论预渲染成败都执行：失败时若残留相对
//     路径，而线上 HTML 在 nginx、JS 在 CDN，会 404 → 整站白屏，所以与成败解耦。
if (cdnPrefix) {
  const cdnStatic = `${cdnPrefix}static/`;
  for (const f of collectFiles(distDir, ['.html'])) {
    let c = readFileSync(f, 'utf8');
    c = c.split('"/static/').join(`"${cdnStatic}`);
    c = c.split("'/static/").join(`'${cdnStatic}`);
    writeFileSync(f, c);
  }
  console.log(`[react-snap] 已把 HTML 中的 /static/ 还原为 ${cdnStatic}`);
}

if (result.status !== 0 && result.status != null) {
  // 预渲染只是 GEO 增强项，失败时降级为普通 SPA，绝不阻断构建与部署。
  console.warn('[react-snap] 预渲染未成功，已降级为普通 SPA（不阻断构建）。请检查上方日志与浏览器环境。');
}
process.exit(0);
