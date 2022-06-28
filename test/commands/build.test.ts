import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { MICROSERVICES_FOLDER } from '../../src/paths'
import {
  ProcessExecutionResult,
  ProcessExecutorService
} from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import { Component, ComponentType } from '../../src/models/component'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import * as executors from '../../src/services/process-executor-service'
import {
  msSpringBoot,
  mfeReact,
  msListSpringBoot,
  mfeListReact,
  msNameSpringBoot,
  mfeNameReact
} from '../helpers/mocks/commands/build-mocks'
import { LOGS_FOLDER, OUTPUT_FOLDER } from '../../src/paths'

describe('build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)

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
      tempDirHelper.createInitializedBundleDir('test-build-command')
    })
    .command(['build', '--all-ms', '--all-mfe'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
    })
    .it('build command with multiple flags should return an error')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
    })
    .command(['build', '--all-ms', 'my-component'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
    })
    .it('build command with flag and name arg should return an error')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
    })
    .command(['build'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
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
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')

      TempDirHelper.createComponentFolder(mfeReact)

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
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

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

  let bundleDir: string

  test
    .do(() => {
      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-mfe'
      )
      TempDirHelper.createComponentsFolders(mfeListReact)
      fs.rmdirSync(path.resolve(bundleDir, ...OUTPUT_FOLDER), {
        recursive: true
      })
      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(mfeListReact)

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .stderr()
    .command(['build', '--all-mfe'])
    .it('build all react microfrontends', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('2/2')
      expect(fs.existsSync(path.resolve(bundleDir, ...LOGS_FOLDER))).to.eq(true)
      expect(fs.existsSync(path.resolve(bundleDir, ...OUTPUT_FOLDER))).to.eq(
        false
      )
    })

  const componentList: Array<Component<ComponentType>> = [
    ...msListSpringBoot,
    ...mfeListReact
  ]

  test
    .do(() => {
      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-all'
      )
      TempDirHelper.createComponentsFolders(componentList)

      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(componentList)

      fs.mkdirSync(path.resolve(bundleDir, ...LOGS_FOLDER), {
        recursive: true
      })

      fs.mkdirSync(path.resolve(bundleDir, ...OUTPUT_FOLDER), {
        recursive: true
      })

      const stubResults: ProcessExecutionResult[] = [0, 0, 0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .stderr()
    .command(['build', '--all'])
    .it('build all componenents', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('4/4')
      expect(fs.existsSync(path.resolve(bundleDir, ...LOGS_FOLDER))).to.eq(true)
      expect(fs.existsSync(path.resolve(bundleDir, ...OUTPUT_FOLDER))).to.eq(
        false
      )
    })
})
