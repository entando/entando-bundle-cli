import {expect, test} from '@oclif/test'

const DEMOBUNDLE = [{
  bundleGroupName: "test",
  bundleName: "test",
  gitSrcRepoAddress: "https://test.github.com/",
  bundleGroupVersionId: 1,
  bundleGroupId: 1,
  bundleId: 1
}];

// const bundlegroupurl = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io/ent/api/templates/bundlegroups';

describe('hub-group-api', () => {
  test
  .nock('https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io', api => api
    .get('/ent/api/templates/bundlegroups')
    .reply(200, [{
      bundleGroupName: "test",
      bundleName: "test",
      gitSrcRepoAddress: "https://test.github.com/",
      bundleGroupVersionId: 1,
      bundleGroupId: 1,
      bundleId: 1
    }])
  )
  .stdout()
  .command(['hub-group-api', 'list'])
  .it('runs list option', ctx => {
    expect(ctx.stdout).to.contain('Bundle Group')
  })
})
