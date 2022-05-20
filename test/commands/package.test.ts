import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import ConfigService, {
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { BundleService } from '../../src/services/bundle-service'
import TempDirHelper from '../helpers/temp-dir-helper'

describe('package', () => {
  const tempDirHelper = new TempDirHelper('bundle-cli-package-test')

  test
    .do(() =>
      tempDirHelper.createInitializedBundleDir('test-bundle-org-prompt')
    )
    .stub(CliUx.ux, 'prompt', function () {
      return async () => 'prompted-organization'
    })
    .stub(BundleService, 'verifyBundleInitialized', stubNop)
    .command(['package'])
    .it('runs package asking the organization', () => {
      const configService = new ConfigService()
      expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
        'prompted-organization'
      )
    })

  test
    .do(() =>
      tempDirHelper.createInitializedBundleDir('test-bundle-existing-org')
    )
    .do(() => {
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
    })
    .stub(BundleService, 'verifyBundleInitialized', stubNop)
    .command(['package'])
    .it(
      'runs package using the organization stored in config file',
      function () {
        const configService = new ConfigService()
        expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
          'configured-organization'
        )
      }
    )

  test
    .do(() =>
      tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-no-existing-conf'
      )
    )
    .stub(BundleService, 'verifyBundleInitialized', stubNop)
    .command(['package', '--org', 'flag-organization'])
    .it(
      'runs package --org flag-organization without existing configuration',
      () => {
        const configService = new ConfigService()
        expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
          'flag-organization'
        )
      }
    )

  test
    .do(() =>
      tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-with-existing-conf'
      )
    )
    .do(() => {
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
    })
    .stub(BundleService, 'verifyBundleInitialized', stubNop)
    .command(['package', '--org', 'flag-organization'])
    .it(
      'runs package --org flag-organization with existing configuration',
      () => {
        const configService = new ConfigService()
        expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
          'flag-organization'
        )
      }
    )
})

function stubNop() {
  return function () {
    // no-op
  }
}
