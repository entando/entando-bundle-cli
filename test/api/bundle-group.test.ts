import { expect } from '@oclif/test'
import * as nock from 'nock'
import BundleGroupApi from '../../src/api/bundle-group'

const demoBundle = {
  bundleGroupName: "Test germano 1",
  bundleName: "{{$randomUserName}}",
  gitSrcRepoAddress: "https://github.com/germano/mysrcrepo2.git",
  bundleGroupVersionId: 51,
  bundleGroupId: 49,
  bundleId: 51,
}

const demoBundleGroupList = [
  {
    bundleGroupName: "Test germano 1",
    bundleGroupVersionId: 51,
  },
  {
    bundleGroupName: "Test germano 2",
    bundleGroupVersionId: 52,
  },
]

const domainmock = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io';
const uri = '/ent/api/templates/bundlegroups';

describe('Bundle Group API', () => {
  const bundleGroupApi = new BundleGroupApi();
  it('Bundle Group List', async () => {
    nock(domainmock)
      .get(uri)
      .reply(200, demoBundleGroupList)
    const bundleGroups = await bundleGroupApi.getBundleGroups();
    expect(bundleGroups).to.have.length(2);
    expect(bundleGroups[0]).to.deep.equal(demoBundleGroupList[0]);
  })

  it('Bundle Group List with name', async () => {
    const [bundleGroup] = demoBundleGroupList;
    nock(domainmock)
      .get(`${uri}?name=Test+germano+1`)
      .reply(200, [bundleGroup])
    const bundleGroups = await bundleGroupApi.getBundleGroups(bundleGroup.bundleGroupName);
    expect(bundleGroups).to.have.length(1);
    expect(bundleGroups[0]).to.have.property('bundleGroupName', bundleGroup.bundleGroupName);
    expect(bundleGroups[0]).to.have.property('bundleGroupVersionId', bundleGroup.bundleGroupVersionId);
  });

  it('Bundle Group Info by version id', async () => {
    nock(domainmock)
    .get(`${uri}/${demoBundle.bundleGroupVersionId}`)
    .reply(200, [demoBundle])
    const bundleGroup = await bundleGroupApi.getBundleGroupById(demoBundle.bundleGroupVersionId);
    expect(bundleGroup).to.have.length(1);
    expect(bundleGroup[0]).to.have.property('bundleGroupName', demoBundle.bundleGroupName);
    expect(bundleGroup[0]).to.have.property('bundleGroupVersionId', demoBundle.bundleGroupVersionId);
    expect(bundleGroup[0]).to.have.property('gitSrcRepoAddress', demoBundle.gitSrcRepoAddress);
  });
});
