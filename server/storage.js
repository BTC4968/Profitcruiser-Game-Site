import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultState } from './defaults.js';

const stateFileUrl = new URL('./data/state.json', import.meta.url);

const ensureDirectory = async (path) => {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
};

export const loadState = async () => {
  const path = fileURLToPath(stateFileUrl);

  try {
    await access(path);
  } catch {
    await ensureDirectory(path);
    const defaultState = createDefaultState();
    await writeFile(path, JSON.stringify(defaultState, null, 2), 'utf8');
    return structuredClone(defaultState);
  }

  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
};

export const saveState = async (state) => {
  const path = fileURLToPath(stateFileUrl);
  await ensureDirectory(path);
  await writeFile(path, JSON.stringify(state, null, 2), 'utf8');
};

