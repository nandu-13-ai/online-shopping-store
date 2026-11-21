/**
 * Docker Auto-Manager for NammaStore
 * Automatically detects, launches, and runs `docker compose up -d`
 * when `npm run dev` or `server.js` is started.
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

const PROJECT_DIR = path.join(__dirname, '..');

async function isDockerDaemonRunning() {
  try {
    await execAsync('docker info', { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

function findDockerDesktopExecutable() {
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    'C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function launchDockerDesktop() {
  const exePath = findDockerDesktopExecutable();
  if (!exePath) return false;

  try {
    const child = spawn(exePath, [], { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch (err) {
    console.warn('Could not launch Docker Desktop automatically:', err.message);
    return false;
  }
}

async function waitForDocker(timeoutSec = 25) {
  const start = Date.now();
  while (Date.now() - start < timeoutSec * 1000) {
    if (await isDockerDaemonRunning()) return true;
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

async function ensureDockerServices() {
  let isRunning = await isDockerDaemonRunning();

  if (!isRunning) {
    console.log('🐳 Docker daemon is not active. Attempting to launch Docker Desktop...');
    const launched = launchDockerDesktop();
    if (launched) {
      console.log('⏳ Waiting for Docker daemon to become ready...');
      isRunning = await waitForDocker(25);
    }
  }

  if (!isRunning) {
    return {
      started: false,
      message: 'Docker daemon is not running. Please open Docker Desktop manually.'
    };
  }

  try {
    console.log('🐳 Bringing up Docker Compose services (PostgreSQL, Kafka, OpenSearch)...');
    await execAsync('docker compose up -d', { cwd: PROJECT_DIR, timeout: 20000 });
    return { started: true, message: 'Docker Compose services running.' };
  } catch (err) {
    return {
      started: false,
      message: `Failed to run docker compose up: ${err.message}`
    };
  }
}

module.exports = { ensureDockerServices, isDockerDaemonRunning };
