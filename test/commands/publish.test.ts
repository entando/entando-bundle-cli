import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_REGISTRY_PROPERTY,
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { DockerService } from '../../src/services/docker-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'

describe('publish', () => {
  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    sinon.stub(DockerService, 'login').resolves()
  })

  test
    .stderr()
    .command('publish')
    .it('Exits if Docker organization is not found', ctx => {
      expect(ctx.stderr).contain(
        'No configured Docker organization found. Please run the command with --org flag.'
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(false)
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('myorganization')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .stderr()
    .command('publish')
    .it(
      'Executes pack if Docker images from configured organization are not found',
      ctx => {
        expect(ctx.stderr).contain(
          'One or more Docker images are missing. Running pack command.'
        )
      }
    )

  test
    .do(() => {
      sinon.stub(DockerService, 'bundleImagesExists').resolves(false)
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
    })
    .stderr()
    .command(['publish', '--org', 'myorganization'])
    .it(
      'Executes pack if Docker images from flag organization are not found',
      ctx => {
        expect(ctx.stderr).contain(
          'One or more Docker images are missing. Running pack command.'
        )
      }
    )

  test
    .do(() => {
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
    .command('publish')
    .it('Successfully publish Docker images')

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
    .command(['publish', '--docker-registry', 'my-custom-registry'])
    .it('Successfully publish Docker images on custom registry', () => {
      const addOrUpdatePropertyStub = ConfigService.prototype
        .addOrUpdateProperty as sinon.SinonStub
      sinon.assert.calledWith(
        addOrUpdatePropertyStub,
        DOCKER_REGISTRY_PROPERTY,
        'my-custom-registry'
      )
    })
})
