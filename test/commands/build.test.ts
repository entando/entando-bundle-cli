import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROFRONTENDS_FOLDER, MICROSERVICES_FOLDER } from '../../src/paths'
import {
  ProcessExecutionResult,
  ProcessExecutorService
} from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroServiceStack
} from '../../src/models/component'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import * as executors from '../../src/services/process-executor-service'

describe('build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const msNameSpringBoot = 'test-ms-spring-boot'
  const mfeNameReact = 'test-mfe-react'
  const msNameNotImplementedStack = 'test-ms-not-implemented-stack'
  const mfeNameNotImplementedStack = 'test-mfe-not-implemented-stack'

  const msSpringBoot: Component<ComponentType> = {
    name: msNameSpringBoot,
    stack: MicroServiceStack.SpringBoot,
    type: ComponentType.MICROSERVICE
  }

  const msNotImplementedStack: any = {
    name: msNameNotImplementedStack,
    stack: 'not-implemented',
    type: ComponentType.MICROSERVICE
  }

  const mfeReact: Component<ComponentType.MICROFRONTEND> = {
    name: mfeNameReact,
    stack: MicroFrontendStack.React,
    type: ComponentType.MICROFRONTEND
  }

  const mfeNotImplementedStack: any = {
    name: mfeNameNotImplementedStack,
    stack: 'not-implemented',
    type: ComponentType.MICROFRONTEND
  }

  const notValidComponent: any = {
    name: mfeNameReact,
    stack: MicroFrontendStack.React,
    type: 'not-valid'
  }

  const msListSpringBoot: Array<Component<ComponentType>> = [
    {
      name: 'test-ms-spring-boot-1',
      stack: MicroServiceStack.SpringBoot,
      type: ComponentType.MICROSERVICE
    },
    {
      name: 'test-ms-spring-boot-2',
      stack: MicroServiceStack.SpringBoot,
      type: ComponentType.MICROSERVICE
    }
  ]

  let executeProcessStub: sinon.SinonStub

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['build', 'test-ms-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('build spring-boot microservice folder not exists')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
    })
    .command(['build'])
    .catch(error => {
      expect(error.message).to.contain(
        'Build failed, missing required arg name'
      )
    })
    .it('build with missing required arg name ')

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-ms'
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msNameSpringBoot),
        { recursive: true }
      )
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['build', msNameSpringBoot])
    .it('build spring-boot microservice', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn test'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msNotImplementedStack)
    })
    .command(['build', msNameNotImplementedStack])
    .catch(error => {
      expect(error.message).to.contain('has an invalid stack')
    })
    .it('build microservice with not implemented build stack')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-nv')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(notValidComponent)
    })
    .command(['build', msNameNotImplementedStack])
    .catch(error => {
      expect(error.message).to.contain('Invalid component type')
    })
    .it('build component with not valid type')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', msNameSpringBoot])
    .exit(5)
    .it('build spring-boot microservice exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', msNameSpringBoot])
    .exit(1)
    .it('build spring-boot microservice exits with code 1')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['build', 'test-mfe-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('build react micro frontend folder not exists')

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-mfe'
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROFRONTENDS_FOLDER, mfeNameReact),
        { recursive: true }
      )
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['build', mfeNameReact])
    .it('build react micro frontend', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'npm install && npm run build'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(mfeNotImplementedStack)
    })
    .command(['build', mfeNameNotImplementedStack])
    .catch(error => {
      expect(error.message).to.contain('has an invalid stack')
    })
    .it('build micro frontend with not implemented build stack')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', mfeNameReact])
    .exit(5)
    .it('build react micro frontend exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', mfeNameReact])
    .exit(1)
    .it('build react micro frontend exits with code 1')

  let getComponentsStub: sinon.SinonStub
  let stubParallelProcessExecutorService: StubParallelProcessExecutorService

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-ms'
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msListSpringBoot[0].name),
        { recursive: true }
      )
      fs.mkdirSync(
        path.resolve(bundleDir, MICROSERVICES_FOLDER, msListSpringBoot[1].name)
      )
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .stderr()
    .command(['build', '--all-ms'])
    .it('build all spring-boot microservices', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('2/2')
    })
})
