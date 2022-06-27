import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { CmAPI } from '../../src/api/cm-api'
import { CmService } from '../../src/services/cm-service'
import { MOCK_BUNDLES, MOCK_BUNDLE_PLUGINS } from '../helpers/mocks/cm'

describe('cm-service', () => {
  let cmService: CmService

  beforeEach(() => {
    process.env.ENTANDO_CLI_ECR_URL = 'http://test-cm.eng-entando.com'
    process.env.ENTANDO_CLI_ECR_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSl'
    cmService = new CmService()
  })

  test
    .env({ ENTANDO_CLI_ECR_URL: undefined })
    .do(() => {
      cmService = new CmService()
    })
    .catch(error => {
      expect(error.message).to.contain('"process.env.ENTANDO_CLI_ECR_URL" and "process.env.ENTANDO_CLI_ECR_TOKEN" should have values')
    })
    .it('throws an error when one of required env variables has no value')

  test
    .stub(CmAPI.prototype, 'getBundles', sinon.stub().returns(Promise.resolve({ data: { payload: MOCK_BUNDLES } })))
    .it('getBundles fetches all bundles via CmAPI', async () => {
      const bundles = await cmService.getBundles()

      expect(bundles).to.eql(MOCK_BUNDLES)
    })

  test
    .stub(CmAPI.prototype, 'getBundlePlugins', sinon.stub().returns(Promise.resolve({ data: { payload: MOCK_BUNDLE_PLUGINS } })))
    .it('getBundleMicroservices fetches all microservices of a bundle via CmAPI', async () => {
      const bundleMicroservices = await cmService.getBundleMicroservices(MOCK_BUNDLES[0].bundleId)

      expect(bundleMicroservices).to.eql(MOCK_BUNDLE_PLUGINS)
    })

  test
    .stub(CmAPI.prototype, 'getBundlePlugin', sinon.stub().returns(Promise.resolve({ data: MOCK_BUNDLE_PLUGINS[0] })))
    .it('getBundleMicroservice fetches a microservice of a bundle by name via CmAPI', async () => {
      const bundleMicroservice = await cmService.getBundleMicroservice(MOCK_BUNDLES[0].bundleId, MOCK_BUNDLE_PLUGINS[0].pluginName)

      expect(bundleMicroservice).to.eql(MOCK_BUNDLE_PLUGINS[0])
    })
})
