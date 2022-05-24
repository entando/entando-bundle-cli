import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { BundleService } from '../../src/services/bundle-service'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { DockerService } from '../../src/services/docker-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'

describe('package', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  let stubBuildDockerImage: sinon.SinonStub
  let stubGenerateYamlDescriptors: sinon.SinonStub

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-org-prompt')
      stubBuildDockerImage = sinon
        .stub(DockerService, 'buildDockerImage')
        .resolves()
      stubGenerateYamlDescriptors = sinon.stub(
        BundleDescriptorConverterService.prototype,
        'generateYamlDescriptors'
      )
    })
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
      sinon.assert.calledOnce(stubGenerateYamlDescriptors)
      sinon.assert.calledOnce(stubBuildDockerImage)
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-existing-org')
      stubBuildDockerImage = sinon
        .stub(DockerService, 'buildDockerImage')
        .resolves()
      stubGenerateYamlDescriptors = sinon.stub(
        BundleDescriptorConverterService.prototype,
        'generateYamlDescriptors'
      )
    })
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
        sinon.assert.calledOnce(stubGenerateYamlDescriptors)
        sinon.assert.calledOnce(stubBuildDockerImage)
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
