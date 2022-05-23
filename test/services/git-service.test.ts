import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import * as cp from 'node:child_process'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import InitializerService from '../../src/services/initializer-service'
import BundleDescriptorService from '../../src/services/bundle-descriptor-service'
import { GitService } from '../../src/services/git-service'
import TempDirHelper from '../helpers/temp-dir-helper'

describe('git-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const defaultBundleName = 'git-mi'
  let git: GitService

  beforeEach(() => {
    fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))
    git = new GitService(defaultBundleName, tempDirHelper.tmpDir)
  })

  afterEach(() => {
    fs.rmSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName), {
      recursive: true,
      force: true
    })
  })

  test.it('runs initRepo ', () => {
    git.initRepo()

    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      defaultBundleName,
      '.git'
    )
    expect(fs.existsSync(filePath)).to.eq(true)
  })

  test
    .stderr()
    .stub(cp, 'execSync', sinon.stub().throws(new Error('git init error')))
    .do(() => {
      git.initRepo()
    })
    .catch(error => {
      expect(error.message).to.contain('git init error')
    })
    .it('runs initRepo but throws error', () => {
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)
    })

  test
    .stub(cp, 'execSync', sinon.stub().returns('Initialized git cmd'))
    .do(async () => {
      fs.rmSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName), {
        recursive: true,
        force: true
      })
      const init = new InitializerService({
        name: defaultBundleName,
        parentDirectory: tempDirHelper.tmpDir,
        version: '0.0.1'
      })
      await init.performBundleInit()
    })
    .it('runs cloneRepo', () => {
      git.cloneRepo('https://aabbbccc.com/asd.git')
      checkFoldersStructure(defaultBundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(defaultBundleName)
      expect(bundleDescriptor.name).to.eq(defaultBundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
    })

  test
    .stderr()
    .stub(cp, 'execSync', sinon.stub().throws(new Error('git clone error')))
    .do(() => {
      git.cloneRepo('https://aabbbccc.com/asd.git')
    })
    .catch(error => {
      expect(error.message).to.contain('git clone error')
    })
    .it('runs cloneRepo but throws error')

  test
    .do(() => {
      git.initRepo()
      git.degit()
    })
    .it('runs degit', () => {
      const filePath = path.resolve(
        tempDirHelper.tmpDir,
        defaultBundleName,
        '.git'
      )
      expect(fs.existsSync(filePath)).to.eq(false)
    })

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, '.ent')
    checkBundleFile(bundleName, '.ent', 'config.json')
    checkBundleFile(bundleName, 'entando.json')
    checkBundleFile(bundleName, 'microservices')
    checkBundleFile(bundleName, 'microfrontends')
    checkBundleFile(bundleName, 'Dockerfile')
    checkBundleFile(bundleName, '.gitignore')
  }

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  }

  function parseBundleDescriptor(bundleName: string): BundleDescriptor {
    return new BundleDescriptorService(
      path.resolve(tempDirHelper.tmpDir, bundleName)
    ).getBundleDescriptor()
  }
})
