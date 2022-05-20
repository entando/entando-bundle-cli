import { expect, test } from '@oclif/test'
import * as cp from 'node:child_process'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'

import ProcessExecutorService from '../../src/services/process-executor-service'

class StubProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
}

class TestOutputStream extends Writable {
  data = ''
  public _write = (chunk: any, encoding: BufferEncoding, next: () => void) => {
    this.data += chunk + '\n'
    next()
  }
}

describe('ProcessExecutorService', () => {
  const outputStream = new TestOutputStream()
  const errorStream = new TestOutputStream()

  const optionsWithStream = {
    command: 'test',
    arguments: ['arg1', 'arg2'],
    outputStream: outputStream,
    errorStream: errorStream
  }

  const stubProcessWithStreams = new StubProcess()

  test
    .stub(cp, 'spawn', () => stubProcessWithStreams)
    .do(async () => {
      const promise = ProcessExecutorService.executeProcess(optionsWithStream)
      stubProcessWithStreams.stdout.emit('data', 'info message')
      stubProcessWithStreams.stderr.emit('data', 'error message')
      stubProcessWithStreams.emit('exit', 0)
      await promise
    })
    .it('Execute process forwarding streams', () => {
      expect(outputStream.data).to.eq('info message\n')
      expect(errorStream.data).to.eq('error message\n')
    })

  const options = {
    command: 'test',
    arguments: ['arg1', 'arg2']
  }

  const stubProcessWithoutStreams = new StubProcess()

  test
    .stub(cp, 'spawn', () => stubProcessWithoutStreams)
    .do(async () => {
      const promise = ProcessExecutorService.executeProcess(options)
      stubProcessWithoutStreams.stdout.emit('data', 'info message')
      stubProcessWithoutStreams.stderr.emit('data', 'error message')
      stubProcessWithoutStreams.emit('exit', 0)
      await promise
    })
    .it('Execute process ignoring streams')

  const stubProcessExitWithError = new StubProcess()

  test
    .stub(cp, 'spawn', () => stubProcessExitWithError)
    .do(async () => {
      const promise = ProcessExecutorService.executeProcess(options)
      stubProcessExitWithError.emit('exit', 1)
      await promise
    })
    .catch(error => {
      expect(error.message).to.contain('Command exited with code 1')
    })
    .it(
      'Reject promise if child process exits with status code different than 0'
    )

  const stubProcessFailure = new StubProcess()

  test
    .stub(cp, 'spawn', () => stubProcessFailure)
    .do(async () => {
      const promise = ProcessExecutorService.executeProcess(options)
      stubProcessFailure.emit('error', 'command not found')
      await promise
    })
    .catch(error => {
      expect(error.message).to.contain('command not found')
    })
    .it('Reject promise if error event is emitted by spawn')
})
