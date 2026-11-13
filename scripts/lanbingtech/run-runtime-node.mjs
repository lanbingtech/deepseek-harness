import { spawn } from 'node:child_process'

// Run build tools with the exact Node runtime bundled by the target Desktop.
// Windows GUI executables must be awaited as child processes rather than
// invoked directly through PowerShell, which may return before they finish.
const executable = process.env.DSH_DESKTOP_EXECUTABLE ?? 'D:/AppData/Local/Programs/DSH Desktop/DSH Desktop.exe'
const child = spawn(executable, process.argv.slice(2), {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  windowsHide: true,
  stdio: 'inherit',
})
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0) })
