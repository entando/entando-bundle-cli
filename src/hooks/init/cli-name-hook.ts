import { Hook } from '@oclif/core'

const hook: Hook<'init'> = async function (opts) {
  if (process.env.ENTANDO_BUNDLE_CLI_BIN_NAME) {
    opts.config.bin = process.env.ENTANDO_BUNDLE_CLI_BIN_NAME
  }
}

export default hook
