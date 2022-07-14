import { expect, test } from '@oclif/test'
import { CliUx } from '@oclif/core'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY
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
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import {
  BundleThumbnailService,
  ThumbnailStatusMessage
} from '../../src/services/bundle-thumbnail-service'

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
    .exit(42)
    .it('Docker build failure forwards exit code', ctx => {
      sinon.assert.calledOnce(stubBuildBundleDockerImage)
      expect(ctx.stderr).to.contain('Docker build failed with exit code')
    })

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
    })
    .it('Docker build fails when command not found')

  test
    .stderr()
    .stdout()
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-build-no-version'
      )
      const ms1Dir = path.resolve(bundleDir, MICROSERVICES_FOLDER, 'ms1')
      const ms1Dockerfile = path.resolve(ms1Dir, DEFAULT_DOCKERFILE_NAME)
      fs.mkdirSync(ms1Dir, { recursive: true })
      fs.writeFileSync(ms1Dockerfile, '')

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
    })
    .it('Pack fails if microservices versions are too long')

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

    const ms1Dir = path.resolve(
      bundleDir,
      MICROSERVICES_FOLDER,
      stubComponents[0].name
    )
    const ms1Dockerfile = path.resolve(ms1Dir, DEFAULT_DOCKERFILE_NAME)
    fs.mkdirSync(ms1Dir, { recursive: true })
    fs.writeFileSync(ms1Dockerfile, '')

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

    sinon
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
