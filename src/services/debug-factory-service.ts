import { format } from "node:util"

import * as coreDebugFactory from "debug"

const rootDebugger = coreDebugFactory("entando-bundle-cli")

export default function debugFactory(
  caller: { name: string } | string
): (message: string, ...args: any[]) => void {
  const namespace = typeof caller === "string" ? caller : caller.name
  const extendedDebugger = rootDebugger.extend(namespace)

  return (message: string, ...args: any[]) => {
    extendedDebugger.enabled =
      extendedDebugger.enabled ||
      process.env.ENTANDO_BUNDLE_CLI_DEBUG === "true"
    if (extendedDebugger.enabled) {
      extendedDebugger(format(message, ...args))
    }
  }
}
