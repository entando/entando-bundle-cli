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
import * as executors from '../../src/services/process-executor-service'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'

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

  test.it('Perform docker login on default registry', async () => {
    sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .onFirstCall()
      .resolves(1)
      .onSecondCall()
      .resolves(0)
    await DockerService.login()
  })

  test.it('Perform docker login on custom registry', async () => {
    sinon.stub(ProcessExecutorService, 'executeProcess').resolves(0)
    await DockerService.login('my-registry')
  })

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(1)
      await DockerService.login()
    })
    .catch(error => {
      expect(error.message).contain('Docker login failed')
    })
    .it('Docker login fails')

  test.it('Updates Docker images organization', async () => {
    const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
    sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
      {
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.SpringBoot,
        name: 'test-ms',
        version: '0.0.2'
      }
    ])

    const stubParallelProcessExecutorService =
      new StubParallelProcessExecutorService([0, 0])
    const parallelExecutorStub = sinon
      .stub(executors, 'ParallelProcessExecutorService')
      .returns(stubParallelProcessExecutorService)

    await DockerService.updateImagesOrganization(
      bundleDescriptor,
      'old-org',
      'new-org'
    )

    sinon.assert.calledWith(parallelExecutorStub, [
      sinon.match({
        command:
          DOCKER_COMMAND +
          ' tag old-org/test-bundle:0.0.1 new-org/test-bundle:0.0.1'
      }),
      sinon.match({
        command:
          DOCKER_COMMAND + ' tag old-org/test-ms:0.0.2 new-org/test-ms:0.0.2'
      })
    ])
  })

  test.it('Sets Docker images registry', async () => {
    const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
    sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
      {
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.SpringBoot,
        name: 'test-ms',
        version: '0.0.2'
      }
    ])

    const stubParallelProcessExecutorService =
      new StubParallelProcessExecutorService([0, 0])
    const parallelExecutorStub = sinon
      .stub(executors, 'ParallelProcessExecutorService')
      .returns(stubParallelProcessExecutorService)

    await DockerService.setImagesRegistry(bundleDescriptor, 'org', 'registry')

    sinon.assert.calledWith(parallelExecutorStub, [
      sinon.match({
        command:
          DOCKER_COMMAND +
          ' tag org/test-bundle:0.0.1 registry/org/test-bundle:0.0.1'
      }),
      sinon.match({
        command:
          DOCKER_COMMAND + ' tag org/test-ms:0.0.2 registry/org/test-ms:0.0.2'
      })
    ])
  })

  test
    .do(async () => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      sinon
        .stub(ComponentService.prototype, 'getVersionedComponents')
        .returns([])
      const stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService([1])
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
      await DockerService.setImagesRegistry(bundleDescriptor, 'org', 'registry')
    })
    .catch(error => {
      expect(error.message).contain('Unable to create Docker image tag')
    })
    .it('Docker image tag creation fails')

  test.it('Push image and retrieve digest', async () => {
    const executeProcessStub = sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .callsFake(options => {
        options.outputStream!.write('a0c: Pushed\n')
        options.outputStream!.write('6p5: Pushed\n')
        options.outputStream!.write(
          '0.0.1: digest: sha256:52b239f9 size: 2213\n'
        )
        return Promise.resolve(0)
      })

    const sha = await DockerService.pushImage('myimage')

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: DOCKER_COMMAND + ' push myimage'
      })
    )
    expect(sha).eq('sha256:52b239f9')
  })

  test.it('Push image but unable to retrieve digest', async () => {
    const executeProcessStub = sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .resolves(0)

    const sha = await DockerService.pushImage('myimage')

    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: DOCKER_COMMAND + ' push myimage'
      })
    )
    expect(sha).eq('')
  })

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(1)
      await DockerService.pushImage('myimage')
    })
    .catch(error => {
      expect(error.message).contain('Unable to push Docker image')
    })
    .it('Error while pushing image')
})
