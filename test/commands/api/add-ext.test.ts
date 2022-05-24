import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { MfeConfig } from '../../../src/models/mfe-config'
import TempDirHelper from '../../helpers/temp-dir-helper'

describe('api add-ext', () => {
  let bundleDescriptor: BundleDescriptor

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir('bundle-api-test')
    fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
  })

  beforeEach(() => {
    bundleDescriptor = {
      name: 'bundle-api-test',
      version: '0.0.1',
      microservices: <Array<MicroService>>[
        { name: 'ms1', stack: 'spring-boot' }
      ],
      microfrontends: <Array<MicroFrontend>>[{ name: 'mfe1', stack: 'react' }]
    }

    process.chdir(tempBundleDir)
    writeBundleDescriptor(bundleDescriptor)
    writeMfeConfig('mfe1', {})
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
    .it(
      'runs api add-ext mfe1 ms1-api --serviceId ms1 --bundleId my-bundle',
      () => {
        const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
        const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

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
    .do(() => {
      const microservices = <Array<MicroService>>[
        ...bundleDescriptor.microservices,
        { name: 'ms2', stack: 'node' }
      ]
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
      bundleDescriptor = { ...bundleDescriptor, microfrontends, microservices }
      writeBundleDescriptor(bundleDescriptor)
      writeMfeConfig('mfe1', {
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
      'runs api add-ext mfe1 ms2-api --serviceId ms2 --bundleId my-bundle',
      () => {
        const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
        const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

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
      'runs api add-ext mfe1 ms1-api --serviceId ms1 --bundleId my-bundle',
      () => {
        const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
        const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

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
      writeBundleDescriptor({
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
    .it('exits if microfrontend does not exist in the descriptor')

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
      writeBundleDescriptor(bundleDescriptor)
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
    .it('exits if API claim already exists')

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
    .it('exits if current folder is not a Bundle project')
})

function writeBundleDescriptor(bundleDescriptor: BundleDescriptor): void {
  fs.writeFileSync(
    BUNDLE_DESCRIPTOR_FILE_NAME,
    JSON.stringify(bundleDescriptor)
  )
}

function writeMfeConfig(mfeName: string, mfeConfig: MfeConfig): void {
  fs.writeFileSync(
    path.resolve('microfrontends', mfeName, 'mfe-config.json'),
    JSON.stringify(mfeConfig)
  )
}

function getBundleDescriptor(): BundleDescriptor {
  return JSON.parse(fs.readFileSync(BUNDLE_DESCRIPTOR_FILE_NAME, 'utf-8'))
}

function getMfeConfig(mfeName: string): MfeConfig {
  return JSON.parse(
    fs.readFileSync(
      path.resolve('microfrontends', mfeName, 'mfe-config.json'),
      'utf-8'
    )
  )
}
