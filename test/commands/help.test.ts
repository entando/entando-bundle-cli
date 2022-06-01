import { expect, test } from '@oclif/test'

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
  })
