import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import QRCode from 'qrcode';
import yauzl from 'yauzl';

const require = createRequire(import.meta.url);
const models = new Map([
  ['t-rex-3-pro-44mm', { size: 466, ids: [10682624, 10682625, 10682627] }],
  ['t-rex-3-pro-48mm', { size: 480, ids: [10551552, 10551553, 10551555] }],
]);
const assetPath = /^assets\/(t-rex-3-pro-(?:44|48)mm)\/[\w-]{1,40}\.png$/;
const sources = new Set(['app.json', 'watchface/index.js']);

function unzipProject(bytes, targetDirectory) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(bytes, { lazyEntries: true, strictFileNames: true }, (error, zip) => {
      if (error) return reject(error);
      const seen = new Set();
      let uncompressed = 0;
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', entry => {
        const name = entry.fileName;
        if (!sources.has(name) && !assetPath.test(name)) {
          zip.readEntry();
          return;
        }
        uncompressed += entry.uncompressedSize;
        if (seen.has(name) || seen.size >= 85 || uncompressed > 12 * 1024 * 1024) {
          zip.close();
          reject(new Error('Invalid files in the watchface project'));
          return;
        }
        seen.add(name);
        const path = join(targetDirectory, name);
        mkdir(dirname(path), { recursive: true }).then(() => {
          zip.openReadStream(entry, (streamError, stream) => {
            if (streamError) return reject(streamError);
            pipeline(stream, createWriteStream(path, { flags: 'wx' }))
              .then(() => zip.readEntry(), reject);
          });
        }, reject);
      });
      if (zip.entryCount > 150) {
        zip.close();
        reject(new Error('Too many files in the watchface project'));
      } else {
        zip.readEntry();
      }
    });
  });
}

async function prepareConfig(directory) {
  const path = join(directory, 'app.json');
  const submitted = JSON.parse(await readFile(path, 'utf8'));
  const [target, ...rest] = Object.keys(submitted.targets || {});
  const model = models.get(target);
  if (rest.length || !model || submitted.app?.appType !== 'watchface') {
    throw new Error('Select a supported T-Rex 3 Pro model');
  }
  const appId = submitted.app.appId;
  if (!Number.isSafeInteger(appId) || appId < 1090000 || appId >= 1180000) {
    throw new Error('Invalid watchface app ID');
  }
  const appName = String(submitted.app.appName || 'MyWatchface').slice(0, 64);
  const config = {
    configVersion: 'v3',
    app: {
      appId, appName, appType: 'watchface',
      version: { code: 1, name: '1.0.0' },
      icon: 'preview.png', vender: 'Watchmaker', description: appName,
    },
    permissions: ['data:user.hd.heart_rate', 'data:user.hd.step'],
    runtime: { apiVersion: { compatible: '2.0.0', target: '2.0.0', minVersion: '2.0.0' } },
    targets: {
      [target]: {
        module: { watchface: { path: 'watchface/index', main: 1, editable: 0, lockscreen: 1 } },
        platforms: model.ids.map(deviceSource => ({ deviceSource })),
        designWidth: model.size,
      },
    },
    i18n: { 'en-US': { appName } },
    defaultLanguage: 'en-US',
  };
  await writeFile(path, JSON.stringify(config));
  await writeFile(join(directory, 'app.js'), 'App({ onCreate() {}, onDestroy() {} });\n');
  await readFile(join(directory, 'watchface', 'index.js'));
  return target;
}

async function compilePreview(directory, target) {
  const cli = require.resolve('@zeppos/zeus-cli/bin/main.js');
  const preloader = fileURLToPath(new URL('./capture-zeus-qr.cjs', import.meta.url));
  const qrPath = join(directory, 'preview-qr.txt');
  const size = target.includes('44mm') ? '44mm' : '48mm';
  const device = 'Amazfit T-Rex 3 Pro (' + size + ')';
  const environment = { ...process.env, NO_COLOR: '1', CI: '1', WATCHMAKER_QR_PATH: qrPath };
  delete environment.WATCHMAKER_RUNNER_KEY;
  delete environment.WATCHMAKER_ZEUS_SESSION;
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, ['--require', preloader, cli, 'preview', '--target', device], {
      cwd: directory, env: environment, timeout: 140000, maxBuffer: 256 * 1024,
    });
    try {
      return await readFile(qrPath, 'utf8');
    } catch (cause) {
      if (/ETIMEDOUT|ECONNRESET|ENOTFOUND/i.test(stdout + stderr)) {
        throw new Error('Zepp preview service was unreachable');
      }
      throw cause;
    }
  } catch (cause) {
    const reason = cause.code || cause.message;
    throw new Error('Zeus could not issue a preview QR (' + reason + '). Check the CLI login session and network.');
  }
}

async function getProject(endpoint, headers) {
  // A newly written KV value can take time to appear at the runner's edge location.
  for (let attempt = 0; attempt < 14; attempt++) {
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(12000) });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (response.status !== 404) throw new Error('Project download returned ' + response.status);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Project did not arrive before the build deadline');
}

async function publish(jobId, siteUrl, runnerKey) {
  if (!/^[0-9a-f]{32}$/.test(jobId) || !runnerKey) throw new Error('Missing job ID or runner key');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/') {
    throw new Error('WATCHMAKER_URL must be the HTTPS origin of the Worker');
  }
  const endpoint = new URL('/api/watchface-preview/runner/' + jobId, site);
  const headers = { Authorization: 'Bearer ' + runnerKey };
  const directory = await mkdtemp(join(tmpdir(), 'watchface-'));
  try {
    await unzipProject(await getProject(endpoint, headers), directory);
    const target = await prepareConfig(directory);
    const session = process.env.WATCHMAKER_ZEUS_SESSION;
    if (!session) throw new Error('WATCHMAKER_ZEUS_SESSION is missing');
    const zeppDir = join(homedir(), '.zepp');
    await mkdir(zeppDir, { recursive: true, mode: 0o700 });
    await writeFile(join(zeppDir, '.zeus'), Buffer.from(session, 'base64'), { mode: 0o600 });
    const payload = await compilePreview(directory, target);
    const qr = await QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', scale: 9, margin: 4 });
    const response = await fetch(endpoint, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'image/png' },
      body: qr, signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error('Preview upload returned ' + response.status);
  } catch (error) {
    await fetch(endpoint, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'failed' }), signal: AbortSignal.timeout(10000),
    }).catch(() => {});
    throw error;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

await publish(process.env.WATCHMAKER_JOB_ID, process.env.WATCHMAKER_URL, process.env.WATCHMAKER_RUNNER_KEY);
