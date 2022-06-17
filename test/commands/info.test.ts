import { expect, test } from '@oclif/test'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { ConfigService } from '../../src/services/config-service'

describe('info command', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const configService = new ConfigService()

  beforeEach(() => {
    const tempBundleDir = tempDirHelper.createInitializedBundleDir()
    process.chdir(tempBundleDir)
    configService.addOrUpdateProperty('key1', 'val1')
    configService.addOrUpdateProperty('key2', 'val2')
  })

  test
    .do(() => {
      configService.deleteProperty('key1')
      configService.deleteProperty('key2')
    })
    .stdout()
    .command('info')
    .it('Display bundle info without config values', ctx => {
      expect(ctx.stdout).to.contain('--- Bundle info ---')
      expect(ctx.stdout).to.contain('Name: test-bundle')
      expect(ctx.stdout).to.contain('Description: test-bundle description')
      expect(ctx.stdout).to.contain('Version: 0.0.1')
      expect(ctx.stdout).to.contain('--- Config values ---')
      expect(ctx.stdout).to.contain('No values set')
    })

  test
    .stdout()
    .command('info')
    .it('Display bundle info with config values', ctx => {
      expect(ctx.stdout).to.contain('key1: val1')
      expect(ctx.stdout).to.contain('key2: val2')
    })
})
