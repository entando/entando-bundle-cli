import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { MfeConfigService } from '../../../src/services/mfe-config-service'
import { MfeConfig } from '../../../src/models/mfe-config'
import { TempDirHelper } from '../../helpers/temp-dir-helper'

describe('api add', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  let bundleDescriptor: BundleDescriptor
  let bundleDescriptorService: BundleDescriptorService
  let mfeConfigService: MfeConfigService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir('bundle-api-test')
    fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
  })

  beforeEach(() => {
    bundleDescriptor = {
      name: 'bundle-api-test',
      version: '0.0.1',
      type: 'bundle',
      microservices: <MicroService[]>[{ name: 'ms1', stack: 'spring-boot' }],
      microfrontends: <MicroFrontend[]>[
        { name: 'mfe1', stack: 'react', publicFolder: 'public' }
      ]
    }

    process.chdir(tempBundleDir)

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    mfeConfigService = new MfeConfigService()
    mfeConfigService.writeMfeConfig('mfe1', {})
  })

  test
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .it('adds an internal api claim to an mfe', () => {
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = mfeConfigService.getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...bundleDescriptor.microfrontends[0],
            apiClaims: [{ name: 'ms1-api', type: 'internal', serviceId: 'ms1' }]
          }
        ]
      })

      expect(updatedMfeConfig).to.eql({
        api: { 'ms1-api': { url: 'http://localhost:8080' } }
      })
    })

  test
    .do(() => {
      const microservices = <MicroService[]>[
        ...bundleDescriptor.microservices,
        { name: 'ms2', stack: 'node' }
      ]
      const microfrontends = <MicroFrontend[]>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [{ name: 'ms1-api', type: 'internal', serviceId: 'ms1' }]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends, microservices }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
      mfeConfigService.writeMfeConfig('mfe1', {
        api: { 'ms1-api': { url: 'http://localhost:8080' } }
      })
    })
    .command([
      'api add',
      'mfe1',
      'ms2-api',
      '--serviceId',
      'ms2',
      '--serviceUrl',
      'http://localhost:8081'
    ])
    .it(
      'adds a new internal api claim to an mfe having an existing api claim',
      () => {
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()
        const updatedMfeConfig: MfeConfig =
          mfeConfigService.getMfeConfig('mfe1')

        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...bundleDescriptor.microfrontends[0],
              apiClaims: [
                { name: 'ms1-api', type: 'internal', serviceId: 'ms1' },
                { name: 'ms2-api', type: 'internal', serviceId: 'ms2' }
              ]
            }
          ]
        })

        expect(updatedMfeConfig).to.eql({
          api: {
            'ms1-api': { url: 'http://localhost:8080' },
            'ms2-api': { url: 'http://localhost:8081' }
          }
        })
      }
    )

  test
    .do(() => {
      fs.rmSync(mfeConfigService.getMfeConfigPath('mfe1'))
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .it(
      "adds an internal api claim to an mfe that doesn't have an existing mfe-config.json",
      () => {
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()
        const updatedMfeConfig: MfeConfig =
          mfeConfigService.getMfeConfig('mfe1')

        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...bundleDescriptor.microfrontends[0],
              apiClaims: [
                { name: 'ms1-api', type: 'internal', serviceId: 'ms1' }
              ]
            }
          ]
        })

        expect(updatedMfeConfig).to.eql({
          api: { 'ms1-api': { url: 'http://localhost:8080' } }
        })
      }
    )

  test
    .stderr()
    .command([
      'api add',
      'nonexistent-mfe',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('nonexistent-mfe does not exist')
    })
    .it('exits with an error if microfrontend does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices: []
      })
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('ms1 does not exist')
    })
    .it('exits with an error if microservice does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      const microfrontends = <MicroFrontend[]>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [{ name: 'ms1-api', type: 'internal', serviceId: 'ms1' }]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('API claim ms1-api already exists')
    })
    .it('exits with an error if API claim already exists')

  test
    .stderr()
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'invalidurl'
    ])
    .catch(error => {
      expect(error.message).to.contain('invalidurl is not a valid URL')
    })
    .it('exits with an error if serviceUrl is not a valid URL')

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits with an error if current folder is not a Bundle project')
})
