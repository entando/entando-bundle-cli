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

describe('publish', () => {
  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    sinon.stub(DockerService, 'login').resolves()
  })

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
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(Pack, 'run').resolves()
    })
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
      }
    )

  test
    .do(() => {
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon.stub(DockerService, 'bundleImagesExists').resolves(false)
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(Pack, 'run').resolves()
    })
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
      }
    )

  test
    .do(() => {
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
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .stderr()
    .command(['publish', '--org', 'flag-organization'])
    .it(
      'Detects mismatch between flag organization and configured organization',
      ctx => {
        expect(ctx.stderr).contain(
          'Docker organization changed. Updating images names.'
        )
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
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .command('publish')
    .it('Successfully publish Docker images using configured organization')

  test
    .do(() => {
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .command(['publish', '--org', 'flag-organization'])
    .it('Successfully publish Docker images using flag organization')

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .stdout()
    .command('publish')
    .it('Successfully publish Docker images', ctx => {
      expect(ctx.stdout).contain(
        'Login on Docker registry ' + DEFAULT_DOCKER_REGISTRY
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(true)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(ConfigService.prototype, 'addOrUpdateProperty')
    })
    .stdout()
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
    })
})
