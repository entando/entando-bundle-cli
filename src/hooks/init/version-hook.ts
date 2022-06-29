import { Hook } from '@oclif/core'

const hook: Hook<'init'> = async function (opts) {
  if (['-v', '-V', '--version', 'version'].includes(process.argv[2])) {
    console.error(opts.config.userAgent)
    console.log(opts.config.version)
    /* eslint-disable no-process-exit */
    /* eslint-disable unicorn/no-process-exit */
    return process.exit(0)
  }
}

export default hook
