import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import {
  BundleDescriptor,
  MicroFrontend
} from '../../../src/models/bundle-descriptor'
import { MfeConfig } from '../../../src/models/mfe-config'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { ConstraintsValidatorService } from '../../../src/services/constraints-validator-service'
import { MfeConfigService } from '../../../src/services/mfe-config-service'
import { setCmEnv } from '../../helpers/mocks/cm'
import { TempDirHelper } from '../../helpers/temp-dir-helper'

describe('api rm', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  let bundleDescriptor: BundleDescriptor
  let bundleDescriptorService: BundleDescriptorService
  let mfeConfigService: MfeConfigService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir('bundle-api-test')
    fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
  })

  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    bundleDescriptor = {
      name: 'bundle-api-test',
      version: '0.0.1',
      type: 'bundle',
      microservices: [],
      microfrontends: <MicroFrontend[]>[
        {
          name: 'mfe1',
          stack: 'react',
          publicFolder: 'public',
          apiClaims: [
            {
              name: 'ms1-api',
              type: 'external',
              serviceName: 'ms1',
              bundle: 'my-bundle'
            },
            {
              name: 'ms2-api',
              type: 'internal',
              serviceName: 'ms2'
            }
          ]
        }
      ]
    }

    sinon
      .stub(ConstraintsValidatorService, 'validateObjectConstraints')
      .returns(bundleDescriptor)

    process.chdir(tempBundleDir)

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    mfeConfigService = new MfeConfigService()
    mfeConfigService.writeMfeConfig('mfe1', {
      systemParams: {
        api: {
          'ms1-api': { url: 'http://mock-my-bundle-ms1' },
          'ms2-api': { url: 'http://localhost:8080' }
        }
      }
    })

    setCmEnv()
  })

  test
    .command(['api rm', 'mfe1', 'ms1-api'])
    .it('removes an api claim from an mfe', () => {
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = mfeConfigService.getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            name: 'mfe1',
            stack: 'react',
            publicFolder: 'public',
            apiClaims: [
              {
                name: 'ms2-api',
                type: 'internal',
                serviceName: 'ms2'
              }
            ]
          }
        ]
      })

      expect(updatedMfeConfig.systemParams).to.eql({
        api: {
          'ms2-api': { url: 'http://localhost:8080' }
        }
      })
    })

  test
    .stderr()
    .command(['api rm', 'nonexistent-mfe', 'ms1-api'])
    .catch(error => {
      expect(error.message).to.contain('nonexistent-mfe does not exist')
    })
    .it(
      'exits with an error if micro frontend does not exist in the descriptor'
    )

  test
    .stderr()
    .command(['api rm', 'mfe1', 'nonexistent-api-claim'])
    .catch(error => {
      expect(error.message).to.contain('nonexistent-api-claim does not exist')
    })
    .it('exits with an error if api claim does not exist in the micro frontend')

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command(['api rm', 'mfe1', 'ms1-api'])
    .catch(error => {
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
    })
    .it('exits with error if current folder is not a Bundle project')

  test
    .command('api rm')
    .catch(error => {
      expect(error.message).to.contain('Missing 2 required args')
      expect(error.message).to.contain('mfeName')
      expect(error.message).to.contain('claimName')
    })
    .it('exits with an error if required arguments are missing')
})
