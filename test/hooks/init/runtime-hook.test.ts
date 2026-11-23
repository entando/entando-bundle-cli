import { expect, test } from '@oclif/test'
import * as childProcess from 'node:child_process'
import * as sinon from 'sinon'
import {
  describeRuntime,
  isTranslatedByRosetta
} from '../../../src/hooks/init/runtime-hook'

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!

function simulatePlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform })
}

describe('Runtime hook', () => {
  afterEach(() => {
    sinon.restore()
    Object.defineProperty(process, 'platform', originalPlatform)
  })

  it('Does not check the translation outside macOS', () => {
    simulatePlatform('linux')
    const execStub = sinon.stub(childProcess, 'execFileSync')
    expect(isTranslatedByRosetta()).to.be.undefined
    expect(describeRuntime()).to.eq(
      `Node.js ${process.version} on linux/${process.arch}`
    )
    sinon.assert.notCalled(execStub)
  })

  it('Detects a process running through Rosetta 2', () => {
    simulatePlatform('darwin')
    const execStub = sinon.stub(childProcess, 'execFileSync').returns('1\n')
    expect(isTranslatedByRosetta()).to.eq(true)
    expect(describeRuntime()).to.contain('(running through Rosetta 2)')
    sinon.assert.calledWith(execStub, 'sysctl', [
      '-n',
      'sysctl.proc_translated'
    ])
  })

  it('Detects a native process on Apple Silicon', () => {
    simulatePlatform('darwin')
    sinon.stub(childProcess, 'execFileSync').returns('0\n')
    expect(isTranslatedByRosetta()).to.eq(false)
    expect(describeRuntime()).to.contain('(native)')
  })

  it('Treats an Intel Mac, where the sysctl key is missing, as native', () => {
    simulatePlatform('darwin')
    sinon.stub(childProcess, 'execFileSync').throws(new Error('unknown oid'))
    expect(isTranslatedByRosetta()).to.eq(false)
  })

  test
    .stderr()
    .env({ ENTANDO_CLI_DEBUG: 'true' })
    .hook('init', { id: 'runtime' })
    .it('Logs the runtime in debug mode', ctx => {
      expect(ctx.stderr).to.contain(`Node.js ${process.version}`)
      expect(ctx.stderr).to.contain(`${process.platform}/${process.arch}`)
    })

  test
    .stderr()
    .env({ ENTANDO_CLI_DEBUG: undefined })
    .hook('init', { id: 'runtime' })
    .it('Logs nothing outside debug mode', ctx => {
      expect(ctx.stderr).to.not.contain('Node.js')
    })
})
