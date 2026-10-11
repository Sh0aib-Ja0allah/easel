// Shared paths for the easel-design tests.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
