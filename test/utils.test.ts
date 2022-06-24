import { expect } from '@oclif/test'
import { InMemoryWritable, OutputColorWritable } from '../src/utils'
import { EOL } from 'node:os'
import * as sinon from 'sinon'
describe('Utilities', () => {
  it('InMemoryWritable', () => {
    const writable = new InMemoryWritable()
    writable.write('some data\n')
    writable.write('some other data')
    expect(writable.data).eq('some data\nsome other data')
  })

  it('OutputColorWritable', () => {
    const sandbox = sinon.createSandbox()
    const prefix = 'test'
    const writable = new OutputColorWritable(prefix, prefix.length)
    const stdoutStub = sandbox.stub(process.stdout, 'write')
    const chunk1 = `first chunk `
    const chunk2 = `second chunk${EOL} other data${EOL}`
    const regExp1 = new RegExp(/^(.+test\s\|.+first chunk second chunk)/)
    const regExp2 = new RegExp(/^(.+test\s\|.+other data)/)
    writable.write(chunk1)
    writable.write(chunk2)
    sandbox.assert.calledWith(stdoutStub.firstCall, sandbox.match(regExp1))
    sandbox.assert.calledWith(stdoutStub.secondCall, sandbox.match(regExp2))
    sandbox.restore()
  })
})
