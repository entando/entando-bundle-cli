import { expect, test } from '@oclif/test'
import * as cp from 'node:child_process'
import { Writable } from 'node:stream'
import * as sinon from 'sinon'
import { InMemoryWritable } from '../../src/utils'

import {
  ProcessExecutorService,
  ParallelProcessExecutorService,
  buildChildEnvironment
} from '../../src/services/process-executor-service'
import { getStubProcess } from '../helpers/mocks/stub-process'
import { FakeStream } from '../helpers/mocks/fake-stream'

const CMD_NOT_FOUND_ERROR = new Error('Command not found')
const SIGKILL: NodeJS.Signals = 'SIGKILL'

describe('ProcessExecutorService', () => {
  afterEach(() => {
    sinon.restore()
  })

  const outputStream = new InMemoryWritable()
  const errorStream = new InMemoryWritable()

  const optionsWithStream = {
    command: 'test',
    outputStream: outputStream,
    errorStream: errorStream
  }

  test
    .do(async () => {
      const stubProcess = getStubProcess()
      sinon.stub(cp, 'spawn').returns(stubProcess)
      const promise = ProcessExecutorService.executeProcess(optionsWithStream)
      stubProcess.stdout!.emit('data', 'info message\n')
      stubProcess.stderr!.emit('data', 'error message\n')
      stubProcess.emit('exit', 0, null)
      await promise
    })
    .it('Execute process forwarding streams', () => {
      expect(outputStream.data).to.eq('info message\n')
      expect(errorStream.data).to.eq('error message\n')
    })

  const options = {
    command: 'test'
  }

  test
    .do(async () => {
      const stubProcess = getStubProcess()
      sinon.stub(cp, 'spawn').returns(stubProcess)
      const promise = ProcessExecutorService.executeProcess(options)
      stubProcess.stdout!.emit('data', 'info message')
      stubProcess.stderr!.emit('data', 'error message')
      stubProcess.emit('exit', 0, null)
      await promise
    })
    .it('Execute process ignoring streams')

  test.it('Promise returns process exit status code', async () => {
    const stubProcess = getStubProcess()
    sinon.stub(cp, 'spawn').returns(stubProcess)
    const promise = ProcessExecutorService.executeProcess(options)
    stubProcess.emit('exit', 1, null)
    const result = await promise
    expect(result).to.equal(1)
  })

  test.it('Promise returns signal that killed the process', async () => {
    const stubProcess = getStubProcess()
    sinon.stub(cp, 'spawn').returns(stubProcess)
    const promise = ProcessExecutorService.executeProcess(options)
    stubProcess.emit('exit', null, SIGKILL)
    const result = await promise
    expect(result).to.equal(SIGKILL)
  })

  test.it('Promise returns error that prevented process to start', async () => {
    const stubProcess = getStubProcess()
    sinon.stub(cp, 'spawn').returns(stubProcess)
    const promise = ProcessExecutorService.executeProcess(options)
    stubProcess.emit('error', CMD_NOT_FOUND_ERROR)
    const result = await promise
    expect(result).to.equal(CMD_NOT_FOUND_ERROR)
  })

  test
    .do(async () => {
      const fakeStream = new FakeStream()
      const endStub = sinon.stub(fakeStream, 'end')

      const parallelProcessesOptions = [
        { command: 'cmd1' },
        { command: 'cmd2' },
        { command: 'cmd3' },
        { command: 'cmd4' },
        { command: 'cmd5', outputStream: fakeStream }
      ]

      const stubProcess1 = getStubProcess()
      const stubProcess2 = getStubProcess()
      const stubProcess3 = getStubProcess()
      const stubProcess4 = getStubProcess()
      const stubProcess5 = getStubProcess()

      sinon
        .stub(cp, 'spawn')
        .onCall(0)
        .returns(stubProcess1)
        .onCall(1)
        .returns(stubProcess2)
        .onCall(2)
        .returns(stubProcess3)
        .onCall(3)
        .returns(stubProcess4)
        .onCall(4)
        .returns(stubProcess5)

      const parallelExecutor = new ParallelProcessExecutorService(
        parallelProcessesOptions
      )
      const promise = parallelExecutor.execute()

      stubProcess1.emit('exit', 0, null)
      stubProcess2.emit('exit', 1, null)
      stubProcess3.emit('exit', null, SIGKILL)
      stubProcess4.emit('error', CMD_NOT_FOUND_ERROR)
      stubProcess5.emit('exit', 0, null)
      stubProcess5.emit('close', 0, null)

      const results = await promise

      expect(results.length).to.equal(5)
      expect(results[0]).to.equal(0)
      expect(results[1]).to.equal(1)
      expect(results[2]).to.equal(SIGKILL)
      expect(results[3]).to.eql(CMD_NOT_FOUND_ERROR)

      sinon.assert.calledOnce(endStub)
    })
    .it('Executes multiple processes in parallel')

  test
    .do(async () => {
      const parallelExecutor = new ParallelProcessExecutorService([])
      const results = await parallelExecutor.execute()
      expect(results.length).to.equal(0)
    })
    .it(
      'ParallelProcessExecutorService returns immediately if empty array is passed'
    )

  test.it(
    'Stream options are ignored if spwaned process has no streams',
    async () => {
      const stubProcess = getStubProcess()
      stubProcess.stdout = null
      stubProcess.stderr = null
      sinon.stub(cp, 'spawn').returns(stubProcess)
      const promise = ProcessExecutorService.executeProcess(options)
      stubProcess.emit('exit', 0, null)
      await promise
    }
  )

  test.it('Writes to child process stdin', async () => {
    const stubProcess = getStubProcess()
    sinon.stub(cp, 'spawn').returns(stubProcess)
    const testWritable = new InMemoryWritable()
    stubProcess.stdin = testWritable
    const promise = ProcessExecutorService.executeProcess({
      command: 'test',
      stdinWriter: (stdin: Writable) => {
        stdin.write('this is written to stdin')
        stdin.end()
      }
    })
    stubProcess.emit('exit', 0, null)
    await promise
    expect(testWritable.data).eq('this is written to stdin')
  })

  test.it('Terminate on non-zero exit code with failFast option', async () => {
    const parallelProcessesOptions = [{ command: 'cmd1' }, { command: 'cmd2' }]

    const stubProcess1 = getStubProcess()
    const stubProcess2 = getStubProcess()

    sinon
      .stub(cp, 'spawn')
      .onFirstCall()
      .returns(stubProcess1)
      .onSecondCall()
      .returns(stubProcess2)

    const parallelExecutor = new ParallelProcessExecutorService(
      parallelProcessesOptions,
      1,
      true
    )
    const promise = parallelExecutor.execute()

    stubProcess1.emit('exit', 1, null)

    const results = await promise

    expect(results.length).to.equal(1)
    expect(results[0]).to.equal(1)
  })

  test.it('Terminate on error with failFast option', async () => {
    const parallelProcessesOptions = [{ command: 'cmd1' }, { command: 'cmd2' }]

    const stubProcess1 = getStubProcess()
    const stubProcess2 = getStubProcess()

    sinon
      .stub(cp, 'spawn')
      .onFirstCall()
      .returns(stubProcess1)
      .onSecondCall()
      .returns(stubProcess2)

    const parallelExecutor = new ParallelProcessExecutorService(
      parallelProcessesOptions,
      1,
      true
    )
    const promise = parallelExecutor.execute()

    const error = new Error('spawn error')
    stubProcess1.emit('error', error)

    const results = await promise

    expect(results.length).to.equal(1)
    expect(results[0]).to.equal(error)
  })
})

