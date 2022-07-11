import { expect } from '@oclif/test'
import {
  InMemoryWritable,
  ColorizedWritable,
  animatedProgress
} from '../src/utils'
import { EOL } from 'node:os'
import * as sinon from 'sinon'
describe('Utilities', () => {
  it('InMemoryWritable', () => {
    const writable = new InMemoryWritable()
    writable.write('some data\n')
    writable.write('some other data')
    expect(writable.data).eq('some data\nsome other data')
  })

  it('ColorizedWritable', () => {
    const sandbox = sinon.createSandbox()
    try {
      const prefix = 'test'
      const writable = new ColorizedWritable(prefix, prefix.length)
      const stdoutStub = sandbox.stub(process.stdout, 'write')
      const chunk1 = `first chunk `
      const chunk2 = `second chunk${EOL} other data${EOL}`
      const regExp1 = new RegExp(/^(.*test\s\|.*first chunk second chunk)/)
      const regExp2 = new RegExp(/^(.*test\s\|.*other data)/)
      writable.write(chunk1)
      writable.write(chunk2)
      sandbox.assert.calledWith(stdoutStub.firstCall, sinon.match(regExp1))
      sandbox.assert.calledWith(stdoutStub.secondCall, sinon.match(regExp2))
    } finally {
      sandbox.restore()
    }
  })

  it('Animated progress', () => {
    const progress = animatedProgress()

    const options = {
      barCompleteString: '========================================',
      barIncompleteString: '----------------------------------------',
      barsize: 40
    }
    const params = {
      progress: 0,
      startTime: Date.now() - (3600 + 20 * 60 + 12) * 1000,
      eta: 13,
      value: 6,
      total: 10
    }
    const payload: any = {}

    let output = progress.formatter(options, params, payload)
    expect(output).eq(
      'progress [----------------------------------------] 0% | ETA: 13s | 6/10 | Time: 01:20:12'
    )
    expect(payload.index).eq(1)

    params.progress = 1 / 3
    output = progress.formatter(options, params, payload)
    expect(output).eq(
      'progress [=============\\--------------------------] 33% | ETA: 13s | 6/10 | Time: 01:20:12'
    )
    expect(payload.index).eq(2)

    params.progress = 1
    output = progress.formatter(options, params, payload)
    expect(output).eq(
      'progress [========================================] 100% | ETA: 13s | 6/10 | Time: 01:20:12'
    )
  })
})
