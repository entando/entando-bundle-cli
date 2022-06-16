import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_REGISTRY_PROPERTY,
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import {
  DEFAULT_DOCKER_REGISTRY,
  DockerService
} from '../../src/services/docker-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import Pack from '../../src/commands/pack'
import { BundleService } from '../../src/services/bundle-service'

describe('publish', () => {
  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    sinon.stub(BundleService, 'isValidBundleProject')
    sinon
      .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
      .returns(BundleDescriptorHelper.newBundleDescriptor())
    sinon.stub(DockerService, 'login').resolves()
  })

  test
    .do(() => {
      sinon.restore()
      sinon
        .stub(BundleService, 'isValidBundleProject')
        .throws(new Error('not initialized'))
    })
    .command('publish')
    .catch(error => {
      expect(error.message).contain('not initialized')
    })
    .it('Exits if is not a valid bundle project')

  test
    .command('publish')
    .catch(error => {
      expect(error.message).contain(
        'No configured Docker organization found. Please run the command with --org flag.'
      )
    })
    .it('Exits if Docker organization is not found')

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(false)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('configured-organization')
      sinon.stub(Pack, 'run').resolves()
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('configured-organization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command('publish')
    .it(
      'Executes pack if Docker images from configured organization are not found',
      ctx => {
        expect(ctx.stderr).contain(
          'One or more Docker images are missing. Running pack command.'
        )
        const packStub = Pack.run as sinon.SinonStub
        sinon.assert.calledWith(packStub, ['--org', 'configured-organization'])
        verifyPushedSuccessfully(
          'configured-organization',
          ctx.stdout,
          ctx.stderr
        )
      }
    )

  test
    .do(() => {
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon.stub(DockerService, 'bundleImagesExists').resolves(false)
      sinon.stub(Pack, 'run').resolves()
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('flag-organization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command(['publish', '--org', 'flag-organization'])
    .it(
      'Executes pack if Docker images from flag organization are not found',
      ctx => {
        const addOrUpdatePropertyStub = ConfigService.prototype
          .addOrUpdateProperty as sinon.SinonStub
        sinon.assert.calledWith(
          addOrUpdatePropertyStub,
          DOCKER_ORGANIZATION_PROPERTY,
          'flag-organization'
        )
        expect(ctx.stderr).contain(
          'One or more Docker images are missing. Running pack command.'
        )
        const packStub = Pack.run as sinon.SinonStub
        sinon.assert.calledWith(packStub, ['--org', 'flag-organization'])
        verifyPushedSuccessfully('flag-organization', ctx.stdout, ctx.stderr)
      }
    )

  test
    .do(() => {
      sinon.stub(DockerService, 'updateImagesOrganization').resolves()
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon
        .stub(DockerService, 'bundleImagesExists')
        .onFirstCall()
        .resolves(false)
        .onSecondCall()
        .resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('configured-organization')
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('flag-organization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command(['publish', '--org', 'flag-organization'])
    .it(
      'Detects mismatch between flag organization and configured organization',
      ctx => {
        expect(ctx.stderr).contain(
          'Docker organization changed. Updating images names.'
        )
        const updateImagesOrganizationStub =
          DockerService.updateImagesOrganization as sinon.SinonStub
        sinon.assert.calledWith(
          updateImagesOrganizationStub,
          sinon.match.any,
          'configured-organization',
          'flag-organization'
        )
        verifyPushedSuccessfully('flag-organization', ctx.stdout, ctx.stderr)
      }
    )

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('myorganization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command('publish')
    .it(
      'Successfully publish Docker images using configured organization',
      ctx => {
        verifyPushedSuccessfully('myorganization', ctx.stdout, ctx.stderr)
      }
    )

  test
    .do(() => {
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('flag-organization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command(['publish', '--org', 'flag-organization'])
    .it('Successfully publish Docker images using flag organization', ctx => {
      verifyPushedSuccessfully('flag-organization', ctx.stdout, ctx.stderr)
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon
        .stub(DockerService, 'getBundleDockerImages')
        .resolves(getImagesToPush('myorganization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command('publish')
    .it('Successfully publish Docker images', ctx => {
      expect(ctx.stdout).contain(
        'Login on Docker registry ' + DEFAULT_DOCKER_REGISTRY
      )
      verifyPushedSuccessfully('myorganization', ctx.stdout, ctx.stderr)
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon
        .stub(DockerService, 'setImagesRegistry')
        .resolves(getImagesToPush('my-custom-registry/myorganization'))
      sinon.stub(DockerService, 'pushImage').resolves('sha:123')
    })
    .stdout()
    .stderr()
    .command(['publish', '--registry', 'my-custom-registry'])
    .it('Successfully publish Docker images on custom registry', ctx => {
      expect(ctx.stdout).contain('Login on Docker registry my-custom-registry')
      const addOrUpdatePropertyStub = ConfigService.prototype
        .addOrUpdateProperty as sinon.SinonStub
      sinon.assert.calledWith(
        addOrUpdatePropertyStub,
        DOCKER_REGISTRY_PROPERTY,
        'my-custom-registry'
      )
      const setImagesRegistryStub =
        DockerService.setImagesRegistry as sinon.SinonStub
      sinon.assert.calledWith(
        setImagesRegistryStub,
        sinon.match.any,
        'myorganization',
        'my-custom-registry'
      )
      verifyPushedSuccessfully(
        'my-custom-registry/myorganization',
        ctx.stdout,
        ctx.stderr
      )
    })
})

function getImagesToPush(prefix: string) {
  return [
    prefix + '/test-bundle:0.0.1',
    prefix + '/test-ms-spring-boot-1:0.0.2',
    prefix + '/test-ms-spring-boot-2:0.0.3'
  ]
}

function verifyPushedSuccessfully(
  imagePrefix: string,
  stdout: string,
  stderr: string
) {
  const pushImageStub = DockerService.pushImage as sinon.SinonStub
  sinon.assert.calledWith(
    pushImageStub.firstCall,
    imagePrefix + '/test-bundle:0.0.1'
  )
  sinon.assert.calledWith(
    pushImageStub.secondCall,
    imagePrefix + '/test-ms-spring-boot-1:0.0.2'
  )
  sinon.assert.calledWith(
    pushImageStub.thirdCall,
    imagePrefix + '/test-ms-spring-boot-2:0.0.3'
  )
  expect(stderr).contain('3/3')
  expect(stdout).contain('Images pushed successfully')
  expect(stdout).contain(imagePrefix + '/test-bundle:0.0.1')
  expect(stdout).contain(imagePrefix + '/test-ms-spring-boot-1:0.0.2')
  expect(stdout).contain(imagePrefix + '/test-ms-spring-boot-2:0.0.3')
  expect(stdout).contain('sha:123')
}
