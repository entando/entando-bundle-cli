import * as sinon from 'sinon'
import * as fs from 'node:fs'

export function existsSyncMock(pattern: string, result: boolean): void {
  const existsSyncStub = sinon.stub(fs, 'existsSync')

  existsSyncStub.callsFake(filePath => {
    if (new RegExp(pattern).test(filePath.toString())) {
      return result
    }

    return existsSyncStub.wrappedMethod.apply(fs, [filePath])
  })
}
