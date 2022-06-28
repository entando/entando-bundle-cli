import { expect, test } from '@oclif/test'
import { AxiosError, AxiosResponse } from 'axios'
import * as sinon from 'sinon'
import { CmAPI } from '../../src/api/cm-api'
import { CmService } from '../../src/services/cm-service'
import { MOCK_BUNDLES, MOCK_BUNDLE_PLUGIN, setCmEnv } from '../helpers/mocks/cm'

describe('cm-service', () => {
  let cmService: CmService

  beforeEach(() => {
    setCmEnv()

    cmService = new CmService()
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .env({ ENTANDO_CLI_ECR_URL: undefined })
    .do(() => {
      cmService = new CmService()
    })
    .catch(error => {
      expect(error.message).to.contain(
        'Environment variables "ENTANDO_CLI_ECR_URL" and "ENTANDO_CLI_ECR_TOKEN" should have values'
      )
    })
    .it('throws an error when one of required env variables has no value')

  test
    .stub(
      CmAPI.prototype,
      'getBundles',
      sinon.stub().resolves({ data: { payload: MOCK_BUNDLES } })
    )
    .it('getBundles fetches all bundles via CmAPI', async () => {
      const bundles = await cmService.getBundles()

      expect(bundles).to.eql(MOCK_BUNDLES)
    })

  test
    .stub(
      CmAPI.prototype,
      'getBundles',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 400
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundles()
    })
    .catch(error => {
      expect(error.message).to.contain('Failed to get bundles')
      expect(error.message).to.contain('Server responded with status code: 400')
    })
    .it('getBundles handles error response')

  test
    .stub(
      CmAPI.prototype,
      'getBundles',
      sinon.stub().rejects(new Error('Some error occurred'))
    )
    .do(async () => {
      await cmService.getBundles()
    })
    .catch(error => {
      expect(error.message).to.contain('Failed to get bundles')
      expect(error.message).to.contain('Some error occurred')
    })
    .it('getBundles handles generic error')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugins',
      sinon.stub().resolves({ data: { payload: [MOCK_BUNDLE_PLUGIN] } })
    )
    .it(
      'getBundleMicroservices fetches all microservices of a bundle via CmAPI',
      async () => {
        const bundleMicroservices = await cmService.getBundleMicroservices(
          MOCK_BUNDLES[0].bundleId
        )

        expect(bundleMicroservices).to.eql([MOCK_BUNDLE_PLUGIN])
      }
    )

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugins',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 404
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundleMicroservices(MOCK_BUNDLES[0].bundleId)
    })
    .catch(error => {
      expect(error.message).to.contain(
        `Bundle with bundleId ${MOCK_BUNDLES[0].bundleId} cannot be found`
      )
    })
    .it('getBundleMicroservices handles 404 error response')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugins',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 400
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundleMicroservices(MOCK_BUNDLES[0].bundleId)
    })
    .catch(error => {
      expect(error.message).to.contain('Failed to get bundle microservices')
      expect(error.message).to.contain('Server responded with status code: 400')
    })
    .it('getBundleMicroservices handles error response')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugins',
      sinon.stub().rejects(new Error('Some error occurred'))
    )
    .do(async () => {
      await cmService.getBundleMicroservices(MOCK_BUNDLES[0].bundleId)
    })
    .catch(error => {
      expect(error.message).to.contain('Failed to get bundle microservices')
      expect(error.message).to.contain('Some error occurred')
    })
    .it('getBundleMicroservices handles generic error')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugin',
      sinon.stub().resolves({ data: MOCK_BUNDLE_PLUGIN })
    )
    .it(
      'getBundleMicroservice fetches a microservice of a bundle by name via CmAPI',
      async () => {
        const bundleMicroservice = await cmService.getBundleMicroservice(
          MOCK_BUNDLES[0].bundleId,
          MOCK_BUNDLE_PLUGIN.pluginName
        )

        expect(bundleMicroservice).to.eql(MOCK_BUNDLE_PLUGIN)
      }
    )

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugin',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 404,
          data: { message: MOCK_BUNDLE_PLUGIN.pluginName }
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundleMicroservice(
        MOCK_BUNDLES[0].bundleId,
        MOCK_BUNDLE_PLUGIN.pluginName
      )
    })
    .catch(error => {
      expect(error.message).to.contain(
        `Microservice ${MOCK_BUNDLE_PLUGIN.pluginName} with bundleId ${MOCK_BUNDLES[0].bundleId} cannot be found`
      )
    })
    .it('getBundleMicroservices handles 404 error response (plugin not found)')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugin',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 404,
          data: { message: '' }
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundleMicroservice(
        MOCK_BUNDLES[0].bundleId,
        MOCK_BUNDLE_PLUGIN.pluginName
      )
    })
    .catch(error => {
      expect(error.message).to.contain(
        `Bundle with bundleId ${MOCK_BUNDLES[0].bundleId} cannot be found`
      )
    })
    .it('getBundleMicroservices handles 404 error response (bundle not found)')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugin',
      sinon.stub().rejects(
        new AxiosError(undefined, undefined, undefined, undefined, {
          status: 400
        } as AxiosResponse)
      )
    )
    .do(async () => {
      await cmService.getBundleMicroservice(
        MOCK_BUNDLES[0].bundleId,
        MOCK_BUNDLE_PLUGIN.pluginName
      )
    })
    .catch(error => {
      expect(error.message).to.contain(
        `Failed to get bundle microservice ${MOCK_BUNDLE_PLUGIN.pluginName}`
      )
      expect(error.message).to.contain('Server responded with status code: 400')
    })
    .it('getBundleMicroservice handles error response')

  test
    .stub(
      CmAPI.prototype,
      'getBundlePlugin',
      sinon.stub().rejects(new Error('Some error occurred'))
    )
    .do(async () => {
      await cmService.getBundleMicroservice(
        MOCK_BUNDLES[0].bundleId,
        MOCK_BUNDLE_PLUGIN.pluginName
      )
    })
    .catch(error => {
      expect(error.message).to.contain(
        `Failed to get bundle microservice ${MOCK_BUNDLE_PLUGIN.pluginName}`
      )
      expect(error.message).to.contain('Some error occurred')
    })
    .it('getBundleMicroservice handles generic error')
})
