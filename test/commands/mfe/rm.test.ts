import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  BundleDescriptor,
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'

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
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, 'microfrontends', 'default-stack-mfe'))
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

  test
    .stderr()
    .command(['mfe rm', 'jojoma'])
    .catch(error => {
      expect(error.message).to.contain('jojoma does not exist in the microfrontends section of the Bundle descriptor')
    })
    .it('removing a microfrontend that does not exist in descriptor')

  test
    .stderr()
    .command(['mfe rm', defaultMfeName])
    .catch(error => {
      expect(error.message).to.contain(`does not exist`)
    })
    .it('removing a microfrontend with its folder that does not exist')
})
