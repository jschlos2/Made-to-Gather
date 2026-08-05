import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { events } from '../src/data/events.ts';

function files(root) {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const publicEventOutput = files(fileURLToPath(new URL('../dist/events', import.meta.url))).map((path) => readFileSync(path, 'utf8')).join('\n');
for (const event of events) {
  assert.ok(!publicEventOutput.includes(event.hostFacingName), `${event.slug}: hostFacingName leaked into guest output`);
  if (event.hostOnly?.privateStreetAddress) assert.ok(!publicEventOutput.includes(event.hostOnly.privateStreetAddress), `${event.slug}: host-only street address leaked into guest output`);
  if (event.privateShareTokenEnv) assert.ok(!publicEventOutput.includes(event.privateShareTokenEnv), `${event.slug}: share-token environment name leaked into guest output`);
  assert.ok(!publicEventOutput.includes(event.photos.uploadTokenEnv), `${event.slug}: upload-token environment name leaked into guest output`);
}
console.log('Guest event output contains no configured host-only fields or token environment names.');
