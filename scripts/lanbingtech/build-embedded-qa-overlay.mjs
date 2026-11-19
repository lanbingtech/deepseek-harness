import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const output = join(root, '.artifacts/embedded-qa')
const runtime = process.env.DSH_DESKTOP_EXECUTABLE ?? 'D:/AppData/Local/Programs/DSH Desktop/DSH Desktop.exe'
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_CLIENT_VERSION: '0.2.1-rc.2', DSH_CLIENT_COMMIT_HASH: '687f282' }
const projects = ['ui-workspace', 'ui-conversation', 'ui-chat'].map(name => `packages/client/${name}`)
async function run(args, cwd = root) {
  await new Promise((resolve, reject) => {
    const child = spawn(runtime, args, { cwd, env, windowsHide: true, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Embedded UI build failed (${code ?? signal})`)))
  })
}
await mkdir(output, { recursive: true })
await run(['--import', 'tsx', '--input-type=module', '-e', "import { buildHostContracts } from './scripts/compile-referenced-projects.ts'; await buildHostContracts(process.cwd())"])
await run([join(root, 'node_modules/typescript/bin/tsc'), '-b', ...projects, '--pretty', 'false'])
const pnpmMetadata = JSON.parse(await readFile(join(root, 'node_modules/pnpm/package.json'), 'utf8'))
const pnpm = join(root, 'node_modules/pnpm', typeof pnpmMetadata.bin === 'string' ? pnpmMetadata.bin : pnpmMetadata.bin.pnpm)
const packages = []
for (const project of projects) {
  await run([join(root, 'node_modules/tsdown/dist/run.mjs')], join(root, project))
  await run([pnpm, 'pack', '--pack-destination', output, '--json'], join(root, project))
  const metadata = JSON.parse(await readFile(join(root, project, 'package.json'), 'utf8'))
  const tarball = join(output, `${metadata.name.replace('@', '').replace('/', '-')}-${metadata.version}.tgz`)
  const sha256 = createHash('sha256').update(await readFile(tarball)).digest('hex')
  const sdkTarball = join(output, `${metadata.name.replace('@deepseek-ai/dsh-', '')}-${sha256}.tgz`)
  await copyFile(tarball, sdkTarball)
  const clientSha256 = createHash('sha256').update(await readFile(join(root, project, 'lib/client.js'))).digest('hex')
  packages.push({ name: metadata.name, version: metadata.version, tarball, sdkTarball, sha256, clientSha256 })
}
await writeFile(join(output, 'manifest.json'), JSON.stringify({ verified: false, packages, builtAt: new Date().toISOString() }, null, 2))
console.log(JSON.stringify({ output, packages }))
