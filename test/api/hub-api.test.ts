import { expect } from '@oclif/test'
import * as nock from 'nock'
import { HubAPI } from '../../src/api/hub-api'
import {
  demoBundle,
  demoBundleGroupList,
  mockApiKey,
  mockDomain,
  mockUri
} from '../helpers/mocks/hub-api'

describe('Hub API', () => {
  describe('Bundle Groups', () => {
    const hubApi = new HubAPI(mockDomain)
    it('Bundle Group List', async () => {
      nock(mockDomain).get(mockUri).reply(200, demoBundleGroupList)
      const bundleGroups = await hubApi.getBundleGroups()
      expect(bundleGroups).to.have.length(2)
      expect(bundleGroups[0]).to.deep.equal(demoBundleGroupList[0])
    })

    it('Bundle Group List with name', async () => {
      const [bundleGroup] = demoBundleGroupList
      nock(mockDomain)
        .get(`${mockUri}?name=Test+germano+1`)
        .reply(200, [bundleGroup])
      const bundleGroups = await hubApi.getBundleGroups(
        bundleGroup.bundleGroupName
      )
      expect(bundleGroups).to.have.length(1)
      expect(bundleGroups[0]).to.have.property(
        'bundleGroupName',
        bundleGroup.bundleGroupName
      )
      expect(bundleGroups[0]).to.have.property(
        'bundleGroupVersionId',
        bundleGroup.bundleGroupVersionId
      )
    })

    it('Bundle Group Info by version id', async () => {
      nock(mockDomain)
        .get(`${mockUri}/${demoBundle.bundleGroupVersionId}`)
        .reply(200, [demoBundle])
      const bundleGroup = await hubApi.getBundlesByBundleGroupId(
        demoBundle.bundleGroupVersionId
      )
      expect(bundleGroup).to.have.length(1)
      expect(bundleGroup[0]).to.have.property(
        'bundleGroupName',
        demoBundle.bundleGroupName
      )
      expect(bundleGroup[0]).to.have.property(
        'bundleGroupVersionId',
        demoBundle.bundleGroupVersionId
      )
      expect(bundleGroup[0]).to.have.property(
        'gitSrcRepoAddress',
        demoBundle.gitSrcRepoAddress
      )
    })

    it('Handles slash at the end of base Hub URL', async () => {
      nock(mockDomain).get(mockUri).reply(200, demoBundleGroupList)
      const hubApi = new HubAPI(mockDomain + '/')
      const bundleGroups = await hubApi.getBundleGroups()
      expect(bundleGroups).to.have.length(2)
      expect(bundleGroups[0]).to.deep.equal(demoBundleGroupList[0])
    })

    it('Includes the Entando-hub-api-key header when apiKey is provided', async () => {
      nock(mockDomain, {
        reqheaders: {
          'Entando-hub-api-key': mockApiKey,
        }
      })
        .get(mockUri)
        .reply(200, demoBundleGroupList)
  
      const hubApi = new HubAPI(mockDomain, mockApiKey)
      const bundleGroups = await hubApi.getBundleGroups()
  
      expect(bundleGroups).to.deep.equal(demoBundleGroupList)
    })
  })
})
