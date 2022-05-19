import { CLIError } from '@oclif/errors'
import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import FSService, { ServiceParams } from '../../src/services/fs-service'

describe('init', () => {
  let tmpDir: string
  let serviceParams: ServiceParams

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
    serviceParams = { name: 'fs-mi', parentDirectory: tmpDir }
  })

  afterEach(() => {
    if (fs.existsSync(path.resolve(tmpDir, serviceParams.name))) {
      fs.rmSync(path.resolve(tmpDir, serviceParams.name), { recursive: true, force: true })
    }
  })

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .it('run checkBundleName', () => {
      const filesys = new FSService(serviceParams)
      expect(() => filesys.checkBundleName()).to.not.throw(CLIError)
    })

  test
    .it('run checkBundleName but has error', () => {
      const filesys = new FSService({ ...serviceParams, name: '124!@' })
      expect(() => filesys.checkBundleName()).to.throw(CLIError)
    })

  test
    .it('run checkBundleDirectory', () => {
      const filesys = new FSService(serviceParams)
      expect(() => filesys.checkBundleDirectory()).to.not.throw(CLIError)
    })

  test
    .it('run checkBundleDirectory but has error', () => {
      const filesys = new FSService({ ...serviceParams, name: 'existing-bundle' })
      expect(() => filesys.checkBundleDirectory()).to.throw(CLIError)
    })

  test
    .it('run getBundleDirectory', () => {
      const filesys = new FSService(serviceParams)
      expect(filesys.getBundleDirectory()).to.eq(path.resolve(tmpDir, serviceParams.name))
    })

  test
    .it('run getBundleFilePath', () => {
      const filesys = new FSService(serviceParams)
      expect(filesys.getBundleFilePath('a', 'b')).to.eq(path.resolve(tmpDir, serviceParams.name, 'a', 'b'))
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, serviceParams.name))
    })
    .it('run createFileFromTemplate', () => {
      const filesys = new FSService(serviceParams)
      filesys.createFileFromTemplate(['Dockerfile'], 'Dockerfile-template')
      const filePath = path.resolve(tmpDir, serviceParams.name, 'Dockerfile')
      expect(fs.existsSync(filePath)).to.eq(true)
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, serviceParams.name))
    })
    .it('run createSubDirectoryIfNotExist', () => {
      const filesys = new FSService(serviceParams)
      filesys.createSubDirectoryIfNotExist('wowo')
      const filePath = path.resolve(tmpDir, serviceParams.name, 'wowo')
      expect(fs.existsSync(filePath)).to.eq(true)
    })
})
