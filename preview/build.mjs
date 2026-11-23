import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import QRCode from 'qrcode';
import yauzl from 'yauzl';
import '../public/watchface-project.js';

const require = createRequire(import.meta.url);
const models = new Map([
  ['t-rex-3-pro-44mm', { size: 466, ids: [10682624, 10682625, 10682627] }],
  ['t-rex-3-pro-48mm', { size: 480, ids: [10551552, 10551553, 10551555] }],
]);
const { profiles, buildWatchfaceIndexJs } = globalThis.WatchmakerProject;
const personalModels = new Map(Object.values(profiles).filter(dev => !dev.photoOnly).map(dev => [dev.targetKey, dev]));
const assetPath = /^assets\/([a-z0-9-]{1,40})\/[\w-]{1,40}\.png$/;
const sources = new Set(['app.json', 'watchface/index.js']);
const widgetIds = new Set(['digital', 'analog', 'date', 'weekWeather', 'weather', 'sunTimes', 'steps', 'heart', 'vo2max', 'battery', 'bt']);

function unzipProject(bytes, targetDirectory, personal) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(bytes, { lazyEntries: true, strictFileNames: true }, (error, zip) => {
      if (error) return reject(error);
      const seen = new Set();
      let uncompressed = 0;
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', entry => {
        const name = entry.fileName;
        const target = assetPath.exec(name)?.[1];
        const valid = personal ? name === 'design.json' || personalModels.has(target)
          : sources.has(name) || models.has(target);
        if (!valid) {
          zip.readEntry();
          return;
        }
        uncompressed += entry.uncompressedSize;
        if (seen.has(name) || seen.size >= 85 || uncompressed > 12 * 1024 * 1024
          || (name === 'design.json' && entry.uncompressedSize > 8192)) {
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

function qualifiedNumber(value, minimum, maximum, fallback) {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

async function preparePersonalConfig(directory) {
  const design = JSON.parse(await readFile(join(directory, 'design.json'), 'utf8'));
  const model = personalModels.get(design.target);
  if (design.version !== 1 || !model || !Array.isArray(design.widgets) || design.widgets.length > widgetIds.size) {
    throw new Error('Invalid watchface design');
  }
  const widgets = new Map();
  for (const value of design.widgets) {
    if (!widgetIds.has(value?.id) || widgets.has(value.id)) throw new Error('Invalid watchface widget');
    widgets.set(value.id, {
      id: value.id, visible: value.visible === true,
      x: qualifiedNumber(value.x, 0, 480, 240), y: qualifiedNumber(value.y, 0, 480, 240),
      scale: qualifiedNumber(value.scale, 0.1, 4, 1),
      color: typeof value.color === 'string' && /^#[0-9a-f]{6}$/i.test(value.color) ? value.color : '#ffffff',
    });
  }
  const date = design.dateOpt || {};
  const state = {
    widgets: [...widgets.values()], showSeconds: design.showSeconds === true,
    dateOpt: {
      style: ['dot_kr', 'full_kr', 'en_iso', 'two_line'].includes(date.style) ? date.style : 'dot_kr',
      boxStyle: date.boxStyle === 'pill' ? 'pill' : 'plain',
      fontSize: qualifiedNumber(date.fontSize, 8, 48, 16),
      showWeekday: date.showWeekday === true, showYear: date.showYear === true, weekendColor: date.weekendColor === true,
    },
  };
  const assets = join(directory, 'assets', model.targetKey);
  const required = new Set(['preview.png', 'background.png', 'aod-background.png']);
  for (const name of await readdir(assets)) {
    const image = await readFile(join(assets, name));
    if (image.length < 33 || !image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      || image.subarray(12, 16).toString() !== 'IHDR') throw new Error('Invalid image');
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    if (!width || !height || width > 720 || height > 720
      || (required.has(name) && (width !== model.designWidth || height !== (model.designHeight ?? model.designWidth)))) {
      throw new Error('Invalid image size');
    }
    required.delete(name);
  }
  if (required.size) throw new Error('Missing screen images');
  const appId = 1090000 + Math.floor(Math.random() * 90000);
  const appName = String(design.name || '').replace(/[^\p{L}\p{N} _.()-]/gu, '').trim().slice(0, 48) || 'MyWatchface';
  const config = {
    configVersion: 'v3',
    app: {
      appId, appName, appType: 'watchface',
      version: { code: 1, name: '1.0.0' },
      icon: 'preview.png', vender: 'Watchmaker', description: appName,
    },
    permissions: ['data:user.hd.heart_rate', 'data:user.hd.step', 'data:user.hd.calorie'],
    runtime: { apiVersion: { compatible: '2.0.0', target: '2.0.0', minVersion: '2.0.0' } },
    targets: {
      [model.targetKey]: {
        module: { watchface: { path: 'watchface/index', main: 1, editable: 0, lockscreen: 1 } },
        platforms: model.platforms, designWidth: model.designWidth,
      },
    },
    i18n: { 'en-US': { appName } },
    defaultLanguage: 'en-US',
  };
  await mkdir(join(directory, 'watchface'));
  await writeFile(join(directory, 'app.json'), JSON.stringify(config));
  await writeFile(join(directory, 'app.js'), 'App({ onCreate() {}, onDestroy() {} });\n');
  await writeFile(join(directory, 'watchface', 'index.js'), buildWatchfaceIndexJs(model, state));
}

function buildEnvironment() {
  const environment = { ...process.env, NO_COLOR: '1', CI: '1' };
  delete environment.WATCHMAKER_RUNNER_KEY;
  delete environment.WATCHMAKER_ZEUS_SESSION;
  return environment;
}

async function compileInstallPackage(directory) {
  const cli = require.resolve('@zeppos/zeus-cli/bin/main.js');
  const preloader = fileURLToPath(new URL('./build-preview-package.cjs', import.meta.url));
  try {
    await promisify(execFile)(process.execPath, ['--require', preloader, cli, 'build'], {
      cwd: directory, env: buildEnvironment(), timeout: 140000, maxBuffer: 256 * 1024,
    });
  } catch {
    throw new Error('Zeus failed to compile the personal watchface');
  }
  const dist = join(directory, 'dist');
  const files = (await readdir(dist)).filter(name => name.endsWith('.zab'));
  if (files.length !== 1) throw new Error('Zeus did not create an install package');
  return readFile(join(dist, files[0]));
}

async function compilePreview(directory, target) {
  const cli = require.resolve('@zeppos/zeus-cli/bin/main.js');
  const preloader = fileURLToPath(new URL('./capture-zeus-qr.cjs', import.meta.url));
  const qrPath = join(directory, 'preview-qr.txt');
  const size = target.includes('44mm') ? '44mm' : '48mm';
  const device = 'Amazfit T-Rex 3 Pro (' + size + ')';
  const environment = { ...buildEnvironment(), WATCHMAKER_QR_PATH: qrPath };
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
    if (response.ok) return {
      bytes: Buffer.from(await response.arrayBuffer()),
      personal: response.headers.get('X-Watchmaker-Mode') === 'personal',
    };
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
    const project = await getProject(endpoint, headers);
    await unzipProject(project.bytes, directory, project.personal);
    if (project.personal) {
      await preparePersonalConfig(directory);
      const packageBytes = await compileInstallPackage(directory);
      const response = await fetch(endpoint, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/zip' },
        body: packageBytes, signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) throw new Error('Install package upload returned ' + response.status);
      return;
    }
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
