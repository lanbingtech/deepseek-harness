import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const output = join(root, '.artifacts/native-readonly')
const version = '0.2.1-rc.2.lanbingtech.2'
const directories = ['packages/client/ui-conversation', 'packages/client/ui-chat', 'packages/client/ui-tool']
const env = { ...process.env, DSH_CLIENT_VERSION: '0.2.1-rc.2', DSH_CLIENT_COMMIT_HASH: '687f282' }
async function run(args, cwd = root) {
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code, signal) => code === 0 ? done() : reject(new Error(`Readonly build failed (${code ?? signal})`)))
  })
}
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex')
await mkdir(output, { recursive: true })
// Client contracts import generated Remote declarations, including on a clean checkout.
await run(['--import', 'tsx', '--input-type=module', '-e', "import { buildHostContracts } from './scripts/compile-referenced-projects.ts'; await buildHostContracts(process.cwd())"])
await run([join(root, 'node_modules/typescript/bin/tsc'), '-b',
  'packages/client/ui-conversation/tsconfig.host.json', 'packages/client/ui-conversation/tsconfig.client.json',
  'packages/client/ui-chat/tsconfig.host.json', 'packages/client/ui-chat/tsconfig.client.json', 'packages/client/ui-tool', '--pretty', 'false'])
const pnpmPackage = join(root, 'node_modules/pnpm/package.json')
const pnpmMetadata = JSON.parse(await readFile(pnpmPackage, 'utf8'))
const pnpm = resolve(dirname(pnpmPackage), typeof pnpmMetadata.bin === 'string' ? pnpmMetadata.bin : pnpmMetadata.bin.pnpm)
const packages = []
for (const directory of directories) {
  const metadata = JSON.parse(await readFile(join(root, directory, 'package.json'), 'utf8'))
  if (metadata.version !== version) throw new Error(`Unexpected readonly package version: ${metadata.name}`)
  await run([join(root, 'node_modules/tsdown/dist/run.mjs')], join(root, directory))
  await run([pnpm, 'pack', '--pack-destination', output, '--json'], join(root, directory))
  const tarball = join(output, `${metadata.name.replace('@', '').replace('/', '-')}-${version}.tgz`)
  const sha256 = await digest(tarball)
  const sdkName = metadata.name.replace('@deepseek-ai/dsh-client-ui-', '')
  const sdkTarball = join(output, `sdk-${sdkName}-${sha256}.tgz`)
  await copyFile(tarball, sdkTarball)
  packages.push({ name: metadata.name, version, tarball, sdkTarball, sha256, clientSha256: await digest(join(root, directory, 'lib/client.js')) })
}
const manifest = { verified: false, packages, builtAt: new Date().toISOString() }
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify(manifest))
