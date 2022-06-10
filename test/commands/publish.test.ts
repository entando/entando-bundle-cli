import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { DockerService } from '../../src/services/docker-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'

describe('publish', () => {
  afterEach(() => {
    sinon.restore()
  })

  test
    .stderr()
    .command('publish')
    .it('Executes pack if Docker organization is not found', ctx => {
      expect(ctx.stderr).contain(
        'No configured Docker organization found. Running pack command.'
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
    .it('Executes pack if Docker images are not found', ctx => {
      expect(ctx.stderr).contain(
        'One or more Docker images are missing. Running pack command.'
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
    })
    .command('publish')
    .it('Successfully publish Docker images')
})
