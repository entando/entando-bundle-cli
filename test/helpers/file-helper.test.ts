import { expect } from 'chai'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import { FileHelper } from '../../src/helpers/file-helper'

describe('file-helper', () => {
  let tmpFilePath: string

  before(() => {
    tmpFilePath = path.resolve(os.tmpdir(), 'file-helper-test')
  })

  afterEach(() => {
    fs.rmSync(tmpFilePath, { force: true })
  })

  it('writeJSON writes JSON data to file', () => {
    const filePath = path.resolve(os.tmpdir(), tmpFilePath)
    const data = { test: 'testvalue' }
    FileHelper.writeJSON(filePath, data)

    const result = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    expect(result).to.eql(data)
  })
})
