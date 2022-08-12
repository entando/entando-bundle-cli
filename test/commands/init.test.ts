import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
import { BundleDescriptor } from '../../src/models/bundle-descriptor'
import { InitializerService } from '../../src/services/initializer-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  demoBundle,
  demoBundleGroupList,
  mockDomain,
  mockUri
} from '../helpers/mocks/hub-api'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import {
  CONFIG_FOLDER,
  CONFIG_FILE,
  BUNDLE_DESCRIPTOR_FILE_NAME,
  SVC_FOLDER,
  GITKEEP_FILE,
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER
} from '../../src/paths'
import { ProcessExecutorService } from '../../src/services/process-executor-service'

describe('init', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, 'existing-bundle'))
  })

  after(() => {
    fs.rmSync(path.resolve(tempDirHelper.tmpDir), {
      recursive: true,
      force: true
    })
  })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['init', 'bundle-with-version', '--version=0.0.2'])
    .it('runs init bundle-with-version --version=0.0.2', () => {
      const bundleName = 'bundle-with-version'

      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.2')
      expect(bundleDescriptor.description).to.eq(
        'bundle-with-version description'
      )
      expect(bundleDescriptor.type).to.eq('bundle')
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['init', 'bundle-no-version'])
    .it('runs init bundle-no-version', () => {
      const bundleName = 'bundle-no-version'

      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq(
        'bundle-no-version description'
      )
      expect(bundleDescriptor.type).to.eq('bundle')
    })

  test
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle })
    )
    .nock(mockDomain, api =>
      api
        .get(mockUri)
        .reply(200, demoBundleGroupList)
        .get(`${mockUri}/51`)
        .reply(200, [demoBundle])
    )
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(async () => {
      const init = new InitializerService({
        name: 'bundle-with-fromhub',
        version: '0.0.1',
        parentDirectory: process.cwd()
      })
      await init.performBundleInit()
      fs.rmSync(
        path.resolve(process.cwd(), 'bundle-with-fromhub/microservices'),
        { recursive: true, force: true }
      )
    })
    .command(['init', 'bundle-with-fromhub', '--version=0.0.1', '--from-hub'])
    .it('runs init --from-hub', () => {
      const bundleName = 'bundle-with-fromhub'

      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
    })

  const noDescriptorBundlename = 'bundle-with-fromhub-nodescriptor'

  test
    .stderr()
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle })
    )
    .nock(mockDomain, api =>
      api
        .get(mockUri)
        .reply(200, demoBundleGroupList)
        .get(`${mockUri}/51`)
        .reply(200, [demoBundle])
    )
    .env({ ENTANDO_BUNDLE_CLI_INIT_SUPPRESS_NO_ENTANDO_JSON_WARNING: 'false' })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(async () => {
      const init = new InitializerService({
        name: noDescriptorBundlename,
        version: '0.0.1',
        parentDirectory: process.cwd()
      })

      await init.performBundleInit()
      fs.rmSync(
        path.resolve(process.cwd(), noDescriptorBundlename, 'entando.json')
      )
    })
    .command(['init', noDescriptorBundlename, '--version=0.0.1', '--from-hub'])
    .it('runs init --from-hub but has no descriptor', ctx => {
      expect(ctx.stderr).contains('entando.json is missing or invalid')
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
    })

  test
    .stderr()
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle })
    )
    .nock(mockDomain, api =>
      api
        .get(mockUri)
        .reply(200, demoBundleGroupList)
        .get(`${mockUri}/51`)
        .reply(200, [demoBundle])
    )
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(async () => {
      fs.rmSync(path.resolve(process.cwd(), noDescriptorBundlename), {
        recursive: true,
        force: true
      })
      const init = new InitializerService({
        name: noDescriptorBundlename,
        version: '0.0.1',
        parentDirectory: process.cwd()
      })

      await init.performBundleInit()
      fs.rmSync(
        path.resolve(process.cwd(), noDescriptorBundlename, 'entando.json')
      )
    })
    .command(['init', noDescriptorBundlename, '--version=0.0.1', '--from-hub'])
    .it(
      'runs init --from-hub but has no descriptor - should not display warning message',
      ctx => {
        expect(ctx.stderr).not.contains('entando.json is missing or invalid')
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)
      }
    )

  test
    .stderr()
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle })
    )
    .nock(mockDomain, api =>
      api
        .get(mockUri)
        .reply(200, demoBundleGroupList)
        .get(`${mockUri}/51`)
        .reply(200, [demoBundle])
    )
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command([
      'init',
      'an-enormous-bundle-with-a-really-really-really-long-name',
      '--version=0.0.1',
      '--from-hub'
    ])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle name is too long. The maximum length is 50'
      )
    })
    .it('running init --from-hub exits if bundle folder name is long')

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
    .it('validates bundle name format')

  test
    .stderr()
    .command(['init', 'too-long'.repeat(20)])
    .catch(error => {
      expect(error.message).to.contain('Bundle name is too long')
    })
    .it('validates bundle name length')

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
    .stub(
      ProcessExecutorService,
      'executeProcess',
      sinon.stub().callsFake(options => {
        options.errorStream!.write('git init error')
        return Promise.resolve(1)
      })
    )
    .command(['init', 'bundle-exec-error'])
    .catch(error => {
      expect(error.message).to.contain('git init error')
    })
    .it('handles git command error')

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, CONFIG_FOLDER)
    checkBundleFile(bundleName, CONFIG_FOLDER, CONFIG_FILE)
    checkBundleFile(bundleName, BUNDLE_DESCRIPTOR_FILE_NAME)
    checkBundleFile(bundleName, MICROSERVICES_FOLDER, GITKEEP_FILE)
    checkBundleFile(bundleName, MICROFRONTENDS_FOLDER, GITKEEP_FILE)
    checkBundleFile(bundleName, PSC_FOLDER, GITKEEP_FILE)
    checkBundleFile(bundleName, '.gitignore')
    checkBundleFile(bundleName, SVC_FOLDER)
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
