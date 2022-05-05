import { expect, test } from '@oclif/test'

describe('hub-group-api', () => {
  test
    .stdout()
    .command(['hub-group-api', 'list'])
    .it('runs list option', ctx => {
      expect(ctx.stdout).to.contain('Bundle Group')
      expect(ctx.stdout).to.contain('Test germano 2')
    })

  test
    .stdout()
    .command(['hub-group-api', 'bundle', '--name="Test germano 1"'])
    .it('runs display bundle with name filter', ctx => {
      expect(ctx.stdout).to.contain('Test germano 1')
      expect(ctx.stdout).to.contain('51')
    })

  test
    .stdout()
    .command(['hub-group-api', 'bundle', '--versionId=51'])
    .it('runs display bundle info by version id', ctx => {
      expect(ctx.stdout).to.contain('Test germano 2')
      expect(ctx.stdout).to.contain('51')
    })

  test
    .stdout()
    .command(['hub-group-api', 'bundle'])
    .it('run bundle option without flags', ctx => {
      expect(ctx.stdout).to.contain('Please provide either --name or --versionId value. Bye.')
    })
})
