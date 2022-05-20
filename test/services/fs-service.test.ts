import { CLIError } from '@oclif/errors'
import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import FSService from '../../src/services/fs-service'
import TempDirHelper from '../helpers/temp-dir-helper'

describe('init', () => {
  const tempDirHelper = new TempDirHelper('bundle-cli-init-test')
  const defaultBundleName = 'fs-mi'

  before(() => {
    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, 'existing-bundle'))
  })

  afterEach(() => {
    if (fs.existsSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))) {
      fs.rmSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName), {
        recursive: true,
        force: true
      })
    }
  })

  test.it('run checkBundleName', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(() => filesys.checkBundleName()).to.not.throw(CLIError)
  })

  test.it('run checkBundleName but has error', () => {
    const filesys = new FSService('124!@', tempDirHelper.tmpDir)
    expect(() => filesys.checkBundleName()).to.throw(CLIError)
  })

  test.it('run checkBundleDirectory', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(() => filesys.checkBundleDirectory()).to.not.throw(CLIError)
  })

  test.it('run checkBundleDirectory but has error', () => {
    const filesys = new FSService('existing-bundle', tempDirHelper.tmpDir)
    expect(() => filesys.checkBundleDirectory()).to.throw(CLIError)
  })

  test.it('run getBundleDirectory', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(filesys.getBundleDirectory()).to.eq(
      path.resolve(tempDirHelper.tmpDir, defaultBundleName)
    )
  })

  test.it('run getBundleFilePath', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(filesys.getBundleFilePath('a', 'b')).to.eq(
      path.resolve(tempDirHelper.tmpDir, defaultBundleName, 'a', 'b')
    )
  })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))
    })
    .it('run createFileFromTemplate', () => {
      const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
      filesys.createFileFromTemplate(['Dockerfile'], 'Dockerfile-template')
      const filePath = path.resolve(
        tempDirHelper.tmpDir,
        defaultBundleName,
        'Dockerfile'
      )
      expect(fs.existsSync(filePath)).to.eq(true)
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))
    })
    .it('run createSubDirectoryIfNotExist', () => {
      const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
      filesys.createSubDirectoryIfNotExist('wowo')
      const filePath = path.resolve(
        tempDirHelper.tmpDir,
        defaultBundleName,
        'wowo'
      )
      expect(fs.existsSync(filePath)).to.eq(true)
    })
})
