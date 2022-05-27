import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
} from '../../src/services/config-service'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { ComponentService } from '../../src/services/component-service'
import { DockerService } from '../../src/services/docker-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'
import {
  ComponentType,
  MicroFrontendStack,
  MicroServiceStack
} from '../../src/models/component'
import {
  ParallelProcessExecutorService,
  ProcessExecutionResult
} from '../../src/services/process-executor-service'
import * as executors from '../../src/services/process-executor-service'

describe('package', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    // setting process.stdout.isTTY value here because it is different when tests
    // are executed with npm run test or inside husky git hooks
    process.stdout.isTTY = true

    stubGenerateYamlDescriptors = sinon.stub(
      BundleDescriptorConverterService.prototype,
      'generateYamlDescriptors'
    )
    stubBuildDockerImage = sinon
      .stub(DockerService, 'buildDockerImage')
      .resolves(0)
  })

  let stubBuildDockerImage: sinon.SinonStub
  let stubGenerateYamlDescriptors: sinon.SinonStub

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-org-prompt')
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
    .stub(CliUx.ux, 'prompt', () =>
      sinon.stub().resolves('prompted-organization')
    )
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
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
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
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
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
    .do(() => {
      tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-with-existing-conf'
      )
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
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

  let getComponentsStub: sinon.SinonStub

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-build-errors')

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroServiceStack.SpringBoot
        },
        {
          name: 'ms2',
          type: ComponentType.MICROSERVICE,
          stack: MicroServiceStack.Node
        },
        {
          name: 'mfe1',
          type: ComponentType.MICROFRONTEND,
          stack: MicroFrontendStack.Angular
        },
        {
          name: 'mfe2',
          type: ComponentType.MICROFRONTEND,
          stack: MicroFrontendStack.React
        }
      ]
      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)

      const stubResults: ProcessExecutionResult[] = [
        0,
        1,
        'SIGKILL' as NodeJS.Signals,
        new Error('command not found')
      ]
      const stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(true))
    .command(['package'])
    .catch(error => {
      expect(error.message).to.contain('components failed to build')
      sinon.assert.calledOnce(getComponentsStub)
    })
    .it('Build failure stops package command')

  test
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-docker-build-fails')
      stubBuildDockerImage.restore()
      stubBuildDockerImage = sinon
        .stub(DockerService, 'buildDockerImage')
        .resolves(42)
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
    .command(['package', '--org', 'flag-organization'])
    .exit(42)
    .it('Docker build failure forwards exit code', ctx => {
      sinon.assert.calledOnce(stubBuildDockerImage)
      expect(ctx.stderr).to.contain('Docker build failed with exit code')
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-docker-not-found')
      stubBuildDockerImage.restore()
      stubBuildDockerImage = sinon
        .stub(DockerService, 'buildDockerImage')
        .resolves(new Error('command not found'))
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
    .command(['package', '--org', 'flag-organization'])
    .catch(error => {
      sinon.assert.calledOnce(stubBuildDockerImage)
      expect(error.message).to.contain('Docker build failed with cause')
    })
    .it('Docker build fails when command not found')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-build-success')

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroServiceStack.SpringBoot
        },
        {
          name: 'mfe2',
          type: ComponentType.MICROFRONTEND,
          stack: MicroFrontendStack.React
        }
      ]
      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)

      const stubResults: ProcessExecutionResult[] = [0, 0]
      const stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)

      process.stdout.isTTY = false
    })
    .command(['package', '--org', 'flag-organization'])
    .it(
      'Build successfully and completes packaging, in non-TTY mode it builds by default',
      () => {
        sinon.assert.called(getComponentsStub)
        sinon.assert.calledOnce(stubGenerateYamlDescriptors)
        sinon.assert.calledOnce(stubBuildDockerImage)
      }
    )
})

class StubParallelProcessExecutorService extends ParallelProcessExecutorService {
  private readonly stubResults: ProcessExecutionResult[]

  constructor(stubResults: ProcessExecutionResult[]) {
    super([])
    this.stubResults = stubResults
  }

  public async execute(): Promise<ProcessExecutionResult[]> {
    for (const [i, result] of this.stubResults.entries()) {
      this.emit('done', i, result)
    }

    return this.stubResults
  }
}
