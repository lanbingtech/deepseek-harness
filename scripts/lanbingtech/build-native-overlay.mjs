import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pnpmPackage = join(root, 'node_modules/pnpm/package.json')
const pnpmMetadata = JSON.parse(await readFile(pnpmPackage, 'utf8'))
const pnpm = resolve(dirname(pnpmPackage), typeof pnpmMetadata.bin === 'string' ? pnpmMetadata.bin : pnpmMetadata.bin.pnpm)
const runtime = process.env.DSH_DESKTOP_EXECUTABLE ?? 'D:/AppData/Local/Programs/DSH Desktop/DSH Desktop.exe'
const output = join(root, '.artifacts/native-navigation')
const sdk = join(output, 'sdk')
const version = '0.2.1-rc.2.lanbingtech.1'
const packages = [
  ['dsh-client-ui-sidebar', 'packages/client/ui-sidebar'],
  ['dsh-client-ui-workspace', 'packages/client/ui-workspace'],
  ['dsh-api-session-controller', 'packages/api/session-controller'],
  ['dsh-api-remotes', 'packages/api/remotes'],
]
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_CLIENT_VERSION: '0.2.1-rc.2', DSH_CLIENT_COMMIT_HASH: '687f282' }
async function run(args) {
  await new Promise((done, reject) => {
    const child = spawn(runtime, args, { cwd: root, env, windowsHide: true, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code, signal) => code === 0 ? done() : reject(new Error(`Native build command failed (${code ?? signal}): ${JSON.stringify(args)}`)))
  })
}
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex')
await mkdir(sdk, { recursive: true })
if (process.argv.length > 2) throw new Error('This build always regenerates Host contracts and does not accept incremental reuse flags')
await run(['--import', 'tsx', '--input-type=module', '-e', "import { buildHostContracts } from './scripts/compile-referenced-projects.ts'; await buildHostContracts(process.cwd())"])
await run([pnpm, 'exec', 'tsdown', '--config-loader', 'native', '--env.DSH_BUILD_FACE=host'])
await run([pnpm, 'exec', 'tsc', '-b', 'packages/client/ui-sidebar', 'packages/client/ui-workspace', 'packages/api/remotes/tsconfig.client.json'])
const artifacts = []
for (const [name, directory] of packages) {
  const metadata = JSON.parse(await readFile(join(root, directory, 'package.json'), 'utf8'))
  if (metadata.version !== version) throw new Error(`Unexpected native package version: ${name}`)
  await run([pnpm, '--dir', directory, 'run', 'bundle'])
  await run([pnpm, '--dir', directory, 'pack', '--pack-destination', output, '--json'])
  const tarball = join(output, `deepseek-ai-${name}-${version}.tgz`)
  const sha256 = await digest(tarball)
  const sdkTarball = join(sdk, `${name}-${sha256}.tgz`)
  await copyFile(tarball, sdkTarball)
  artifacts.push({ name: `@deepseek-ai/${name}`, version, tarball, sdkTarball, sha256, clientSha256: await digest(join(root, directory, 'lib/client.js')) })
}
const manifest = { verified: false, baseline: '687f282e8625c6b8d11ff58211a90524be2e4317', packages: artifacts, builtAt: new Date().toISOString() }
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify(manifest))
