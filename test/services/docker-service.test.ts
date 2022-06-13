import { test, expect } from '@oclif/test'

import { ProcessExecutorService } from '../../src/services/process-executor-service'
import {
  DockerService,
  DOCKER_COMMAND
} from '../../src/services/docker-service'
import * as sinon from 'sinon'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import { ComponentService } from '../../src/services/component-service'
import { ComponentType, MicroserviceStack } from '../../src/models/component'

describe('DockerService', () => {
  afterEach(function () {
    sinon.restore()
  })

  test.it('Builds Docker image with standard Dockerfile', () => {
    const executeProcessStub = sinon.stub(
      ProcessExecutorService,
      'executeProcess'
    )

    DockerService.buildDockerImage({
      path: '.',
      organization: 'my-org',
      name: 'bundle-name',
      tag: '0.0.1'
    })

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command:
          DOCKER_COMMAND + ' build -f Dockerfile -t my-org/bundle-name:0.0.1 .'
      })
    )
  })

  test.it('Builds Docker image with custom Dockerfile', () => {
    const executeProcessStub = sinon.stub(
      ProcessExecutorService,
      'executeProcess'
    )

    DockerService.buildDockerImage({
      path: '.',
      organization: 'my-org',
      name: 'bundle-name',
      tag: '0.0.1',
      dockerfile: 'my-Dockerfile'
    })

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command:
          DOCKER_COMMAND +
          ' build -f my-Dockerfile -t my-org/bundle-name:0.0.1 .'
      })
    )
  })

  test.it(
    'Checks Docker images existence and found all required images',
    async () => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()

      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot,
          name: 'test-ms-spring-boot-1',
          version: '0.0.2'
        },
        {
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot,
          name: 'test-ms-spring-boot-2',
          version: '0.0.3'
        }
      ])

      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.outputStream!.write('myorg/test-bundle:0.0.1\n')
          options.outputStream!.write('myorg/test-ms-spring-boot-1:0.0.2\n')
          options.outputStream!.write('myorg/test-ms-spring-boot-2:0.0.3\n')
          return Promise.resolve(0)
        })

      expect(await DockerService.bundleImagesExists(bundleDescriptor, 'myorg'))
        .true
    }
  )

  test.it(
    'Checks Docker images existence and does not found the required images',
    async () => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      sinon
        .stub(ComponentService.prototype, 'getVersionedComponents')
        .returns([])
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(0)

      expect(await DockerService.bundleImagesExists(bundleDescriptor, 'myorg'))
        .false
    }
  )

  test
    .do(async () => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      sinon
        .stub(ComponentService.prototype, 'getVersionedComponents')
        .returns([])
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(1)
      await DockerService.bundleImagesExists(bundleDescriptor, 'myorg')
    })
    .catch(error => {
      expect(error.message).contain('Unable to check Docker images')
    })
    .it('Checks Docker images existence and docker ls command fails')
})
