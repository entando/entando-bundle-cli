import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { DefaultSvcInitializerService } from '../../src/services/default-svc-initializer-service'
import { SvcService } from '../../src/services/svc-service'
import { SVC_FOLDER } from '../../src/paths'

describe('create-default-svc-service', () => {
  let bundleDirectory: string
  const BUNDLENAME = 'sample-bundle'
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir(BUNDLENAME)
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
  })

  afterEach(() => {
    const svcfiles = ['postgresql.yml', 'mysql.yml', 'postgresql.yml']
    for (const svcfile of svcfiles) {
      const filepath = path.resolve(bundleDirectory, SVC_FOLDER, svcfile)
      if (fs.existsSync(filepath)) {
        fs.rmSync(filepath)
      }
    }

    const keycloakLoc = path.resolve(bundleDirectory, SVC_FOLDER, 'keycloak')
    if (fs.existsSync(keycloakLoc)) {
      fs.rmSync(keycloakLoc, { recursive: true })
    }
  })

  test.it('list default services', () => {
    const defaultSvcs = DefaultSvcInitializerService.getDefaultServices()
    expect(defaultSvcs).have.length(4)
    expect(defaultSvcs).contain('keycloak')
    expect(defaultSvcs).contain('mysql')
    expect(defaultSvcs).contain('postgresql')
    expect(defaultSvcs).contain('oracle')
  })

  test.it('test createYamlFile', () => {
    const defSvc = new DefaultSvcInitializerService()
    defSvc.createYamlFile('mysql')
    checkBundleFile(BUNDLENAME, SVC_FOLDER, 'mysql.yml')
  })

  test.it('test createYamlFile with keycloak', () => {
    const defSvc = new DefaultSvcInitializerService()
    defSvc.createYamlFile('keycloak')
    checkBundleFile(BUNDLENAME, SVC_FOLDER, 'keycloak.yml')
    checkBundleFile(
      BUNDLENAME,
      SVC_FOLDER,
      'keycloak',
      'realm-config',
      'entando-dev-realm.json'
    )
    checkBundleFile(
      BUNDLENAME,
      SVC_FOLDER,
      'keycloak',
      'realm-config',
      'entando-dev-users-0.json'
    )
  })

  test
    .do(() => {
      const svcService = new SvcService('entando-bundle-cli')
      svcService.enableService('postgresql')
    })
    .it('test deleteYamlFile', () => {
      const defSvc = new DefaultSvcInitializerService()
      defSvc.deleteYamlFile('postgresql')
      expect(
        fs.existsSync(path.resolve(BUNDLENAME, SVC_FOLDER, 'postgres.yml'))
      ).to.eq(false)
    })

  test
    .do(() => {
      const svcService = new SvcService('entando-bundle-cli')
      svcService.enableService('keycloak')
    })
    .it('test deleteYamlFile with keycloak', () => {
      const defSvc = new DefaultSvcInitializerService()
      defSvc.deleteYamlFile('keycloak')
      expect(
        fs.existsSync(path.resolve(BUNDLENAME, SVC_FOLDER, 'keycloak.yml'))
      ).to.eq(false)
      expect(
        fs.existsSync(path.resolve(BUNDLENAME, SVC_FOLDER, 'keycloak'))
      ).to.eq(false)
    })

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath)).to.eq(true)
  }
})
