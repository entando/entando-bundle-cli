import { expect, test } from '@oclif/test'
import { CmAPI } from '../../src/api/cm-api'
import { RequestFilterOperator } from '../../src/models/api'
import {
  MOCK_BUNDLES,
  MOCK_BUNDLE_PLUGIN,
  MOCK_CM_TOKEN,
  MOCK_CM_URL
} from '../helpers/mocks/cm'

describe('cm-api', () => {
  let cmAPI: CmAPI

  beforeEach(() => {
    cmAPI = new CmAPI(MOCK_CM_URL, MOCK_CM_TOKEN)
  })

  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api.get(`/bundles`).reply(200, { payload: MOCK_BUNDLES })
    )
    .it('getBundles fetches all bundles from a cm api', async () => {
      const response = await cmAPI.getBundles()

      expect(response.data).to.eql({ payload: MOCK_BUNDLES })
    })

  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api
        .get(
          `/bundles?filters[0].attribute=bundleId&filters[0].operator=eq&filters[0].value=${MOCK_BUNDLES[0].bundleId}`
        )
        .reply(200, { payload: MOCK_BUNDLES })
    )
    .it(
      'getBundles with filters fetches a filtered list of bundles from a cm api',
      async () => {
        const reqFilters = [
          {
            attribute: 'bundleId',
            operator: RequestFilterOperator.Equal,
            value: MOCK_BUNDLES[0].bundleId
          }
        ]
        const response = await cmAPI.getBundles(reqFilters)

        expect(response.data).to.eql({ payload: MOCK_BUNDLES })
      }
    )

  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api
        .get(`/bundles/${MOCK_BUNDLES[0].bundleId}/plugins`)
        .reply(200, { payload: [MOCK_BUNDLE_PLUGIN] })
    )
    .it(
      'getBundlePlugins fetches all plugins of a bundle from a cm api',
      async () => {
        const response = await cmAPI.getBundlePlugins(MOCK_BUNDLES[0].bundleId)

        expect(response.data).to.eql({ payload: [MOCK_BUNDLE_PLUGIN] })
      }
    )

  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api
        .get(
          `/bundles/${MOCK_BUNDLES[0].bundleId}/plugins/${MOCK_BUNDLE_PLUGIN.pluginName}`
        )
        .reply(200, MOCK_BUNDLE_PLUGIN)
    )
    .it(
      'getBundlePlugin fetches a plugin of a bundle by name from a cm api',
      async () => {
        const response = await cmAPI.getBundlePlugin(
          MOCK_BUNDLES[0].bundleId,
          MOCK_BUNDLE_PLUGIN.pluginName
        )

        expect(response.data).to.eql(MOCK_BUNDLE_PLUGIN)
      }
    )
})