describe('buildChildEnvironment', () => {
  const HIDE_VAR = 'ENTANDO_CLI_HIDE_PRIVATE_NODEJS'
  let originalHideValue: string | undefined

  beforeEach(() => {
    originalHideValue = process.env[HIDE_VAR]
  })

  afterEach(() => {
    if (originalHideValue === undefined) {
      delete process.env[HIDE_VAR]
    } else {
      process.env[HIDE_VAR] = originalHideValue
    }

    sinon.restore()
  })

  it('Keeps the parent variables and filters only the private nodejs from PATH', () => {
    const env = buildChildEnvironment(
      {
        command: 'test',
        env: {
          SystemRoot: 'C:\\Windows',
          APPDATA: 'C:\\Users\\x\\AppData\\Roaming',
          USERPROFILE: 'C:\\Users\\x',
          TEMP: 'C:\\Temp',
          PATH: '/opt/private-node/bin:/usr/bin'
        }
      },
      true,
      '/opt/private-node'
    )

    expect(env).to.deep.equal({
      SystemRoot: 'C:\\Windows',
      APPDATA: 'C:\\Users\\x\\AppData\\Roaming',
      USERPROFILE: 'C:\\Users\\x',
      TEMP: 'C:\\Temp',
      PATH: '/usr/bin'
    })
  })

  it('Inherits process.env when options.env is not provided', () => {
    const env = buildChildEnvironment({ command: 'test' }, true, '/opt/private')
    const nonPathKeys = Object.keys(process.env).filter(
      k => k.toUpperCase() !== 'PATH'
    )
    expect(nonPathKeys.length).to.be.greaterThan(0)
    for (const key of nonPathKeys) {
      expect(env![key]).to.equal(process.env[key])
    }
  })

  it('Replaces a Windows-style "Path" key with a single filtered PATH key', () => {
    const env = buildChildEnvironment(
      {
        command: 'test',
        env: { Path: 'C:\\priv\\bin;C:\\Windows', SystemRoot: 'C:\\Windows' }
      },
      true,
      'C:\\priv'
    )

    const pathKeys = Object.keys(env!).filter(k => k.toUpperCase() === 'PATH')
    expect(pathKeys).to.deep.equal(['PATH'])
    expect(env!.PATH).to.equal('C:\\Windows')
    expect(env!.SystemRoot).to.equal('C:\\Windows')
  })

  it('Removes a Git Bash style entry of a Windows private nodejs', () => {
    const env = buildChildEnvironment(
      {
        command: 'test',
        env: {
          PATH: '/c/Users/x/.entando/node/bin:/usr/bin:/c/Users/x/.entando/node'
        }
      },
      true,
      '/c/Users/x/.entando/node'
    )

    expect(env!.PATH).to.equal('/usr/bin')
  })

  it('Returns options.env untouched when the private nodejs must not be hidden', () => {
    const optionsEnv = { PATH: '/opt/private-node/bin:/usr/bin' }
    expect(
      buildChildEnvironment(
        { command: 'test', env: optionsEnv },
        false,
        '/opt/private-node'
      )
    ).to.equal(optionsEnv)
    expect(
      buildChildEnvironment({ command: 'test' }, false, '/opt/private-node')
    ).to.equal(undefined)
  })

  it('Reads ENTANDO_CLI_HIDE_PRIVATE_NODEJS at call time', () => {
    process.env[HIDE_VAR] = 'false'
    expect(buildChildEnvironment({ command: 'test' })).to.equal(undefined)
    process.env[HIDE_VAR] = 'true'
    expect(buildChildEnvironment({ command: 'test' })).to.not.equal(undefined)
  })

  it('Spawns the child process with the full parent environment', async () => {
    process.env[HIDE_VAR] = 'true'
    const stubProcess = getStubProcess()
    const spawnStub = sinon.stub(cp, 'spawn').returns(stubProcess)

    const promise = ProcessExecutorService.executeProcess({ command: 'test' })
    stubProcess.emit('exit', 0, null)
    await promise

    const spawnEnv = (spawnStub.firstCall.args[1] as cp.SpawnOptions).env!
    const nonPathKeys = Object.keys(process.env).filter(
      k => k.toUpperCase() !== 'PATH'
    )
    expect(nonPathKeys.length).to.be.greaterThan(0)
    for (const key of nonPathKeys) {
      expect(spawnEnv[key]).to.equal(process.env[key])
    }

    expect(spawnEnv.PATH).to.not.equal(undefined)
  })
})
