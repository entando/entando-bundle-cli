import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  ProcessExecutionResult,
  ProcessExecutorService
} from '../../src/services/process-executor-service'
import { ComponentService } from '../../src/services/component-service'
import { Component, ComponentType } from '../../src/models/component'
import {
  createFakeSpawn,
  getStubProcess,
  StubParallelProcessExecutorService
} from '../helpers/mocks/stub-process'
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
import * as cp from 'node:child_process'
import { CLIError } from '@oclif/errors'

describe('build command', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  let executeProcessStub: sinon.SinonStub

  afterEach(function () {
    sinon.restore()
  })

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['build', 'test-ms-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build spring-boot microservice folder not exists')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
    })
    .command(['build', '--all-ms', '--all-mfe'])
    .catch(error => {
      expect(error.message).to.contain(
        '--all-mfe= cannot also be provided when using --all-ms='
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build command with multiple flags should return an error')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command')
    })
    .command(['build', '--all-ms', 'my-component'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build command with flag and name arg should return an error')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
    })
    .command(['build'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build with missing required arg name')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir(
        'test-build-command-stdout-no-args'
      )
    })
    .command(['build', '--stdout'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bad arguments. Please use the component name as argument or one of the available flags'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it(
      'build command with --stdout flag and without args should return an error'
    )

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      TempDirHelper.createComponentFolder(msSpringBoot)

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
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', msNameSpringBoot])
    .exit(5)
    .it('build spring-boot microservice exits with code 5')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', msNameSpringBoot])
    .exit(2)
    .it('build spring-boot microservice exits with code 2')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['build', 'test-mfe-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build react micro frontend folder not exists')

  test
    .stdout()
    .stderr()
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
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon.stub(ComponentService.prototype, 'build').resolves(5)
    })
    .command(['build', mfeNameReact])
    .exit(5)
    .it('build react micro frontend exits with code 5')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-mfe')
      sinon
        .stub(ComponentService.prototype, 'build')
        .resolves(new Error('Command not found'))
    })
    .command(['build', mfeNameReact])
    .exit(2)
    .it('build react micro frontend exits with code 2')

  let getComponentsStub: sinon.SinonStub
  let stubParallelProcessExecutorService: StubParallelProcessExecutorService

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

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
    .command(['build', '--all-ms'])
    .it('build all spring-boot microservices', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('2/2')
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-exit-code')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      const stubResults: ProcessExecutionResult[] = [1, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .command(['build', '--all-ms'])
    .exit(2)
    .it('build all with errors should exit with code 2')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-ms-stdout')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      sinon
        .stub(cp, 'spawn')
        .onFirstCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess1 = getStubProcess()
            setTimeout(() => {
              stubProcess1.stdout!.emit('data', 'info message 1\n')
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
              stubProcess2.stdout!.emit('data', 'info message 2\n')
              stubProcess2.emit('exit', 0, null)
            })
            return stubProcess2
          })
        )
    })
    .command(['build', '--all-ms', '--stdout'])
    .it('build all spring-boot microservices logging to stdout', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stdout).matches(/test-ms-spring-boot-1|.*info message1/)
      expect(ctx.stdout).matches(/test-ms-spring-boot-2|.*info message2/)
      // progressbar is disabled when logging directly to stdout
      expect(ctx.stderr).not.contain('2/2')
    })

  let bundleDir: string

  test
    .stdout()
    .stderr()
    .do(() => {
      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-mfe'
      )
      TempDirHelper.createComponentsFolders(mfeListReact)
      fs.rmdirSync(path.resolve(bundleDir, ...OUTPUT_FOLDER), {
        recursive: true
      })

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
    .command(['build', '--all-mfe'])
    .it('build all react microfrontends', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('2/2')
      expect(fs.existsSync(path.resolve(bundleDir, ...LOGS_FOLDER))).to.eq(true)
      expect(fs.existsSync(path.resolve(bundleDir, ...OUTPUT_FOLDER))).to.eq(
        false
      )
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      const componentList: Array<Component<ComponentType>> = [
        ...msListSpringBoot,
        ...mfeListReact
      ]

      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-all'
      )
      TempDirHelper.createComponentsFolders(componentList)

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
    .command(['build', '--all'])
    .it('build all componenents', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('4/4')
      expect(fs.existsSync(path.resolve(bundleDir, ...LOGS_FOLDER))).to.eq(true)
      expect(fs.existsSync(path.resolve(bundleDir, ...OUTPUT_FOLDER))).to.eq(
        false
      )
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      const componentList: Array<Component<ComponentType>> = [
        ...msListSpringBoot,
        ...mfeListReact
      ]

      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-command-multiple'
      )
      TempDirHelper.createComponentsFolders(componentList)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(componentList)

      fs.mkdirSync(path.resolve(bundleDir, ...LOGS_FOLDER), {
        recursive: true
      })

      fs.mkdirSync(path.resolve(bundleDir, ...OUTPUT_FOLDER), {
        recursive: true
      })

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .command(['build', 'test-ms-spring-boot-1', 'test-mfe-react-1'])
    .it('build multiple componenents', async ctx => {
      sinon.assert.called(getComponentsStub)
      expect(ctx.stderr).contain('2/2')
      expect(fs.existsSync(path.resolve(bundleDir, ...LOGS_FOLDER))).to.eq(true)
      expect(fs.existsSync(path.resolve(bundleDir, ...OUTPUT_FOLDER))).to.eq(
        false
      )
    })

  let parallelProcessExecutorServiceStub: sinon.SinonStub

  test
    .stdout()
    .stderr()
    .do(() => {
      bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-build-max-parallel'
      )
      TempDirHelper.createComponentsFolders(msListSpringBoot)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)
      parallelProcessExecutorServiceStub = sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .command(['build', '--all', '--max-parallel', '1'])
    .it('build all componenents using --max-parallel flag', async ctx => {
      sinon.assert.calledWith(
        parallelProcessExecutorServiceStub,
        sinon.match.any,
        sinon.match(1)
      )
      expect(ctx.stderr).contain('2/2')
    })

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir(
        'test-build-max-parallel-invalid'
      )
    })
    .command(['build', '--all', '--max-parallel', '0'])
    .catch(error => {
      expect(error.message).to.contain(
        'Value of flag --max-parallel should be greater than 0'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('build with invalid --max-parallel flag')

  test
    .stderr()
    .stdout()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-build-command-fail-fast')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      sinon
        .stub(cp, 'spawn')
        .onFirstCall()
        .callsFake(
          createFakeSpawn(() => {
            const stubProcess1 = getStubProcess()
            setTimeout(() => stubProcess1.emit('exit', 1, null))
            return stubProcess1
          })
        )
        .onSecondCall()
        .returns(getStubProcess())
    })
    .command(['build', '--all', '--fail-fast'])
    .catch(error => {
      expect(error.message).contain('The following components failed to build')
      expect(error.message).contain(
        'test-ms-spring-boot-1: Process exited with code 1'
      )
    })
    .it('build --all --fail-fast', async ctx => {
      expect(ctx.stderr).contain('1/2')
    })
})
