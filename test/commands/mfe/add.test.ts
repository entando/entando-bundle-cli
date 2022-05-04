import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { BundleDescriptor, MicroFrontend } from '../../../src/models/bundle-descriptor'
import BundleDescriptorManager from '../../../src/services/bundle-descriptor-manager'

describe('mfe add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    microservices: [],
    microfrontends: [],
  }

  let tmpDir: string
  let bundleDescriptorManager: BundleDescriptorManager

  before(() => {
    tmpDir = path.resolve(os.tmpdir(), bundleDescriptor.name)
    fs.mkdirSync(tmpDir)
    process.chdir(tmpDir)

    fs.mkdirSync('./microfrontends')

    bundleDescriptorManager = new BundleDescriptorManager(process.cwd())
  })

  beforeEach(() => {
    bundleDescriptorManager.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
  .stdout()
  .command(['mfe add', 'default-stack-mfe'])
  .it('runs mfe add default-stack-mfe', () => {
    const mfeName = 'default-stack-mfe'
    const filePath = path.resolve(tmpDir, 'microfrontends', mfeName)
    const bundleDescriptor: BundleDescriptor = bundleDescriptorManager.getBundleDescriptor()

    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
    expect(bundleDescriptor).to.eql({
      ...bundleDescriptor, microfrontends: [{ name: mfeName, stack: 'react' }]
    })
  })
})
