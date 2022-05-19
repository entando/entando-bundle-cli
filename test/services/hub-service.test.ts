import { expect, test } from '@oclif/test'
import { demoBundle, demoBundleGroupList, mockDomain, mockUri } from '../helpers/mocks/bundles'
import HubService from '../../src/services/hub-service'

describe('hub-service', () => {
  test
    .nock(mockDomain, api => api
      .get(mockUri)
      .reply(200, demoBundleGroupList)
    )
    .it('requests list of bundle groups', async () => {
      const hubService = new HubService()
      const bundleGroups = await hubService.loadBundleGroups()

      expect(bundleGroups).to.have.length(2)
      expect(bundleGroups[0]).to.deep.equal(demoBundleGroupList[0])
    })

  test
    .nock(mockDomain, api => api
      .get(`${mockUri}/51`)
      .reply(200, [demoBundle])
    )
    .it('requests list of bundles from bundleGroup 51', async () => {
      const hubService = new HubService()
      const bundles = await hubService.loadBundlesFromBundleGroup(demoBundleGroupList[0])

      expect(bundles).to.have.length(1)
      expect(bundles[0]).to.have.property('bundleGroupName', demoBundle.bundleGroupName)
      expect(bundles[0]).to.have.property('bundleGroupVersionId', demoBundle.bundleGroupVersionId)
      expect(bundles[0]).to.have.property('gitSrcRepoAddress', demoBundle.gitSrcRepoAddress)
    })

  test
    .nock(mockDomain, api => api
      .get(mockUri)
      .reply(500)
    )
    .it('throw error on loadBundleGroups', async () => {
      const hubService = new HubService()
      try {
       await hubService.loadBundleGroups()
      } catch (error: any) {
        expect(error.message).to.contain('Error while contacting the Entando Hub')
      }
    })

  test
    .nock(mockDomain, api => api
      .get(`${mockUri}/51`)
      .reply(400)
    )
    .it('throw error on loadBundlesFromBundleGroup', async () => {
      const hubService = new HubService()
      try {
       await hubService.loadBundlesFromBundleGroup(demoBundleGroupList[0])
      } catch (error: any) {
        expect(error.message).to.contain('Error while contacting the Entando Hub')
      }
    })
})
