import {expect, test} from '@oclif/test'

describe('from-hub', () => {
  test
  .stdout()
  .command(['from-hub'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['from-hub', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
