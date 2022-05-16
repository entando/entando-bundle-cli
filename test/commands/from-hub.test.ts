import {expect, test} from '@oclif/test'
import { CliUx } from '@oclif/core'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as cp from 'node:child_process'
import * as path from 'node:path'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
import InitializerService from '../../src/services/initializer-service'

const demoBundle = {
  bundleGroupName: "Test germano 1",
  bundleName: "germano1",
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
    bundleGroupName: "Test germano wowow",
    bundleGroupVersionId: 52,
  },
]

const domainmock = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io'
const uri = '/ent/api/templates/bundlegroups'

describe('from-hub', () => {
  let tmpDir: string

  before(async () => {
    // creating a temporary directory
    tmpDir = path.resolve(os.tmpdir(), 'bundle-cli-init-test')
    fs.mkdirSync(tmpDir)

    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tmpDir, 'existing-bundle'))

    // setting the temporary directory as current working directory
    process.chdir(tmpDir)

    const initializer = new InitializerService({
      parentDirectory: process.cwd(),
      name: 'bundle-cloned',
      version: '0.0.1'
    })

    await initializer.performScaffolding()
  })

  after(() => {
    // temporary directory cleanup
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .stub(inquirer, 'prompt', sinon.stub().resolves({ bundlegroup: demoBundleGroupList[0], bundle: demoBundle }))
    .stub(cp, 'execSync', sinon.stub().returns('Initialized git cmd'))
    .nock(domainmock, api => api
      .get(uri)
      .reply(200, demoBundleGroupList)
      .get(`${uri}/51`)
      .reply(200, demoBundle)
    )
    .command(['from-hub'])
    .it('runs from-hub', (ctx, done) => {
      done()
  })
})
