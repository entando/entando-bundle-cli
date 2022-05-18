import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import ConfigService, {
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { BundleService } from '../../src/services/bundle-service'
import { CONFIG_FILE, CONFIG_FOLDER } from '../../src/paths'

describe('package', () => {
  let tmpDir: string

  before(() => {
    // creating a temporary directory
    tmpDir = path.resolve(os.tmpdir(), 'bundle-cli-package-test')
    fs.mkdirSync(tmpDir)
  })

  beforeEach(() => {
    process.chdir(tmpDir)
  })

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .do(() => initTestBundleFolder('test-bundle-org-prompt'))
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
    .do(() => initTestBundleFolder('test-bundle-existing-org'))
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
    .do(() => initTestBundleFolder('test-bundle-org-flag-no-existing-conf'))
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
    .do(() => initTestBundleFolder('test-bundle-org-flag-with-existing-conf'))
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

  function initTestBundleFolder(bundleName: string) {
    const bundleDir = path.resolve(tmpDir, bundleName)
    // creating config directory
    const configDir = path.resolve(bundleDir, CONFIG_FOLDER)
    fs.mkdirSync(configDir, { recursive: true })
    // creating empty config file
    const configFile = path.resolve(configDir, CONFIG_FILE)
    fs.writeFileSync(configFile, '{}')
    process.chdir(bundleDir)
  }
})

function stubNop() {
  return function () {
    // no-op
  }
}
