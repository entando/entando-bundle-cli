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
import {
  COMMAND_NOT_FOUND_EXIT_CODE,
  ProcessExecutionOptions
} from '../../src/services/process-executor-service'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_NAME, DOCKER_CONFIG_FOLDER } from '../../src/paths'
import * as YAML from 'yaml'

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
          DOCKER_COMMAND +
          ' build --platform "linux/amd64" -f Dockerfile -t my-org/bundle-name:0.0.1 .'
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
          ' build --platform "linux/amd64" -f my-Dockerfile -t my-org/bundle-name:0.0.1 .'
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
        command:
          DOCKER_COMMAND +
          ' --config ' +
          path.join(...DOCKER_CONFIG_FOLDER) +
          ' push myimage'
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
        command:
          DOCKER_COMMAND +
          ' --config ' +
          path.join(...DOCKER_CONFIG_FOLDER) +
          ' push myimage'
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

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(COMMAND_NOT_FOUND_EXIT_CODE)
      await DockerService.listTags('registry/org/my-bundle')
    })
    .catch(error => {
      expect(error.message).contain('Command crane not found')
    })
    .it('Tags retrieval fails if crane is not installed')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.errorStream!.write(
            'NAME_UNKNOWN: repository name not known to registry'
          )
          return Promise.resolve(1)
        })
      await DockerService.listTags('registry/org/my-bundle')
    })
    .catch(error => {
      expect(error.message).contain('Image registry/org/my-bundle not found')
    })
    .it('Tags retrieval fails if image is not found')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.errorStream!.write('UNAUTHORIZED: authentication required')
          return Promise.resolve(1)
        })
      await DockerService.listTags('registry/org/my-bundle')
    })
    .catch(error => {
      expect(error.message).contain('Registry required authentication')
      expect(error.message).contain(
        'Please verify that registry/org/my-bundle exists'
      )
    })
    .it('Tags retrieval fails if listing is not authorized')

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(1)
      await DockerService.listTags('registry/org/my-bundle')
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to list tags for Docker image registry/org/my-bundle'
      )
    })
    .it('Tags retrieval fails on generic error')

  test
    .env({ ENTANDO_CLI_CRANE_BIN: undefined })
    .it('Tags retrieval is successfull', async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          expect(options.command).eq('crane ls registry/org/my-bundle')
          options.outputStream!.write('0.0.1\n0.0.2\n')
          return Promise.resolve(0)
        })

      const tags = await DockerService.listTags('registry/org/my-bundle')
      expect(tags).deep.equal(['0.0.2', '0.0.1'])
    })

  test
    .do(async () => {
      const stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService([1])
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)

      const digestsExecutor = DockerService.getDigestsExecutor(
        'registry/org/my-bundle',
        ['0.0.2', '0.0.1']
      )
      await digestsExecutor.getDigests()
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to retrieve digests for Docker image registry/org/my-bundle'
      )
    })
    .it('Digests retrieval fails on generic error')

  test
    .env({ ENTANDO_CLI_CRANE_BIN: 'path/to/crane' })
    .it('Retrieves tags and digests using custom crane bin', async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.outputStream!.write('0.0.1\n0.0.2\n')
          return Promise.resolve(0)
        })

      const stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService([0])
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .callsFake(param => {
          const options = param as ProcessExecutionOptions[]
          expect(options[0].command).eq(
            'path/to/crane digest registry/org/my-bundle:0.0.2'
          )
          expect(options[1].command).eq(
            'path/to/crane digest registry/org/my-bundle:0.0.1'
          )
          options[0].outputStream!.write('sha256:abcd')
          options[1].outputStream!.write('sha256:1234')
          return stubParallelProcessExecutorService
        })

      const digestsExecutor = DockerService.getDigestsExecutor(
        'registry/org/my-bundle',
        ['0.0.2', '0.0.1']
      )
      const result = await digestsExecutor.getDigests()

      expect(result.size).eq(2)
      expect(result.get('0.0.2')).eq('sha256:abcd')
      expect(result.get('0.0.1')).eq('sha256:1234')
    })

  const manifestContentStub = JSON.stringify({
    layers: [{ digest: 'sha256:1234' }, { digest: 'sha256:abcd' }]
  })

  const configContentStub = JSON.stringify({
    config: { Labels: { 'org.entando.bundle-name': 'entando-bundle' } }
  })

  test.it('Parses YAML bundle descriptor from Docker image', async () => {
    sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .onFirstCall()
      .callsFake(options => {
        options.outputStream!.write(configContentStub)
        return Promise.resolve(0)
      })
      .onSecondCall()
      .callsFake(options => {
        options.outputStream!.write(manifestContentStub)
        return Promise.resolve(0)
      })
      .onThirdCall()
      .callsFake(options => {
        options.outputStream!.write(
          YAML.stringify(BundleDescriptorHelper.newYamlBundleDescriptor())
        )
        return Promise.resolve(0)
      })

    const yamlDescriptor = await DockerService.getYamlDescriptorFromImage(
      'registry/org/bundle:tag'
    )

    expect(yamlDescriptor.name).eq('test-bundle')
  })

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(1)
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain('Unable to retrieve image metadata')
    })
    .it('Retrieval of first layer digest fails if crane config command fails')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.outputStream!.write(
            JSON.stringify({
              config: { Labels: { someLabel: 'someValue' } }
            })
          )
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        "Given Docker image doesn't contain required label"
      )
    })
    .it(
      "Retrieval of first layer digest fails if config doesn't contains valid Docker label"
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.outputStream!.write(
            JSON.stringify({
              config: {}
            })
          )
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        "Given Docker image doesn't contain required label"
      )
    })
    .it(
      "Retrieval of first layer digest fails if config doesn't contains Docker labels"
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write('}invalid-json{')
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain('Retrieved manifest contains invalid JSON')
    })
    .it(
      'Retrieval of first layer digest fails if manifest contains invalid JSON'
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write('{}')
          return Promise.resolve(1)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain('Unable to retrieve image manifest')
    })
    .it('Retrieval of first layer digest fails if crane manifest command fails')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write('{}')
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to extract digest from retrieved manifest'
      )
    })
    .it('Retrieval of first layer digest fails if layer has no layers field')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(
            JSON.stringify({
              layers: []
            })
          )
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to extract digest from retrieved manifest'
      )
    })
    .it('Retrieval of first layer digest fails if manifest has zero layers')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(
            JSON.stringify({
              layers: [{}]
            })
          )
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to extract digest from retrieved manifest'
      )
    })
    .it('Retrieval of first layer digest fails if layer has no digest field')

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(manifestContentStub)
          return Promise.resolve(0)
        })
        .onThirdCall()
        .resolves(1)
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Unable to parse YAML descriptor from bundle Docker image'
      )
    })
    .it(
      'Parsing of YAML bundle descriptor from Docker image fails if crane blob command fails'
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(manifestContentStub)
          return Promise.resolve(0)
        })
        .onThirdCall()
        .callsFake(options => {
          options.errorStream!.write(
            `tar: ${BUNDLE_DESCRIPTOR_NAME}: Not found in archive`
          )
          return Promise.resolve(1)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        `${BUNDLE_DESCRIPTOR_NAME} not found. Have you specified a valid bundle Docker image?`
      )
    })
    .it(
      'Parsing of YAML bundle descriptor from Docker image fails if bundle descriptor is missing'
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(manifestContentStub)
          return Promise.resolve(0)
        })
        .onThirdCall()
        .callsFake(options => {
          options.outputStream!.write('}invalid-yaml{')
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Retrieved descriptor contains invalid YAML'
      )
    })
    .it(
      'Parsing of YAML bundle descriptor from Docker image fails if descriptor contains invalid YAML'
    )

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .onFirstCall()
        .callsFake(options => {
          options.outputStream!.write(configContentStub)
          return Promise.resolve(0)
        })
        .onSecondCall()
        .callsFake(options => {
          options.outputStream!.write(manifestContentStub)
          return Promise.resolve(0)
        })
        .onThirdCall()
        .callsFake(options => {
          options.outputStream!.write(YAML.stringify({ something: 'wrong' }))
          return Promise.resolve(0)
        })
      await DockerService.getYamlDescriptorFromImage('registry/org/bundle:tag')
    })
    .catch(error => {
      expect(error.message).contain(
        'Retrieved descriptor has an invalid format'
      )
    })
    .it(
      'Parsing of YAML bundle descriptor from Docker image fails if descriptor has invalid format'
    )
})
