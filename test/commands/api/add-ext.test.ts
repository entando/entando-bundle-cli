import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend
} from '../../../src/models/bundle-descriptor'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { MfeConfigService } from '../../../src/services/mfe-config-service'
import { CmService } from '../../../src/services/cm-service'
import { MfeConfig } from '../../../src/models/mfe-config'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { ComponentHelper } from '../../helpers/mocks/component-helper'
import { DEFAULT_DOCKER_REGISTRY } from '../../../src/services/docker-service'
import {
  MOCK_BUNDLES,
  MOCK_BUNDLE_PLUGIN,
  setCmEnv
} from '../../helpers/mocks/cm'

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
      microservices: [ComponentHelper.newMicroservice('ms1')],
      microfrontends: [ComponentHelper.newMicroFrontend('mfe1')]
    }

    process.chdir(tempBundleDir)

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    mfeConfigService = new MfeConfigService()
    mfeConfigService.writeMfeConfig('mfe1', {})

    setCmEnv()
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'http://my-registry/entando/my-bundle'
    ])
    .catch(error => {
      expect(error.message).contain('Invalid bundle format')
    })
    .it('Invalid bundle format')

  test
    .env({ ENTANDO_CLI_BASE_URL: undefined })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain(
        '"process.env.ENTANDO_CLI_BASE_URL" should have a value'
      )
    })
    .it('exits with an error if required env variable is not set')

  test
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
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
                serviceName: 'ms1',
                bundle: DEFAULT_DOCKER_REGISTRY + '/entando/my-bundle'
              }
            ]
          }
        ]
      })

      expect(updatedMfeConfig.systemParams).to.eql({
        api: {
          'ms1-api': {
            url: `${process.env.ENTANDO_CLI_BASE_URL}${MOCK_BUNDLE_PLUGIN.ingressPath}`
          }
        }
      })
    })

  test
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .do(() => {
      const microfrontends = <MicroFrontend[]>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            {
              name: 'ms1-api',
              type: 'external',
              serviceName: 'ms1',
              bundle: DEFAULT_DOCKER_REGISTRY + '/entando/my-bundle'
            }
          ]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
      mfeConfigService.writeMfeConfig('mfe1', {
        systemParams: {
          api: { 'ms1-api': { url: 'http://mock-my-bundle-ms1' } }
        }
      })
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms2-api',
      '--serviceName',
      'ms2',
      '--bundle',
      'custom-registry/entando/my-bundle'
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
                  serviceName: 'ms1',
                  bundle: DEFAULT_DOCKER_REGISTRY + '/entando/my-bundle'
                },
                {
                  name: 'ms2-api',
                  type: 'external',
                  serviceName: 'ms2',
                  bundle: 'custom-registry/entando/my-bundle'
                }
              ]
            }
          ]
        })

        expect(updatedMfeConfig.systemParams).to.eql({
          api: {
            'ms1-api': { url: 'http://mock-my-bundle-ms1' },
            'ms2-api': {
              url: `${process.env.ENTANDO_CLI_BASE_URL}${MOCK_BUNDLE_PLUGIN.ingressPath}`
            }
          }
        })
      }
    )

  test
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .do(() => {
      fs.rmSync(mfeConfigService.getMfeConfigPath('mfe1'))
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
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
                  serviceName: 'ms1',
                  bundle: DEFAULT_DOCKER_REGISTRY + '/entando/my-bundle'
                }
              ]
            }
          ]
        })

        expect(updatedMfeConfig.systemParams).to.eql({
          api: {
            'ms1-api': {
              url: `${process.env.ENTANDO_CLI_BASE_URL}${MOCK_BUNDLE_PLUGIN.ingressPath}`
            }
          }
        })
      }
    )

  test
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .stderr()
    .command([
      'api add-ext',
      'nonexistent-mfe',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('nonexistent-mfe does not exist')
    })
    .it(
      'exits with an error if micro frontend does not exist in the descriptor'
    )

  test
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .stderr()
    .do(() => {
      const microfrontends = <MicroFrontend[]>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            {
              name: 'ms1-api',
              type: 'external',
              serviceName: 'ms1',
              bundle: DEFAULT_DOCKER_REGISTRY + '/entando/my-bundle'
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
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain('API claim ms1-api already exists')
    })
    .it('exits with error if API claim already exists')

  test
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .resolves({
          bundle: MOCK_BUNDLES[0].publicationUrl,
          microservice: MOCK_BUNDLE_PLUGIN.pluginName
        })
    )
    .stub(
      CmService.prototype,
      'getBundles',
      sinon.stub().resolves(MOCK_BUNDLES)
    )
    .stub(
      CmService.prototype,
      'getBundleMicroservices',
      sinon.stub().resolves([MOCK_BUNDLE_PLUGIN])
    )
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .command(['api add-ext', 'mfe1', 'myextservice-api'])
    .it('adds an external api claim to an mfe via interactive mode', () => {
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
                name: 'myextservice-api',
                type: 'external',
                serviceName: MOCK_BUNDLE_PLUGIN.pluginName,
                bundle: MOCK_BUNDLES[0].publicationUrl
              }
            ]
          }
        ]
      })

      expect(updatedMfeConfig.systemParams).to.eql({
        api: {
          'myextservice-api': {
            url: `${process.env.ENTANDO_CLI_BASE_URL}${MOCK_BUNDLE_PLUGIN.ingressPath}`
          }
        }
      })
    })

  test
    .stub(
      inquirer,
      'prompt',
      sinon.stub().resolves({ microservice: MOCK_BUNDLE_PLUGIN.pluginName })
    )
    .stub(
      CmService.prototype,
      'getBundleMicroservices',
      sinon.stub().resolves([MOCK_BUNDLE_PLUGIN])
    )
    .stub(
      CmService.prototype,
      'getBundleMicroservice',
      sinon.stub().resolves(MOCK_BUNDLE_PLUGIN)
    )
    .command([
      'api add-ext',
      'mfe1',
      'myextservice-api',
      '--bundle',
      'custom-registry/entando/my-bundle'
    ])
    .it(
      'adds an external api claim to an mfe via interactive mode with specified bundle',
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
                  name: 'myextservice-api',
                  type: 'external',
                  serviceName: MOCK_BUNDLE_PLUGIN.pluginName,
                  bundle: 'custom-registry/entando/my-bundle'
                }
              ]
            }
          ]
        })

        expect(updatedMfeConfig.systemParams).to.eql({
          api: {
            'myextservice-api': {
              url: `${process.env.ENTANDO_CLI_BASE_URL}${MOCK_BUNDLE_PLUGIN.ingressPath}`
            }
          }
        })
      }
    )

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command([
      'api add-ext',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--bundle',
      'entando/my-bundle'
    ])
    .catch(error => {
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
    })
    .it('exits with error if current folder is not a Bundle project')
})
