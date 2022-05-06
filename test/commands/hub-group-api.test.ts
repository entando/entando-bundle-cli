import { expect, test } from '@oclif/test'

const demoBundleOut = {
  bundleGroupName: "Test germano 1",
  bundleName: "{{$randomUserName}}",
  gitSrcRepoAddress: "https://github.com/germano/mysrcrepo2.git",
  bundleGroupVersionId: 51,
  bundleGroupId: 49,
  bundleId: 51,
};

const demoBundleList = [
  { ...demoBundleOut },
  {
    ...demoBundleOut,
    bundleGroupName: "Test germano 2",
  },
];

const domainmock = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io';
const uri = '/ent/api/templates/bundlegroups';

describe('hub-group-api', () => {
  test
    .stdout()
    .nock(domainmock, api => api
      .get(uri)
      .reply(200, demoBundleList)
    )
    .command(['hub-group-api', 'list'])
    .it('runs list option', ctx => {
      expect(ctx.stdout).to.contain('Bundle Group')
      expect(ctx.stdout).to.contain('Test germano 2')
    })

  test
    .stdout()
    .nock(domainmock, api => api
      .get(`${uri}?name=%22Test%20germano%201%22`)
      .reply(200, [demoBundleOut])
    )
    .command(['hub-group-api', 'bundle', '--name="Test germano 1"'])
    .it('runs display bundle with name filter', ctx => {
      expect(ctx.stdout).to.contain('Test germano 1')
      expect(ctx.stdout).to.contain('51')
    })

  test
    .stdout()
    .nock(domainmock, api => api
      .get(`${uri}/51`)
      .reply(200, [demoBundleOut])
    )
    .command(['hub-group-api', 'bundle', '--versionId=51'])
    .it('runs display bundle info by version id', ctx => {
      expect(ctx.stdout).to.contain('Test germano 1')
      expect(ctx.stdout).to.contain('51')
    })

  test
    .stdout()
    .command(['hub-group-api', 'bundle'])
    .it('run bundle option without flags', ctx => {
      expect(ctx.stdout).to.contain('Please provide either --name or --versionId value. Bye.')
    })
})
