import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  BundleDescriptor,
  MicroService
} from '../../../src/models/bundle-descriptor'
import BundleDescriptorService from '../../../src/services/bundle-descriptor-service'

describe('ms add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-ms-test',
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

    fs.mkdirSync('./microservices')

    fs.mkdirSync(path.resolve('./microservices', 'existing-ms-dir'))

    bundleDescriptorService = new BundleDescriptorService(process.cwd())
  })

  beforeEach(() => {
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .command(['ms add', 'default-stack-ms'])
    .it('runs ms add default-stack-ms', () => {
      const msName = 'default-stack-ms'
      const filePath: string = path.resolve(tmpDir, 'microservices', msName)
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [{ name: msName, stack: 'spring-boot' }]
      })
    })

  test
    .command(['ms add', 'node-ms', '--stack', 'node'])
    .it('runs ms add node-ms --stack node', () => {
      const msName = 'node-ms'
      const filePath: string = path.resolve(tmpDir, 'microservices', msName)
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [{ name: msName, stack: 'node' }]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tmpDir, 'microservices', 'ms1'))
      const microservices: Array<MicroService> = <Array<MicroService>>[
        { name: 'ms1' }
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['ms add', 'ms2'])
    .it('runs ms add ms2', () => {
      const msNames = ['ms1', 'ms2']
      const dirCont: Array<string> = fs.readdirSync(
        path.resolve(tmpDir, 'microservices')
      )
      const { microservices } = bundleDescriptorService.getBundleDescriptor()

      expect(msNames.every(name => dirCont.includes(name))).to.eq(true)
      expect(microservices.every(({ name }) => msNames.includes(name)))
    })

  test
    .stderr()
    .command(['ms add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid microservice name')
    })
    .it('validates Micro Service name')

  test
    .stderr()
    .command(['ms add', 'existing-ms-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-ms-dir already exists')
    })
    .it('exits if ms folder already exists')

  test
    .stderr()
    .do(() => {
      const microservices: Array<MicroService> = <Array<MicroService>>[
        { name: 'existing-ms-desc' }
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['ms add', 'existing-ms-desc'])
    .catch(error => {
      expect(error.message).to.contain('existing-ms-desc already exists')
    })
    .it('exits if ms descriptor already exists')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tmpDir, 'bundle.json'), { force: true })
    })
    .command(['ms add', 'ms-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})
