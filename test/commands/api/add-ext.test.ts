import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { MfeConfigService } from '../../../src/services/mfe-config-service'
import { CMService } from '../../../src/services/cm-service'
import { MfeConfig } from '../../../src/models/mfe-config'
import { TempDirHelper } from '../../helpers/temp-dir-helper'

describe('api add-ext', () => {
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
      microservices: <Array<MicroService>>[
        { name: 'ms1', stack: 'spring-boot' }
      ],
      microfrontends: <Array<MicroFrontend>>[{ name: 'mfe1', stack: 'react' }]
    }

    process.chdir(tempBundleDir)

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    mfeConfigService = new MfeConfigService()
    mfeConfigService.writeMfeConfig('mfe1', {})
  })

  test
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .it('adds an external api claim to an mfe', () => {
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = mfeConfigService.getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...bundleDescriptor.microfrontends[0],
            apiClaims: [
              {
                name: 'ms1-api',
                type: 'external',
                serviceId: 'ms1',
                bundleId: 'my-bundle'
              }
            ]
          }
        ]
      })

      expect(updatedMfeConfig).to.eql({
        api: { 'ms1-api': { url: 'http://mock-my-bundle-ms1' } }
      })
    })

  test
    .do(() => {
      const microfrontends = <Array<MicroFrontend>>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            {
              name: 'ms1-api',
              type: 'external',
              serviceId: 'ms1',
              bundleId: 'my-bundle'
            }
          ]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
      mfeConfigService.writeMfeConfig('mfe1', {
        api: { 'ms1-api': { url: 'http://mock-my-bundle-ms1' } }
      })
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms2-api',
      '--serviceId',
      'ms2',
      '--bundleId',
      'my-bundle'
    ])
    .it(
      'adds a new external api claim to an mfe having an existing api claim',
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
                {
                  name: 'ms1-api',
                  type: 'external',
                  serviceId: 'ms1',
                  bundleId: 'my-bundle'
                },
                {
                  name: 'ms2-api',
                  type: 'external',
                  serviceId: 'ms2',
                  bundleId: 'my-bundle'
                }
              ]
            }
          ]
        })

        expect(updatedMfeConfig).to.eql({
          api: {
            'ms1-api': { url: 'http://mock-my-bundle-ms1' },
            'ms2-api': { url: 'http://mock-my-bundle-ms2' }
          }
        })
      }
    )

  test
    .do(() => {
      fs.rmSync(path.resolve('microfrontends', 'mfe1', 'mfe-config.json'))
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .it(
      "adds an external api claim to an mfe that doesn't have an existing mfe-config.json",
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
                {
                  name: 'ms1-api',
                  type: 'external',
                  serviceId: 'ms1',
                  bundleId: 'my-bundle'
                }
              ]
            }
          ]
        })

        expect(updatedMfeConfig).to.eql({
          api: { 'ms1-api': { url: 'http://mock-my-bundle-ms1' } }
        })
      }
    )

  test
    .stderr()
    .do(() => {
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends: []
      })
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('mfe1 does not exist')
    })
    .it('exits with an error if microfrontend does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      const microfrontends = <Array<MicroFrontend>>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            {
              name: 'ms1-api',
              type: 'external',
              serviceId: 'ms1',
              bundleId: 'my-bundle'
            }
          ]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('API claim ms1-api already exists')
    })
    .it('exits with error if API claim already exists')

  test
    .stderr()
    .stub(
      CMService.prototype,
      'getBundleMicroserviceUrl',
      sinon.stub().returns(null)
    )
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('Failed to get microservice URL')
    })
    .it('exits with an error if it fails to get the microservice url')

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceId',
      'ms1',
      '--bundleId',
      'my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits with error if current folder is not a Bundle project')
})
