import { format } from 'node:util'

import * as coreDebugFactory from 'debug'
import { Writable } from 'node:stream'

const rootDebugger = coreDebugFactory('entando-bundle-cli')

export interface Debugger {
  (message: string, ...args: any[]): void
  outputStream?: Writable
}

export function debugFactory(caller: { name: string } | string): Debugger {
  const namespace = typeof caller === 'string' ? caller : caller.name
  const extendedDebugger = rootDebugger.extend(namespace)

  extendedDebugger.enabled =
    extendedDebugger.enabled || process.env.ENTANDO_CLI_DEBUG === 'true'

  const debugFunction: Debugger = (message: string, ...args: any[]) => {
    if (extendedDebugger.enabled) {
      extendedDebugger(format(message, ...args))
    }
  }

  if (extendedDebugger.enabled) {
    debugFunction.outputStream = process.stderr
  }

  return debugFunction
}
