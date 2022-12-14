import { expect, test } from '@oclif/test'
import { BundleService } from '../../src/services/bundle-service'
import {
  BundleDescriptor,
  Microservice
} from '../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../../src/services/config-service'
import { ComponentType, MicroserviceStack } from '../../src/models/component'
import * as sinon from 'sinon'
import { ComponentService } from '../../src/services/component-service'

describe('images', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-name',
    version: '0.0.2',
    type: 'bundle',
    microfrontends: [],
    microservices: <Microservice[]>[
      { name: 'ms1', stack: MicroserviceStack.SpringBoot },
      { name: 'ms2', stack: MicroserviceStack.Node }
    ]
  }

  const versionedMicroservices = bundleDescriptor.microservices.map(m => {
    return {
      ...m,
      type: ComponentType.MICROSERVICE,
      version: '0.0.3'
    }
  })

  beforeEach(() => {
    sinon.stub(BundleService, 'isValidBundleProject')
    sinon
      .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
      .returns(bundleDescriptor)
    sinon
      .stub(ComponentService.prototype, 'getVersionedComponents')
      .returns(versionedMicroservices)
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .stdout()
    .do(() => {
      sinon.stub(ConfigService.prototype, 'getProperty')
    })
    .command('images')
    .it('List images without organization', ctx => {
      expect(ctx.stdout).contain('NAME        VERSION TYPE         STACK')
      expect(ctx.stdout).contain('bundle-name 0.0.2   bundle       -')
      expect(ctx.stdout).contain('ms1         0.0.3   microservice spring-boot')
      expect(ctx.stdout).contain('ms2         0.0.3   microservice node')
    })

  test
    .stdout()
    .do(() => {
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
    })
    .command('images')
    .it('List images with custom organization and default registry', ctx => {
      expect(ctx.stdout).contain(
        'NAME                                       VERSION TYPE         STACK'
      )
      expect(ctx.stdout).contain(
        'registry.hub.docker.com/my-org/bundle-name 0.0.2   bundle       -'
      )
      expect(ctx.stdout).contain(
        'registry.hub.docker.com/my-org/ms1         0.0.3   microservice spring-boot'
      )
      expect(ctx.stdout).contain(
        'registry.hub.docker.com/my-org/ms2         0.0.3   microservice node'
      )
    })

  test
    .stdout()
    .do(() => {
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
        .withArgs(DOCKER_REGISTRY_PROPERTY)
        .returns('my-registry.org')
    })
    .command('images')
    .it('List images with custom organization and custom registry', ctx => {
      expect(ctx.stdout).contain(
        'NAME                               VERSION TYPE         STACK'
      )
      expect(ctx.stdout).contain(
        'my-registry.org/my-org/bundle-name 0.0.2   bundle       -'
      )
      expect(ctx.stdout).contain(
        'my-registry.org/my-org/ms1         0.0.3   microservice spring-boot'
      )
      expect(ctx.stdout).contain(
        'my-registry.org/my-org/ms2         0.0.3   microservice node'
      )
    })
})
