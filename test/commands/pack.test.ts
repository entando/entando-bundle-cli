import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../../src/services/config-service'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { ComponentService } from '../../src/services/component-service'
import {
  DEFAULT_DOCKERFILE_NAME,
  DockerService
} from '../../src/services/docker-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as sinon from 'sinon'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack
} from '../../src/models/component'
import { ProcessExecutionResult } from '../../src/services/process-executor-service'
import * as executors from '../../src/services/process-executor-service'
import * as path from 'node:path'
import * as fs from 'node:fs'
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER
} from '../../src/paths'
import { ComponentDescriptorService } from '../../src/services/component-descriptor-service'
import {
  createFakeSpawn,
  getStubProcess,
  StubParallelProcessExecutorService
} from '../helpers/mocks/stub-process'
import {
  BundleThumbnailService,
  ThumbnailStatusMessage
} from '../../src/services/bundle-thumbnail-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import { ApiType, MicroFrontendType } from '../../src/models/bundle-descriptor'
import * as cp from 'node:child_process'
import { CLIError } from '@oclif/errors'

describe('pack', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    stubGenerateYamlDescriptors = sinon.stub(
      BundleDescriptorConverterService.prototype,
      'generateYamlDescriptors'
    )
    stubBuildBundleDockerImage = sinon
      .stub(DockerService, 'buildBundleDockerImage')
      .resolves(0)
    stubGetBundleDockerfile = sinon
      .stub(DockerService, 'getBundleDockerfile')
      .returns('path/to/Dockerfile')

    stubProcessThumbnail = sinon.stub(
      BundleThumbnailService.prototype,
      'processThumbnail'
    )

    stubGetThumbInfo = sinon
      .stub(BundleThumbnailService.prototype, 'getThumbnailInfo')
      .returns({
        path: '',
        size: 0,
        status: ThumbnailStatusMessage.NO_THUMBNAIL,
        base64: ''
      })
  })

  let stubGetBundleDockerfile: sinon.SinonStub
  let stubBuildBundleDockerImage: sinon.SinonStub
  let stubGenerateYamlDescriptors: sinon.SinonStub
  let stubProcessThumbnail: sinon.SinonStub
  let stubGetThumbInfo: sinon.SinonStub

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-prompt'
      )
      setupBuildSuccess(bundleDir)
    })
    .stub(CliUx.ux, 'prompt', () =>
      sinon.stub().resolves('prompted-organization')
    )
    .stub(
      BundleThumbnailService.prototype,
      'getThumbnailInfo',
      sinon.stub().returns({
        path: 'thumbnail.png',
        size: 47,
        status: ThumbnailStatusMessage.OK,
        base64: 'hello'
      })
    )
    .command(['pack'])
    .it('runs pack asking the organization', ctx => {
      const configService = new ConfigService()
      expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
        'prompted-organization'
      )
      sinon.assert.called(getComponentsStub)
      sinon.assert.calledOnce(stubGenerateYamlDescriptors)
      sinon.assert.calledOnce(stubBuildBundleDockerImage)
      sinon.assert.calledOnce(stubProcessThumbnail)
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
    })

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-existing-org'
      )
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
      setupBuildSuccess(bundleDir)
    })
    .stub(
      BundleThumbnailService.prototype,
      'getThumbnailInfo',
      sinon.stub().returns({
        path: 'thumbnail.png',
        size: 110,
        status: ThumbnailStatusMessage.FILESIZE_EXCEEDED,
        base64: 'i am a big thumbnail'
      })
    )
    .command(['pack'])
    .it('runs pack using the organization stored in config file', ctx => {
      const configService = new ConfigService()
      expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
        'configured-organization'
      )
      sinon.assert.called(getComponentsStub)
      sinon.assert.calledOnce(stubGenerateYamlDescriptors)
      sinon.assert.calledOnce(stubBuildBundleDockerImage)
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
    })

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-no-existing-conf'
      )
      setupBuildSuccess(bundleDir)
    })
    .command(['pack', '--org', 'flag-organization'])
    .it(
      'runs pack --org flag-organization without existing configuration',
      ctx => {
        const configService = new ConfigService()
        sinon.assert.called(getComponentsStub)
        expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
          'flag-organization'
        )
        sinon.assert.called(stubGetThumbInfo)
        expect(ctx.stderr).contain('2/2') // components build
        expect(ctx.stderr).contain('1/1') // docker images build
      }
    )

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-pack-max-parallel'
      )
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
      setupBuildSuccess(bundleDir)
    })
    .command(['pack', '--max-parallel', '1'])
    .it('runs pack with --max-parallel flag', ctx => {
      sinon.assert.calledWith(
        parallelProcessExecutorServiceStub,
        sinon.match.any,
        sinon.match(1)
      )
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
    })

  let addOrUpdatePropertyStub: sinon.SinonStub
  let setImagesRegistryStub: sinon.SinonStub

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-org-and-registry'
      )
      sinon.stub(ConfigService.prototype, 'getProperty')
      addOrUpdatePropertyStub = sinon.stub(
        ConfigService.prototype,
        'addOrUpdateProperty'
      )
      setImagesRegistryStub = sinon.stub(DockerService, 'setImagesRegistry')
      setupBuildSuccess(bundleDir)
    })
    .command(['pack', '--org', 'my-org', '--registry', 'my-registry'])
    .it('runs pack with --registry flag', ctx => {
      sinon.assert.calledWith(
        addOrUpdatePropertyStub,
        sinon.match(DOCKER_ORGANIZATION_PROPERTY),
        sinon.match('my-org')
      )
      sinon.assert.calledWith(
        addOrUpdatePropertyStub,
        sinon.match(DOCKER_REGISTRY_PROPERTY),
        sinon.match('my-registry')
      )
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
      sinon.assert.called(setImagesRegistryStub)
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-pack-max-parallel-invalid')
    })
    .command(['pack', '--max-parallel', '0'])
    .catch(error => {
      expect(error.message).to.contain(
        'Value of flag --max-parallel should be greater than 0'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('pack with invalid --max-parallel flag')

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-pack-stdout'
      )
      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        }
      ]

      createMicroserviceDockerfile(bundleDir, 'ms1')

      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot,
          version: '0.0.3'
        }
      ])

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)

      sinon
        .stub(cp, 'spawn')
        .onFirstCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess1 = getStubProcess()
            setTimeout(() => {
              stubProcess1.stdout!.emit('data', 'build message\n')
              stubProcess1.emit('exit', 0, null)
            })
            return stubProcess1
          })
        )
        .onSecondCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess2 = getStubProcess()
            setTimeout(() => {
              stubProcess2.stdout!.emit('data', 'pack message\n')
              stubProcess2.emit('exit', 0, null)
            })
            return stubProcess2
          })
        )
    })
    .command(['pack', '--org', 'flag-organization', '--stdout'])
    .it('runs pack --org flag-organization --stdout', ctx => {
      sinon.assert.called(stubGetThumbInfo)
      expect(ctx.stdout).contain('Building ms1 components')
      expect(ctx.stdout).match(/ms1 |.*build message/)
      expect(ctx.stdout).contain('Building microservices Docker images')
      expect(ctx.stdout).match(/ms1 |.*pack message/)
      expect(ctx.stdout).contain('Creating bundle package')
      // progressbar is disabled when logging directly to stdout
      expect(ctx.stderr).not.contain('2/2')
      expect(ctx.stderr).not.contain('1/1')
    })

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-with-existing-conf'
      )
      const configService = new ConfigService()
      configService.addProperty(
        DOCKER_ORGANIZATION_PROPERTY,
        'configured-organization'
      )
      setupBuildSuccess(bundleDir)
    })
    .command(['pack', '--org', 'flag-organization'])
    .it(
      'runs pack --org flag-organization with existing configuration',
      ctx => {
        const configService = new ConfigService()
        sinon.assert.called(getComponentsStub)
        expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
          'flag-organization'
        )
        expect(ctx.stderr).contain('2/2') // components build
        expect(ctx.stderr).contain('1/1') // docker images build
      }
    )

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-org-flag-custom-dockerfile'
      )
      setupBuildSuccess(bundleDir)
      stubGetBundleDockerfile.restore()
      stubGetBundleDockerfile = sinon
        .stub(DockerService, 'getBundleDockerfile')
        .returns('custom-Dockerfile')
    })
    .command([
      'pack',
      '--org',
      'flag-organization',
      '--file',
      'custom-Dockerfile'
    ])
    .it('runs pack using custom Dockerfile', ctx => {
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
      const buildDockerImageStub =
        DockerService.buildBundleDockerImage as sinon.SinonStub
      sinon.assert.calledOnceWithMatch(
        buildDockerImageStub,
        sinon.match.any,
        'flag-organization',
        'custom-Dockerfile'
      )
    })

  let getComponentsStub: sinon.SinonStub

  test
    .stderr()
    .stdout()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-build-errors')

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        },
        {
          name: 'ms2',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.Node
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
      stubComponentsForBuildError(stubComponents)

      stubParallelProcessExecutorService([
        0,
        1,
        'SIGKILL' as NodeJS.Signals,
        new Error('command not found')
      ])
    })
    .command(['pack'])
    .catch(error => {
      expect(error.message).to.contain('components failed to build')
      sinon.assert.calledThrice(getComponentsStub)
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Build failure stops package command', ctx => {
      expect(ctx.stderr).contain('4/4') // components build
    })

  test
    .stderr()
    .stdout()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-docker-build-fails')
      stubBuildBundleDockerImage.restore()
      stubBuildBundleDockerImage = sinon
        .stub(DockerService, 'buildBundleDockerImage')
        .resolves(42)
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      sinon.assert.calledOnce(stubBuildBundleDockerImage)
      expect(error.message).to.contain('Docker build failed with exit code')
      expect((error as CLIError).oclif.exit).eq(42)
    })
    .it('Docker build failure forwards exit code')

  test
    .stderr()
    .stdout()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-docker-not-found')
      stubBuildBundleDockerImage.restore()
      stubBuildBundleDockerImage = sinon
        .stub(DockerService, 'buildBundleDockerImage')
        .resolves(new Error('command not found'))
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      sinon.assert.calledOnce(stubBuildBundleDockerImage)
      expect(error.message).to.contain('Docker build failed with cause')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Docker build fails when command not found')

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-build-no-version'
      )
      createMicroserviceDockerfile(bundleDir, 'ms1')

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        }
      ]
      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).to.contain(
        'Unable to determine version for component ms1'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Packaging stops if it is unable to retrieve component version')

  test
    .stderr()
    .stdout()
    .stub(
      ComponentDescriptorService.prototype,
      'getComponentVersion',
      () => '0.0.1'
    )
    .do(() => {
      tempDirHelper.createInitializedBundleDir(
        'test-bundle-build-no-dockerfile'
      )

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        }
      ]
      stubComponentsForBuildError(stubComponents)

      stubParallelProcessExecutorService([0])
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).to.contain(
        'Dockerfile not found for microservice ms1'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it(
      "Packaging stops if a microservice folder doesn't contain a Dockerfile",
      ctx => {
        expect(ctx.stderr).contain('1/1') // components build
      }
    )

  test
    .stdout()
    .stderr()
    .do(() => {
      const bundleDir =
        tempDirHelper.createInitializedBundleDir('test-bundle-psc')

      const groupsFolder = path.join(bundleDir, PSC_FOLDER, 'groups')
      fs.mkdirSync(groupsFolder)
      fs.writeFileSync(path.join(groupsFolder, 'groups.yml'), '')

      const invalidFolder = path.join(bundleDir, PSC_FOLDER, 'invalid')
      fs.mkdirSync(invalidFolder)
    })
    .command(['pack', '--org', 'flag-organization'])
    .it('Packs bundle with PSC', ctx => {
      const copiedFile = path.join(
        ...DESCRIPTORS_OUTPUT_FOLDER,
        'groups',
        'groups.yml'
      )
      expect(fs.existsSync(copiedFile)).true
      expect(ctx.stderr).contain(
        `Following files in ${PSC_FOLDER} are not valid`
      )
      sinon.assert.calledOnce(stubGenerateYamlDescriptors)
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-widget-conflict'
      )

      const widgetsFolder = path.join(bundleDir, PSC_FOLDER, 'widgets')
      fs.mkdirSync(widgetsFolder)
      fs.writeFileSync(path.join(widgetsFolder, 'hello-widget.yaml'), '')

      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microservices = []
      bundleDescriptor.microfrontends = [
        {
          name: 'hello-widget',
          customElement: 'hello-widget',
          stack: MicroFrontendStack.Angular,
          type: MicroFrontendType.Widget,
          titles: {},
          group: 'free'
        }
      ]

      stubGenerateYamlDescriptors.restore()

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)

      sinon.stub(ComponentService.prototype, 'getComponents').returns([
        {
          name: 'hello-widget',
          type: ComponentType.MICROFRONTEND,
          stack: MicroFrontendStack.Angular
        }
      ])

      sinon
        .stub(ComponentService.prototype, 'getVersionedComponents')
        .returns([])

      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(new StubParallelProcessExecutorService([0]))
        .onSecondCall()
        .returns(new StubParallelProcessExecutorService([]))
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).contain(
        'Widget descriptor hello-widget.yaml already exists'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Pack fails if widget in platform folder has the same name of a MFE')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-invalid-version')
      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          name: 'invalid-ms',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot,
          version: 'invalid version'
        }
      ])
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).contain('Version of invalid-ms is not valid')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Pack fails if microservices versions have an invalid format')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-invalid-version')
      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          name: 'invalid-ms',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot,
          version: 'x'.repeat(500)
        }
      ])
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).contain('Version of invalid-ms is too long')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Pack fails if microservices versions are too long')

  let stubGetDockerImagesExecutorService: sinon.SinonStub

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-skip-docker-build')

      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        }
      ]

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)

      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          ...stubComponents[0],
          version: '0.0.1'
        }
      ])

      parallelProcessExecutorServiceStub = sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(new StubParallelProcessExecutorService([0]))

      stubGetDockerImagesExecutorService = sinon.stub(
        DockerService,
        'getDockerImagesExecutorService'
      )
    })
    .command(['pack', '--org', 'flag-organization', '--skip-docker-build'])
    .it('pack --skip-docker-build', ctx => {
      expect(ctx.stderr).contain('1/1')
      expect(ctx.stderr).contain('Docker image build has been skipped')
      sinon.assert.notCalled(stubGetDockerImagesExecutorService)
      sinon.assert.notCalled(stubBuildBundleDockerImage)
    })

  function stubComponentsForBuildError(
    stubComponents: Array<Component<ComponentType>>
  ) {
    getComponentsStub = sinon
      .stub(ComponentService.prototype, 'getComponents')
      .returns(stubComponents)

    const versionedMicroservices = stubComponents
      .filter(c => c.type === ComponentType.MICROSERVICE)
      .map(c => {
        return {
          ...c,
          version: '0.0.3'
        }
      })

    sinon
      .stub(ComponentService.prototype, 'getVersionedComponents')
      .returns(versionedMicroservices)
  }

  test
    .stderr()
    .stdout()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-pack-fail-fast')
      const stubComponents = [
        {
          name: 'mfe1',
          type: ComponentType.MICROFRONTEND,
          stack: MicroFrontendStack.React
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

      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          ...stubComponents[0],
          version: '0.0.1'
        },
        {
          ...stubComponents[1],
          version: '0.0.1'
        }
      ])

      sinon
        .stub(cp, 'spawn')
        .onFirstCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess1 = getStubProcess()
            setTimeout(() => {
              stubProcess1.emit('exit', 1, null)
            })
            return stubProcess1
          })
        )
        .onSecondCall()
        .returns(getStubProcess())
    })
    .command([
      'pack',
      '--org',
      'flag-organization',
      '--max-parallel',
      '1',
      '--fail-fast'
    ])
    .catch(error => {
      console.log(error.message)
      expect(error.message).to.contain(
        'The following components failed to build'
      )
      expect(error.message).to.contain('mfe1: Process exited with code 1')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('pack --fail-fast fails during MFE build', ctx => {
      expect(ctx.stderr).to.contain('1/2')
    })

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-pack-fail-fast-docker'
      )
      const stubComponents = [
        {
          name: 'ms1',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        },
        {
          name: 'ms2',
          type: ComponentType.MICROSERVICE,
          stack: MicroserviceStack.SpringBoot
        }
      ]
      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(stubComponents)

      sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
        {
          ...stubComponents[0],
          version: '0.0.1'
        },
        {
          ...stubComponents[1],
          version: '0.0.1'
        }
      ])

      createMicroserviceDockerfile(bundleDir, stubComponents[0].name)
      createMicroserviceDockerfile(bundleDir, stubComponents[1].name)

      sinon
        .stub(cp, 'spawn')
        .onFirstCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess1 = getStubProcess()
            setTimeout(() => {
              stubProcess1.emit('exit', 0, null)
            })
            return stubProcess1
          })
        )
        .onSecondCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess2 = getStubProcess()
            setTimeout(() => {
              stubProcess2.emit('exit', 0, null)
            })
            return stubProcess2
          })
        )
        .onThirdCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess3 = getStubProcess()
            setTimeout(() => {
              stubProcess3.emit('exit', null, 'SIGKILL' as NodeJS.Signals)
            })
            return stubProcess3
          })
        )
        .onCall(3)
        .returns(getStubProcess())
    })
    .command([
      'pack',
      '--org',
      'flag-organization',
      '--max-parallel',
      '1',
      '--fail-fast'
    ])
    .catch(error => {
      expect(error.message).to.contain(
        'The following components failed to build'
      )
      expect(error.message).to.contain('ms1: Process killed by signal SIGKILL')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('pack --fail-fast fails during Docker image build', ctx => {
      expect(ctx.stderr).to.contain('2/2') // build
      expect(ctx.stderr).to.contain('1/2') // pack
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-with-invalid-claim'
      )

      const widgetsFolder = path.join(bundleDir, PSC_FOLDER, 'widgets')
      fs.mkdirSync(widgetsFolder)
      fs.writeFileSync(path.join(widgetsFolder, 'hello-widget.yaml'), '')

      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      bundleDescriptor.microservices = []
      bundleDescriptor.microfrontends = [
        {
          name: 'hello-widget',
          customElement: 'hello-widget',
          stack: MicroFrontendStack.Angular,
          type: MicroFrontendType.Widget,
          apiClaims: [
            {
              name: 'claim',
              type: ApiType.External,
              serviceName: 'simple-ms',
              bundle: 'registry/org/bundle-name'
            }
          ],
          titles: {},
          group: 'free'
        }
      ]

      stubGenerateYamlDescriptors.restore()

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)

      sinon.stub(DockerService, 'listTags').resolves(['1.0.0', '2.0.0'])
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .throws(
          new CLIError("Given Docker image doesn't contain required label")
        )
    })
    .command(['pack', '--org', 'flag-organization'])
    .catch(error => {
      expect(error.message).contain(
        "Given Docker image doesn't contain required label"
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Pack fails if api claim is not valid')

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-with-skip-api-claim-validation'
      )
      setupBuildSuccess(bundleDir)
    })
    .command(['pack', '--org', 'flag-organization', '--skip-claims-validation'])
    .it('runs pack --org flag-organization --skip-claims-validation', ctx => {
      const configService = new ConfigService()
      sinon.assert.called(getComponentsStub)
      expect(configService.getProperty(DOCKER_ORGANIZATION_PROPERTY)).to.eq(
        'flag-organization'
      )
      sinon.assert.called(stubGetThumbInfo)
      expect(ctx.stderr).contain('Api Claims validation has been skipped')
      expect(ctx.stderr).contain('2/2') // components build
      expect(ctx.stderr).contain('1/1') // docker images build
    })
  let parallelProcessExecutorServiceStub: sinon.SinonStub

  function setupBuildSuccess(bundleDir: string) {
    const stubComponents = [
      {
        name: 'ms1',
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.SpringBoot
      },
      {
        name: 'mfe2',
        type: ComponentType.MICROFRONTEND,
        stack: MicroFrontendStack.React
      }
    ]

    createMicroserviceDockerfile(bundleDir, stubComponents[0].name)

    sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
      {
        name: 'ms1',
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.SpringBoot,
        version: '0.0.3'
      }
    ])

    getComponentsStub = sinon
      .stub(ComponentService.prototype, 'getComponents')
      .returns(stubComponents)
      .onCall(3)
      .returns(
        stubComponents.filter(c => c.type === ComponentType.MICROSERVICE)
      )

    parallelProcessExecutorServiceStub = sinon
      .stub(executors, 'ParallelProcessExecutorService')
      .onFirstCall()
      .returns(new StubParallelProcessExecutorService([0, 0]))
      .onSecondCall()
      .returns(new StubParallelProcessExecutorService([0]))
  }

  function stubParallelProcessExecutorService(
    stubResults: ProcessExecutionResult[]
  ) {
    sinon
      .stub(executors, 'ParallelProcessExecutorService')
      .returns(new StubParallelProcessExecutorService(stubResults))
  }
})

function createMicroserviceDockerfile(
  bundleDir: string,
  microserviceName: string
) {
  const ms1Dir = path.resolve(bundleDir, MICROSERVICES_FOLDER, microserviceName)
  const ms1Dockerfile = path.resolve(ms1Dir, DEFAULT_DOCKERFILE_NAME)
  fs.mkdirSync(ms1Dir, { recursive: true })
  fs.writeFileSync(ms1Dockerfile, '')
}
