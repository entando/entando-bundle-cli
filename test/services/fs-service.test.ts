import { CLIError } from '@oclif/errors'
import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import FSService from '../../src/services/fs-service'

describe('init', () => {
  let tmpDir: string
  const defaultBundleName = 'fs-mi'

  before(() => {
    // creating a temporary directory
    tmpDir = path.resolve(os.tmpdir(), 'bundle-cli-init-test')
    fs.mkdirSync(tmpDir)

    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tmpDir, 'existing-bundle'))
  })

  beforeEach(() => {
    // setting the temporary directory as current working directory
    process.chdir(tmpDir)
  })

  afterEach(() => {
    if (fs.existsSync(path.resolve(tmpDir, defaultBundleName))) {
      fs.rmSync(path.resolve(tmpDir, defaultBundleName), { recursive: true, force: true })
    }
  })

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .it('run checkBundleName', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      expect(() => filesys.checkBundleName()).to.not.throw(CLIError)
    })

  test
    .it('run checkBundleName but has error', () => {
      const filesys = new FSService('124!@', tmpDir)
      expect(() => filesys.checkBundleName()).to.throw(CLIError)
    })

  test
    .it('run checkBundleDirectory', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      expect(() => filesys.checkBundleDirectory()).to.not.throw(CLIError)
    })

  test
    .it('run checkBundleDirectory but has error', () => {
      const filesys = new FSService('existing-bundle', tmpDir)
      expect(() => filesys.checkBundleDirectory()).to.throw(CLIError)
    })

  test
    .it('run getBundleDirectory', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      expect(filesys.getBundleDirectory()).to.eq(path.resolve(tmpDir, defaultBundleName))
    })

  test
    .it('run getBundleFilePath', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      expect(filesys.getBundleFilePath('a', 'b')).to.eq(path.resolve(tmpDir, defaultBundleName, 'a', 'b'))
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, defaultBundleName))
    })
    .it('run createFileFromTemplate', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      filesys.createFileFromTemplate(['Dockerfile'], 'Dockerfile-template')
      const filePath = path.resolve(tmpDir, defaultBundleName, 'Dockerfile')
      expect(fs.existsSync(filePath)).to.eq(true)
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, defaultBundleName))
    })
    .it('run createSubDirectoryIfNotExist', () => {
      const filesys = new FSService(defaultBundleName, tmpDir)
      filesys.createSubDirectoryIfNotExist('wowo')
      const filePath = path.resolve(tmpDir, defaultBundleName, 'wowo')
      expect(fs.existsSync(filePath)).to.eq(true)
    })
})
