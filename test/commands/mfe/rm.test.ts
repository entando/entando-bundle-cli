import { CliUx } from '@oclif/core'
import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as sinon from 'sinon'
// import * as sh from 'sinon-helpers'
import {
  BundleDescriptor,
} from '../../../src/models/bundle-descriptor'
import BundleDescriptorService from '../../../src/services/bundle-descriptor-service'

/* const ux = sh.getStubConstructor(CliUx).withInit(instance => {
  instance.confirm.resolves(true)
}) */

describe('mfe rm', () => {
  const defaultMfeName = 'default-stack-mfe'
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    microservices: [],
    microfrontends: [
      {
        name: 'default-stack-mfe',
        code: '123',
        titles: { en: 'Default Stack MFE' },
        stack: 'stack',
        group: 'group',
        customUiPath: ''
      }
    ]
  }

  let tmpDir: string
  let bundleDescriptorService: BundleDescriptorService
  before(() => {
    tmpDir = path.resolve(os.tmpdir(), bundleDescriptor.name)
    fs.mkdirSync(tmpDir)
    process.chdir(tmpDir)

    fs.mkdirSync('./microfrontends')
  })

  beforeEach(() => {
    process.chdir(tmpDir)
    bundleDescriptorService = new BundleDescriptorService(process.cwd())

    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .stub(CliUx.ux, 'confirm', sinon.stub().get(() => true))
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, 'microfrontends', 'jeff-mfe'))
    })
    .command(['mfe rm', defaultMfeName])
    .it('runs mfe rm default-stack-mfe', () => {
      const filePath: string = path.resolve(tmpDir, 'microfrontends', defaultMfeName)
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath)).to.eq(false)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: []
      })
    })
})
