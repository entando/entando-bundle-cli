import { expect, test } from '@oclif/test'
import { CmAPI } from '../../src/api/cm-api'
import * as chai from 'chai'
import { RequestFilterOperator } from '../../src/models/api'

chai.config.truncateThreshold = 0

const MOCK_CM_URL = 'http://test-cm.eng-entando.com'
const MOCK_CM_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSl'

const MOCK_BUNDLES = [
  {
    id: '479195a1-670d-4191-a838-098c8e19640e',
    bundleId: '1aafa497',
    bundleName: 'myapp2mysql',
    componentTypes: ['widget', 'plugin', 'bundle'],
    installed: true,
    publicationUrl: 'docker://docker.io/gigiozzz/myapp2mysql-bundle'
  }
]

const MOCK_BUNDLE_PLUGINS = [
  {
    id: 'f90100c6-ec40-4041-a46b-28b40a12ff7b',
    bundleId: '1aafa497',
    pluginId: 'c7b80698',
    pluginName: 'lcorsettientando-myapp-2-mysql',
    pluginCode: 'pn-1aafa497-c7b80698-lcorsettientando-myapp-2-mysql',
    ingressPath: '/lcorsettientando/myapp-2-mysql',
    roles: ['myapp2mysql-admin', 'point-2-d-admin']
  }
]

describe('CM API', () => {
  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api.get(`/bundles`).reply(200, { payload: MOCK_BUNDLES })
    )
    .it('getBundles fetches all bundles from a cm api', async () => {
      const cmAPI = new CmAPI(MOCK_CM_URL, MOCK_CM_TOKEN)
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
        const cmAPI = new CmAPI(MOCK_CM_URL, MOCK_CM_TOKEN)
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
        .reply(200, { payload: MOCK_BUNDLE_PLUGINS })
    )
    .it(
      'getBundlePlugins fetches all plugins of a bundle from a cm api',
      async () => {
        const cmAPI = new CmAPI(MOCK_CM_URL, MOCK_CM_TOKEN)
        const response = await cmAPI.getBundlePlugins(MOCK_BUNDLES[0].bundleId)

        expect(response.data).to.eql({ payload: MOCK_BUNDLE_PLUGINS })
      }
    )

  test
    .nock(MOCK_CM_URL, { reqheaders: { Authorization: () => true } }, api =>
      api
        .get(
          `/bundles/${MOCK_BUNDLES[0].bundleId}/plugins/${MOCK_BUNDLE_PLUGINS[0].pluginName}`
        )
        .reply(200, MOCK_BUNDLE_PLUGINS[0])
    )
    .it(
      'getBundlePlugin fetches a plugin of a bundle by name from a cm api',
      async () => {
        const cmAPI = new CmAPI(MOCK_CM_URL, MOCK_CM_TOKEN)
        const response = await cmAPI.getBundlePlugin(
          MOCK_BUNDLES[0].bundleId,
          MOCK_BUNDLE_PLUGINS[0].pluginName
        )

        expect(response.data).to.eql(MOCK_BUNDLE_PLUGINS[0])
      }
    )
})
