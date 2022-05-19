import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import InitializerService from '../../src/services/initializer-service'
import BundleDescriptorService from '../../src/services/bundle-descriptor-service'
import * as cp from 'node:child_process'
import { GitService } from '../../src/services/git-service'
import FSService from '../../src/services/fs-service'

const demoBundle = {
  bundleGroupName: "Test germano 1",
  bundleName: "germano1",
  gitSrcRepoAddress: "https://github.com/germano/mysrcrepo2.git",
  bundleGroupVersionId: 51,
  bundleGroupId: 49,
  bundleId: 51,
}

const demoBundleGroupList = [
  {
    bundleGroupName: "Test germano 1",
    bundleGroupVersionId: 51,
  },
  {
    bundleGroupName: "Test germano wowow",
    bundleGroupVersionId: 52,
  },
]

const domainmock = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io'
const uri = '/ent/api/templates/bundlegroups'

describe('init', () => {
  let tmpDir: string

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

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .stub(cp, 'execSync', sinon.stub().returns('Initialized git repo'))
    .command(['init', 'bundle-with-version', '--version=0.0.2'])
    .it('runs init bundle-with-version --version=0.0.2', () => {
      const bundleName = 'bundle-with-version'

      checkFoldersStructure(bundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.2')
    })

  test
    .stub(cp, 'execSync', sinon.stub().returns('Initialized git repo'))
    .command(['init', 'bundle-no-version'])
    .it('runs init bundle-no-version', () => {
      const bundleName = 'bundle-no-version'

      checkFoldersStructure(bundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
    })

  test
    .stub(inquirer, 'prompt', sinon.stub().resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle }))
    .nock(domainmock, api => api
      .get(uri)
      .reply(200, demoBundleGroupList)
      .get(`${uri}/51`)
      .reply(200, [demoBundle])
    )
    .stub(cp, 'execSync', sinon.stub().returns('Initialized git cmd'))
    .do(async () => {
      const servparams = { name: 'bundle-with-fromhub', parentDirectory: process.cwd() };
      const filesys = new FSService(servparams)
      const init = new InitializerService(
        { name: 'bundle-with-fromhub', version: '0.0.1', parentDirectory: process.cwd() },
        { git: new GitService(servparams, filesys), filesys },
      )
      await init.performScaffolding()
      fs.rmSync(path.resolve(process.cwd(), 'bundle-with-fromhub/microservices'), { recursive: true, force: true })
    })
    .command(['init', 'bundle-with-fromhub', '--version=0.0.1', '--from-hub'])
    .it('runs init --from-hub', () => {
      const bundleName = 'bundle-with-fromhub'

      checkFoldersStructure(bundleName)
      expect((cp.execSync as sinon.SinonStub).called).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
    })

  test
    .stderr()
    .command(['init'])
    .catch(error => {
      expect(error.message).to.contain('required')
    })
    .it('validates required argument')

  test
    .stderr()
    .command(['init', 'existing-bundle'])
    .catch(error => {
      expect(error.message).to.contain('existing-bundle already exists')
    })
    .it('exits if bundle folder already exists')

  test
    .stderr()
    .command(['init', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid bundle name')
    })
    .it('validates bundle name')

  test
    .stderr()
    .stub(
      fs,
      'accessSync',
      sinon.stub().throws({ stderr: 'permission denied' })
    )
    .command(['init', 'bundle-no-permission'])
    .catch(error => {
      expect(error.message).to.contain('is not writable')
    })
    .it('handles a not writable parent directory')

  test
    .stderr()
    .stub(cp, 'execSync', sinon.stub().throws(new Error('git init error')))
    .command(['init', 'bundle-exec-error'])
    .catch(error => {
      expect(error.message).to.contain('git init error')
    })
    .it('handles git command error')

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, '.ent')
    checkBundleFile(bundleName, '.ent', 'config.json')
    checkBundleFile(bundleName, 'bundle.json')
    checkBundleFile(bundleName, 'microservices')
    checkBundleFile(bundleName, 'microfrontends')
    checkBundleFile(bundleName, 'Dockerfile')
    checkBundleFile(bundleName, '.gitignore')
  }

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(tmpDir, bundleName, ...pathSegments)
    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  }

  function parseBundleDescriptor(bundleName: string): BundleDescriptor {
    return new BundleDescriptorService(
      path.resolve(tmpDir, bundleName)
    ).getBundleDescriptor()
  }
})
