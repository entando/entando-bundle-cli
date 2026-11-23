import { expect, test } from '@oclif/test'
import {
  demoBundle,
  demoBundleGroupList,
  mockApiKey,
  mockCatalogId,
  mockDomain,
  mockUri
} from '../helpers/mocks/hub-api'
import { HubService } from '../../src/services/hub-service'

describe('hub-service', () => {
  test
    .nock(mockDomain, api => api.get(mockUri).reply(200, demoBundleGroupList))
    .it('requests list of bundle groups', async () => {
      const hubService = new HubService()
      const bundleGroups = await hubService.loadBundleGroups()

      expect(bundleGroups).to.have.length(2)
      expect(bundleGroups[0]).to.deep.equal(demoBundleGroupList[0])
    })

  test
    .nock(mockDomain, api => api.get(`${mockUri}/51`).reply(200, [demoBundle]))
    .it('requests list of bundles from bundleGroup 51', async () => {
      const hubService = new HubService()
      const bundles = await hubService.loadBundlesFromBundleGroup(
        demoBundleGroupList[0]
      )

      expect(bundles).to.have.length(1)
      expect(bundles[0]).to.have.property(
        'bundleGroupName',
        demoBundle.bundleGroupName
      )
      expect(bundles[0]).to.have.property(
        'bundleGroupVersionId',
        demoBundle.bundleGroupVersionId
      )
      expect(bundles[0]).to.have.property(
        'gitSrcRepoAddress',
        demoBundle.gitSrcRepoAddress
      )
    })

  for (const legacyHubUrl of [
    'https://entando.com/entando-hub-api',
    'https://www.entando.com/entando-hub-api/'
  ]) {
    test
      .nock(mockDomain, api => api.get(mockUri).reply(200, demoBundleGroupList))
      .it(
        `replaces legacy hub url ${legacyHubUrl} with the default`,
        async () => {
          const hubService = new HubService(legacyHubUrl)
          const bundleGroups = await hubService.loadBundleGroups()

          expect(bundleGroups).to.have.length(2)
        }
      )
  }

  test
    .nock(mockDomain, api =>
      api
        .get(mockUri)
        .query({ catalogId: mockCatalogId })
        .matchHeader('Entando-hub-api-key', mockApiKey)
        .reply(200, demoBundleGroupList)
    )
    .it('keeps the catalogId when replacing a legacy hub url', async () => {
      const hubService = new HubService(
        `https://entando.com/entando-hub-api?catalogId=${mockCatalogId}`,
        mockApiKey
      )
      const bundleGroups = await hubService.loadBundleGroups()

      expect(bundleGroups).to.have.length(2)
    })

  test
    .nock('https://my-hub.example.com/entando-hub-api', api =>
      api.get(mockUri).reply(200, demoBundleGroupList)
    )
    .it('uses a custom hub url as is', async () => {
      const hubService = new HubService(
        'https://my-hub.example.com/entando-hub-api'
      )
      const bundleGroups = await hubService.loadBundleGroups()

      expect(bundleGroups).to.have.length(2)
    })

  test
    .nock(mockDomain, api => api.get(mockUri).reply(500))
    .it('throw error on loadBundleGroups', async () => {
      const hubService = new HubService()
      try {
        await hubService.loadBundleGroups()
      } catch (error: any) {
        expect(error.message).to.contain(
          `Error while contacting the Entando Hub at ${mockDomain}${mockUri}: HTTP 500`
        )
      }
    })

  test
    .nock(mockDomain, api => api.get(`${mockUri}/51`).reply(400))
    .it('throw error on loadBundlesFromBundleGroup', async () => {
      const hubService = new HubService()
      try {
        await hubService.loadBundlesFromBundleGroup(demoBundleGroupList[0])
      } catch (error: any) {
        expect(error.message).to.contain(
          `Error while contacting the Entando Hub at ${mockDomain}${mockUri}/51: HTTP 400`
        )
      }
    })
})
