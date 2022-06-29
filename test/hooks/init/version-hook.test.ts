import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'

describe('Version hook', () => {
  afterEach(() => {
    sinon.restore()
  })

  let exitStub: sinon.SinonStub
  test
    .stderr()
    .stdout()
    .do(() => {
      sinon
        .stub(process, 'argv')
        .value(['node', 'entando-bundle-cli', 'version'])
      exitStub = sinon.stub(process, 'exit')
    })
    .hook('init', { id: 'version' })
    .it('Displays customized version output', ctx => {
      expect(ctx.stderr).contain(ctx.config.userAgent)
      expect(ctx.stdout).contain(ctx.config.version)
      sinon.assert.calledWith(exitStub, 0)
    })
})
