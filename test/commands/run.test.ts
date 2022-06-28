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
import {
  msSpringBoot,
  mfeReact,
  msNameSpringBoot,
  mfeNameReact,
  msListSpringBoot,
  mfeListReact
} from '../helpers/mocks/commands/build-mocks'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import * as executors from '../../src/services/process-executor-service'

describe('run command', () => {
  const BAD_ARGS_ERR =
    'Bad arguments. Please use the component name as argument or one of the available flags'
  const tempDirHelper = new TempDirHelper(__filename)
  let executeProcessStub: sinon.SinonStub

  afterEach(function () {
    sinon.restore()
  })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-ms')
      sinon
        .stub(ComponentService.prototype, 'getComponent')
        .returns(msSpringBoot)
    })
    .command(['run', 'test-ms-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('run spring-boot microservice folder not exists')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command')
    })
    .command(['run', '--all-ms', 'my-component'])
    .catch(error => {
      expect(error.message).to.contain(BAD_ARGS_ERR)
    })
    .it('run command with flag and name arg should return an error')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command')
    })
    .command(['run', '--all-mfe', 'my-component'])
    .catch(error => {
      expect(error.message).to.contain(BAD_ARGS_ERR)
    })
    .it('run command with flag and name arg should return an error')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command')
    })
    .command(['run', '--all-ms', '--all-mfe'])
    .catch(error => {
      expect(error.message).to.contain(BAD_ARGS_ERR)
    })
    .it('run command with multiple flags should return an error')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command')
    })
    .command(['run'])
    .catch(error => {
      expect(error.message).to.contain(BAD_ARGS_ERR)
    })
    .it('run with missing required arg name')

  test
    .do(() => {
      const bundleDir = tempDirHelper.createInitializedBundleDir(
        'test-run-command-ms'
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
    .command(['run', msNameSpringBoot])
    .it('run spring-boot microservice', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'mvn spring-boot:run'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-ms')
      sinon.stub(ComponentService.prototype, 'run').resolves(5)
    })
    .command(['run', msNameSpringBoot])
    .exit(5)
    .it('run spring-boot microservice exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-ms')
      sinon
        .stub(ComponentService.prototype, 'run')
        .resolves(new Error('Command not found'))
    })
    .command(['run', msNameSpringBoot])
    .exit(1)
    .it('run spring-boot microservice exits with code 1')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-mfe')
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['run', 'test-mfe-not-found'])
    .catch(error => {
      expect(error.message).to.contain('not exists')
    })
    .it('run react micro frontend folder not exists')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-mfe')

      TempDirHelper.createComponentFolder(mfeReact)

      executeProcessStub = sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .resolves(0)
      sinon.stub(ComponentService.prototype, 'getComponent').returns(mfeReact)
    })
    .command(['run', mfeNameReact])
    .it('run react micro frontend', async () => {
      sinon.assert.calledWith(
        executeProcessStub,
        sinon.match({
          command: 'npm install && npm start'
        })
      )
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-mfe')
      sinon.stub(ComponentService.prototype, 'run').resolves(5)
    })
    .command(['run', mfeNameReact])
    .exit(5)
    .it('run react micro frontend exits with code 5')

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-mfe')
      sinon
        .stub(ComponentService.prototype, 'run')
        .resolves(new Error('Command not found'))
    })
    .command(['run', mfeNameReact])
    .exit(1)
    .it('run react micro frontend exits with code 1')

  let getComponentsStub: sinon.SinonStub
  let stubParallelProcessExecutorService: StubParallelProcessExecutorService
  let parallelExecutorStub: sinon.SinonStub

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-ms')

      TempDirHelper.createComponentsFolders(msListSpringBoot)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(msListSpringBoot)

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)

      parallelExecutorStub = sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .command(['run', '--all-ms'])
    .it('run all spring-boot microservices', async () => {
      sinon.assert.called(getComponentsStub)
      sinon.assert.calledWith(parallelExecutorStub, [
        sinon.match({
          command: 'mvn spring-boot:run',
          outputStream: {
            prefix: 'test-ms-spring-boot-1 |'
          }
        }),
        sinon.match({
          command: 'mvn spring-boot:run',
          outputStream: {
            prefix: 'test-ms-spring-boot-2 |'
          }
        })
      ])
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-run-command-mfe')

      TempDirHelper.createComponentsFolders(mfeListReact)

      getComponentsStub = sinon
        .stub(ComponentService.prototype, 'getComponents')
        .returns(mfeListReact)

      const stubResults: ProcessExecutionResult[] = [0, 0]

      stubParallelProcessExecutorService =
        new StubParallelProcessExecutorService(stubResults)

      parallelExecutorStub = sinon
        .stub(executors, 'ParallelProcessExecutorService')
        .returns(stubParallelProcessExecutorService)
    })
    .command(['run', '--all-mfe'])
    .it('run all react micro frontends', async () => {
      sinon.assert.called(getComponentsStub)
      sinon.assert.calledWith(parallelExecutorStub, [
        sinon.match({
          command: 'npm install && npm start',
          outputStream: {
            prefix: 'test-mfe-react-1 |'
          }
        }),
        sinon.match({
          command: 'npm install && npm start',
          outputStream: {
            prefix: 'test-mfe-react-2 |'
          }
        })
      ])
    })
})
