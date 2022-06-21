import { expect, test } from '@oclif/test'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleService } from '../../src/services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../../src/services/config-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import {
  DEFAULT_DOCKER_REGISTRY,
  DockerService
} from '../../src/services/docker-service'
import * as sinon from 'sinon'

describe('generate-cr', () => {
  afterEach(() => {
    sinon.restore()
  })

  const tagsWithDigests = new Map()
  tagsWithDigests.set('0.0.2', 'sha256:abcd')
  tagsWithDigests.set('0.0.1', 'sha256:1234')

  test
    .command('generate-cr')
    .catch(error => {
      expect(error.message).contain('not an initialized bundle project')
      expect(error.message).contain('Use the --image flag')
    })
    .it('Exits if is not a valid bundle project')

  test
    .stdout()
    .command(['generate-cr', '--image', 'invalid-format'])
    .catch(error => {
      expect(error.message).contain('Invalid bundle image format')
    })
    .it('Exits if image flag has invalid format')

  test
    .do(() => {
      sinon.stub(DockerService, 'getTagsWithDigests').resolves(tagsWithDigests)
    })
    .stdout()
    .command(['generate-cr', '--image', 'entando/my-bundle'])
    .it('Accepts image name without registry', () => {
      const getTagsWithDigestsStub =
        DockerService.getTagsWithDigests as sinon.SinonStub
      sinon.assert.calledWith(
        getTagsWithDigestsStub,
        `${DEFAULT_DOCKER_REGISTRY}/entando/my-bundle`
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'getTagsWithDigests').resolves(tagsWithDigests)
    })
    .stdout()
    .command([
      'generate-cr',
      '--image',
      'custom-registry.org/entando/my-bundle'
    ])
    .it('Accepts image name with registry', () => {
      const getTagsWithDigestsStub =
        DockerService.getTagsWithDigests as sinon.SinonStub
      sinon.assert.calledWith(
        getTagsWithDigestsStub,
        'custom-registry.org/entando/my-bundle'
      )
    })

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
    })
    .command('generate-cr')
    .catch(error => {
      expect(error.message).contain(
        'Docker organization not configured for the project'
      )
    })
    .it('Exits if Docker organization is not found')

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(DockerService, 'getTagsWithDigests').resolves(tagsWithDigests)
    })
    .command('generate-cr')
    .it('Generate CR for current project and default registry', () => {
      const getTagsWithDigestsStub =
        DockerService.getTagsWithDigests as sinon.SinonStub
      sinon.assert.calledWith(
        getTagsWithDigestsStub,
        `${DEFAULT_DOCKER_REGISTRY}/my-org/test-bundle`
      )
    })

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
        .withArgs(DOCKER_REGISTRY_PROPERTY)
        .returns('custom-registry.org')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(DockerService, 'getTagsWithDigests').resolves(tagsWithDigests)
    })
    .command('generate-cr')
    .it('Generate CR for current project and custom registry', () => {
      const getTagsWithDigestsStub =
        DockerService.getTagsWithDigests as sinon.SinonStub
      sinon.assert.calledWith(
        getTagsWithDigestsStub,
        'custom-registry.org/my-org/test-bundle'
      )
    })
})
