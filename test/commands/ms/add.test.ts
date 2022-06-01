import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { MicroFrontend } from '../../../dist/models/bundle-descriptor'

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
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .command(['ms add', 'default-stack-ms'])
    .it('adds a microservice with default stack', () => {
      const msName = 'default-stack-ms'
      const filePath: string = path.resolve(
        tempBundleDir,
        'microservices',
        msName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [{ name: msName, stack: 'spring-boot' }]
      })
    })

  test
    .command(['ms add', 'node-ms', '--stack', 'node'])
    .it('adds a microservice with specified stack', () => {
      const msName = 'node-ms'
      const filePath: string = path.resolve(
        tempBundleDir,
        'microservices',
        msName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [{ name: msName, stack: 'node' }]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempBundleDir, 'microservices', 'ms1'))
      const microservices: MicroService[] = <MicroService[]>[{ name: 'ms1' }]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['ms add', 'ms2'])
    .it(
      'adds a new microservice to bundle having an existing microservice',
      () => {
        const msNames = ['ms1', 'ms2']
        const dirCont: string[] = fs.readdirSync(
          path.resolve(tempBundleDir, 'microservices')
        )
        const { microservices } = bundleDescriptorService.getBundleDescriptor()

        expect(msNames.every(name => dirCont.includes(name))).to.eq(true)
        expect(microservices.every(({ name }) => msNames.includes(name)))
      }
    )

  test
    .stderr()
    .command(['ms add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid microservice name')
    })
    .it('exits with an error if microservice name is invalid')

  test
    .stderr()
    .command(['ms add', 'existing-ms-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-ms-dir already exists')
    })
    .it('exits with an error if ms folder already exists')

  test
    .stderr()
    .do(() => {
      const microservices: MicroService[] = <MicroService[]>[
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
    .it('exits with an error if ms descriptor already exists')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tempBundleDir, BUNDLE_DESCRIPTOR_FILE_NAME), {
        force: true
      })
    })
    .command(['ms add', 'ms-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits with an error if current folder is not a Bundle project')

  test
    .do(() => {
      const microfrontends: MicroFrontend[] = <MicroFrontend[]>[
        { name: 'component1' }
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['ms add', 'component1'])
    .catch(error => {
      expect(error.message).to.contain(
        'A component (microservice or micro frontend) with name component1 already exists'
      )
    })
    .it(
      'exits with an error if another component with the same name already exists'
    )
})
