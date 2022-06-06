import { expect, test } from '@oclif/test'
import { BaseBuildCommand } from '../../src/commands/base-build'
import Build from '../../src/commands/build'
import Pack from '../../src/commands/pack'

describe('Help command', () => {
  test
    .stdout()
    .command('help')
    .it('Display helps', ctx => {
      const help = ctx.stdout
      // abstract base-build command should not be displayed in help
      expect(help).not.contain('base-build')
      // command classes inheriting from base-build should be displayed in help
      expect(help).contain('build')
      expect(help).contain('pack')
      expect(help).contain('$ entando-bundle-cli [COMMAND]')
    })

  test.it('Test commands visibility in help', () => {
    expect(BaseBuildCommand.hidden).true
    expect(Build.hidden).false
    expect(Pack.hidden).false
  })

  test
    .stdout()
    .env({ ENTANDO_BUNDLE_CLI_BIN_NAME: 'custom-cli-name' })
    .command('help')
    .it('Display helps with customized CLI name', ctx => {
      const help = ctx.stdout
      expect(help).contain('$ custom-cli-name [COMMAND]', help)
    })
})
