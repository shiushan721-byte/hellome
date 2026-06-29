/**
 * 将构建产物上传到阿里云 OSS
 *
 * 用法（在 Jenkins shell 中）：
 *   node scripts/upload-to-oss.cjs --env sit
 *   node scripts/upload-to-oss.cjs --env prod
 *
 * 需要在 Jenkins 中配置的环境变量（仅 AK/SK，安全敏感不写入代码）：
 *   OSS_ACCESS_KEY_ID     - 阿里云 AccessKey ID
 *   OSS_ACCESS_KEY_SECRET - 阿里云 AccessKey Secret
 */

const China_OSS = require('ali-oss');
const path = require('node:path');
const fs = require('node:fs');

// ============================================================
// 配置区：在这里修改你的 OSS 信息
// ============================================================

const OSS_CONFIG = {
  // OSS Region
  region: 'oss-cn-hangzhou',
  // OSS Bucket 名称
  bucket: 'huizhihuyuzhineng',

  // 不同环境的上传路径前缀和对应的 CDN 地址
  envMap: {
    sit: {
      prefix: 'huizhiApiPlatformSit/dist',
      cdnUrl: 'https://static.file.huizhihuyu.com/huizhiApiPlatformSit/dist/',
    },
    prod: {
      prefix: 'huizhiApiPlatform/dist',
      cdnUrl: 'https://static.file.huizhihuyu.com/huizhiApiPlatform/dist/',
    },
  },
};

// ============================================================
// 以下是脚本逻辑，一般不需要修改
// ============================================================

const DIST_DIR = path.resolve(__dirname, '../dist');

function parseArgs() {
  const args = process.argv.slice(2);
  let env = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      env = args[i + 1];
    }
  }
  return { env };
}

const { env } = parseArgs();

if (!env || !OSS_CONFIG.envMap[env]) {
  console.error(`[ERROR] 请指定有效的环境参数: --env sit 或 --env prod`);
  console.error(`[ERROR] 可用环境: ${Object.keys(OSS_CONFIG.envMap).join(', ')}`);
  process.exit(1);
}

if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
  console.error('[ERROR] 缺少环境变量 OSS_ACCESS_KEY_ID 或 OSS_ACCESS_KEY_SECRET');
  console.error('[ERROR] 请在 Jenkins 的环境变量中配置阿里云 AccessKey');
  process.exit(1);
}

const envConfig = OSS_CONFIG.envMap[env];
const ossPrefix = envConfig.prefix.replace(/\/+$/, '');

const client = new China_OSS({
  region: OSS_CONFIG.region,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: OSS_CONFIG.bucket,
  timeout: 120000,
});

const MIME_MAP = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function getCacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // HTML 不缓存，每次请求最新版本
  if (ext === '.html') {
    return 'no-cache';
  }
  // 带 hash 的静态资源长期缓存
  if (/\.[a-f0-9]{6,}\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/.test(filePath)) {
    return 'public, max-age=31536000, immutable';
  }
  // 其他资源缓存 1 天
  return 'public, max-age=86400';
}

function collectFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

// 排除不需要上传的文件
const EXCLUDE_PATTERNS = [
  /index\.html$/,
  /\.map$/,
];

function shouldUpload(relativePath) {
  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(relativePath));
}

async function upload() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[ERROR] 构建目录不存在: ${DIST_DIR}`);
    console.error('[ERROR] 请先执行 pnpm build:sit 或 pnpm build:prod');
    process.exit(1);
  }

  const files = collectFiles(DIST_DIR);
  const uploadFiles = files.filter((f) => {
    const rel = path.relative(DIST_DIR, f);
    return shouldUpload(rel);
  });

  console.log('========================================');
  console.log(`  环境:     ${env}`);
  console.log(`  Bucket:   ${OSS_CONFIG.bucket}`);
  console.log(`  Region:   ${OSS_CONFIG.region}`);
  console.log(`  前缀:     ${ossPrefix}`);
  console.log(`  CDN 地址: ${envConfig.cdnUrl}`);
  console.log(`  文件数:   ${uploadFiles.length}`);
  console.log('========================================\n');

  let successCount = 0;
  let failCount = 0;
  const concurrency = 10;

  for (let i = 0; i < uploadFiles.length; i += concurrency) {
    const batch = uploadFiles.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (filePath) => {
        const relativePath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
        const ossPath = `${ossPrefix}/${relativePath}`;
        const mime = getMimeType(filePath);
        const cacheControl = getCacheControl(relativePath);

        await client.put(ossPath, filePath, {
          headers: {
            'Content-Type': mime,
            'Cache-Control': cacheControl,
          },
        });
        return relativePath;
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`  ✓ ${result.value}`);
      } else {
        failCount++;
        console.error(`  ✗ FAILED: ${result.reason?.message || result.reason}`);
      }
    }
  }

  console.log(`\n[RESULT] 上传完成: ${successCount} 成功, ${failCount} 失败`);

  if (failCount > 0) {
    process.exit(1);
  }
}

upload().catch((err) => {
  console.error('[ERROR] 上传失败:', err.message);
  process.exit(1);
});
