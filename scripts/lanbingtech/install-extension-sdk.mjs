import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const target = await realpath(resolve(process.argv[2] ?? process.cwd()))
const metadata = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
assert.ok(['dsh-workbench', 'dsh-agent-sessions'].includes(metadata.name), 'SDK installation targets one of the two feature repositories')
assert.equal(target.toLowerCase(), (await realpath(join(root, '..', metadata.name))).toLowerCase(), 'SDK target must be the sibling feature repository')
const manifest = JSON.parse(await readFile(join(root, '.artifacts/native-navigation/manifest.json'), 'utf8'))
assert.equal(manifest.baseline, '687f282e8625c6b8d11ff58211a90524be2e4317', 'Unexpected native source baseline')
assert.deepEqual(manifest.packages.map(item => item.name).sort(), [
  '@deepseek-ai/dsh-api-remotes', '@deepseek-ai/dsh-api-session-controller',
  '@deepseek-ai/dsh-client-ui-sidebar', '@deepseek-ai/dsh-client-ui-workspace',
])
const sources = []
const sdkDirectory = await realpath(join(root, '.artifacts/native-navigation/sdk'))
for (const item of manifest.packages) {
  const path = await realpath(item.sdkTarball)
  assert.equal(dirname(path).toLowerCase(), sdkDirectory.toLowerCase(), 'SDK tarballs must be in the native build output')
  assert.equal(item.version, '0.2.1-rc.2.lanbingtech.1', `Unexpected SDK version: ${item.name}`)
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), item.sha256)
  const packed = await promisify(execFile)('tar', ['-xOf', path, 'package/package.json'], { windowsHide: true, maxBuffer: 1024 * 1024 })
  const identity = JSON.parse(packed.stdout)
  assert.equal(identity.name, item.name, 'Tarball package identity differs from the manifest')
  assert.equal(identity.version, item.version, 'Tarball package version differs from the manifest')
  sources.push(path)
}
if (process.argv[3] === '--check') {
  console.log(`Validated ${sources.length} native SDK packages for ${metadata.name}`)
  process.exit(0)
}
const npm = join(dirname(await realpath(process.execPath)), 'node_modules/npm/bin/npm-cli.js')
await readFile(npm)
await new Promise((done, reject) => {
  const child = spawn(process.execPath, [npm, 'install', '--save-dev', '--ignore-scripts', '--legacy-peer-deps', ...sources], { cwd: target, windowsHide: true, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code, signal) => code === 0 ? done() : reject(new Error(`Extension SDK installation failed (${code ?? signal})`)))
})
