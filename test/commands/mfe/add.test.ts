import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  BundleDescriptor,
  MicroFrontend
} from '../../../src/models/bundle-descriptor'
import BundleDescriptorService from '../../../src/services/bundle-descriptor-service'

describe('mfe add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    microservices: [],
    microfrontends: []
  }

  let tmpDir: string
  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tmpDir = path.resolve(os.tmpdir(), bundleDescriptor.name)
    fs.mkdirSync(tmpDir)
    process.chdir(tmpDir)

    fs.mkdirSync('./microfrontends')

    fs.mkdirSync(path.resolve('./microfrontends', 'existing-mfe-dir'))

    bundleDescriptorService = new BundleDescriptorService(process.cwd())
  })

  beforeEach(() => {
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .command(['mfe add', 'default-stack-mfe'])
    .it('runs mfe add default-stack-mfe', () => {
      const mfeName = 'default-stack-mfe'
      const filePath: string = path.resolve(tmpDir, 'microfrontends', mfeName)
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [{ name: mfeName, stack: 'react' }]
      })
    })

  test
    .command(['mfe add', 'angular-mfe', '--stack', 'angular'])
    .it('runs mfe add angular-mfe --stack angular', () => {
      const mfeName = 'angular-mfe'
      const filePath: string = path.resolve(tmpDir, 'microfrontends', mfeName)
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [{ name: mfeName, stack: 'angular' }]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, 'microfrontends', 'mfe1'))
      const microfrontends: Array<MicroFrontend> = <Array<MicroFrontend>>[
        { name: 'mfe1' }
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['mfe add', 'mfe2'])
    .it('runs mfe add mfe2', () => {
      const mfeNames = ['mfe1', 'mfe2']
      const dirCont: Array<string> = fs.readdirSync(
        path.resolve(tmpDir, 'microfrontends')
      )
      const { microfrontends } = bundleDescriptorService.getBundleDescriptor()

      expect(mfeNames.every(name => dirCont.includes(name))).to.eq(true)
      expect(microfrontends.every(({ name }) => mfeNames.includes(name)))
    })

  test
    .stderr()
    .command(['mfe add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid Micro Frontend name')
    })
    .it('validates Micro Frontend name')

  test
    .stderr()
    .command(['mfe add', 'existing-mfe-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-dir already exists')
    })
    .it('exits if mfe folder already exists')

  test
    .stderr()
    .do(() => {
      const microfrontends: Array<MicroFrontend> = <Array<MicroFrontend>>[
        { name: 'existing-mfe-desc' }
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['mfe add', 'existing-mfe-desc'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-desc already exists')
    })
    .it('exits if mfe descriptor already exists')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tmpDir, 'bundle.json'), { force: true })
    })
    .command(['mfe add', 'mfe-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})
