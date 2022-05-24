import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import TempDirHelper from '../../helpers/temp-dir-helper'

describe('ms add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-ms-test',
    version: '0.0.1',
    type: 'bundle',
    microservices: [],
    microfrontends: []
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string
  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
    const microservicesDir = path.resolve(tempBundleDir, 'microservices')
    fs.mkdirSync(path.resolve(microservicesDir, 'existing-ms-dir'))

    bundleDescriptorService = new BundleDescriptorService(process.cwd())
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tempBundleDir), { recursive: true, force: true })
  })

  test
    .command(['ms add', 'default-stack-ms'])
    .it('runs ms add default-stack-ms', () => {
      const msName = 'default-stack-ms'
      const filePath: string = path.resolve(
        tempBundleDir,
        'microservices',
        msName
      )
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
      const filePath: string = path.resolve(
        tempBundleDir,
        'microservices',
        msName
      )
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
      fs.mkdirSync(path.resolve(tempBundleDir, 'microservices', 'ms1'))
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
        path.resolve(tempBundleDir, 'microservices')
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
    .it('validates microservice name')

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
      fs.rmSync(path.resolve(tempBundleDir, BUNDLE_DESCRIPTOR_FILE_NAME), { force: true })
    })
    .command(['ms add', 'ms-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})
