import { expect, test } from '@oclif/test'

describe('CLI name hook', () => {
  test
    .stdout()
    .hook('init', { id: 'cli-name' })
    .do(output => expect(output.config.bin).eq('entando-bundle-cli'))
    .it('By default hook does not modify CLI name')

  test
    .stdout()
    .env({ ENTANDO_BUNDLE_CLI_BIN_NAME: 'custom-cli-name' })
    .hook('init', { id: 'cli-name' })
    .do(output => expect(output.config.bin).eq('custom-cli-name'))
    .it(
      'Hook overrides CLI name if name customization environment variable is set'
    )
})
