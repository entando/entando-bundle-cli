import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import {
  CONFIG_FOLDER,
  CONFIG_FILE,
  BUNDLE_DESCRIPTOR_FILE_NAME
} from '../../src/paths'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import { InitializerService } from '../../src/services/initializer-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { GitService } from '../../src/services/git-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { FSService } from '../../src/services/fs-service'

describe('git-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const defaultBundleName = 'git-mi'
  let bundleDir: string
  let git: GitService

  beforeEach(() => {
    git = new GitService(defaultBundleName, tempDirHelper.tmpDir)
  })

  afterEach(() => {
    fs.rmSync(bundleDir, {
      recursive: true,
      force: true
    })
    sinon.restore()
  })

  test.it('runs initRepo ', async () => {
    const executeProcessStub = sinon
      .stub(ProcessExecutorService, 'executeProcess')
      .resolves(0)
    await git.initRepo()
    bundleDir = FSService.toPosix(
      path.join(tempDirHelper.tmpDir, defaultBundleName)
    )
    sinon.assert.calledWith(
      executeProcessStub,
      sinon.match({
        command: `git -C '${bundleDir}' init`
      })
    )
  })

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.errorStream!.write('git init error')
          return Promise.resolve(1)
        })
      await git.initRepo()
    })
    .catch(error => {
      expect(error.message).to.contain('git init error')
    })
    .it('runs initRepo but throws error', () => {
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves('SIGKILL')
      await git.initRepo()
    })
    .catch(error => {
      expect(error.message).to.contain('Enable debug mode')
    })
    .it('runs initRepo but throws error that needs debug')

  test
    .do(async () => {
      const init = new InitializerService({
        name: defaultBundleName,
        parentDirectory: tempDirHelper.tmpDir,
        version: '0.0.1'
      })
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves(0)
      await init.performBundleInit()
    })
    .it('runs cloneRepo', async () => {
      await git.cloneRepo('https://aabbbccc.com/asd.git')
      checkFoldersStructure(defaultBundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(defaultBundleName)
      expect(bundleDescriptor.name).to.eq(defaultBundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
    })

  test
    .do(async () => {
      sinon
        .stub(ProcessExecutorService, 'executeProcess')
        .callsFake(options => {
          options.errorStream!.write('git clone error')
          return Promise.resolve(1)
        })
      await git.cloneRepo('https://aabbbccc.com/asd.git')
    })
    .catch(error => {
      expect(error.message).to.contain('git clone error')
    })
    .it('runs cloneRepo but throws error')

  test
    .do(async () => {
      sinon.stub(ProcessExecutorService, 'executeProcess').resolves('SIGKILL')
      await git.cloneRepo('https://aabbbccc.com/asd.git')
    })
    .catch(error => {
      expect(error.message).to.contain('Enable debug mode')
    })
    .it('runs cloneRepo but throws error that needs debug')

  test
    .do(() => {
      bundleDir = tempDirHelper.createInitializedBundleDir(defaultBundleName)
      const gitFilePath = path.join(bundleDir, '.git')
      fs.mkdirSync(gitFilePath)
      expect(fs.existsSync(gitFilePath)).to.eq(true)
      git.degit()
      expect(fs.existsSync(gitFilePath)).to.eq(false)
    })
    .it('runs degit')

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, CONFIG_FOLDER)
    checkBundleFile(bundleName, CONFIG_FOLDER, CONFIG_FILE)
    checkBundleFile(bundleName, BUNDLE_DESCRIPTOR_FILE_NAME)
    checkBundleFile(bundleName, 'microservices')
    checkBundleFile(bundleName, 'microfrontends')
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
