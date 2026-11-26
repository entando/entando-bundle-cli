import { Hook } from '@oclif/core'
import * as childProcess from 'node:child_process'
import { debugFactory } from '../../services/debug-factory-service'

// Tells whether the process is an x64 binary translated by Rosetta 2; undefined outside macOS
export function isTranslatedByRosetta(): boolean | undefined {
  if (process.platform !== 'darwin') {
    return undefined
  }

  try {
    const translated = childProcess.execFileSync(
      'sysctl',
      ['-n', 'sysctl.proc_translated'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    )
    return translated.trim() === '1'
  } catch {
    // the key does not exist on Intel Macs
    return false
  }
}

export function describeRuntime(): string {
  const translated = isTranslatedByRosetta()
  let translation = ''
  if (translated !== undefined) {
    translation = translated ? ' (running through Rosetta 2)' : ' (native)'
  }

  return `Node.js ${process.version} on ${process.platform}/${process.arch}${translation}`
}

// Logs the Node.js runtime in debug mode, to help diagnosing issues on ARM hosts (e.g. Apple Silicon)
const hook: Hook<'init'> = async function () {
  const debug = debugFactory('runtime-hook')
  if (debug.outputStream) {
    debug(describeRuntime())
  }
}

export default hook
