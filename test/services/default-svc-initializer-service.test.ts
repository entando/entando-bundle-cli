import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { DefaultSvcInitializerService } from '../../src/services/default-svc-initializer-service'
import { SVC_FOLDER } from '../../src/paths'

describe('create-default-svc-service', () => {
  let bundleDirectory: string
  const BUNDLENAME = 'sample-bundle'
  const tempDirHelper = new TempDirHelper(__filename)
  let keycloakDir: string

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir(BUNDLENAME)
    keycloakDir = path.resolve(bundleDirectory, SVC_FOLDER, 'keycloak')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
  })

  afterEach(() => {
    const svcFolder = path.resolve(bundleDirectory, SVC_FOLDER)
    for (const svcfile of fs
      .readdirSync(svcFolder)
      .filter(f => f.endsWith('.yml'))) {
      const filepath = path.resolve(bundleDirectory, SVC_FOLDER, svcfile)
      if (fs.existsSync(filepath)) {
        fs.rmSync(filepath)
      }
    }

    if (fs.existsSync(keycloakDir)) {
      fs.rmSync(keycloakDir, { recursive: true })
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

  test.it('test initializeService', () => {
    const defSvc = new DefaultSvcInitializerService()
    defSvc.initializeService('mysql')
    checkBundleFile(BUNDLENAME, SVC_FOLDER, 'mysql.yml')
  })

  test.it('test initializeService with keycloak', () => {
    const defSvc = new DefaultSvcInitializerService()
    defSvc.initializeService('keycloak')
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

  test.it('skip the creation of default service if it already exists', () => {
    const content = 'test-content'
    const yamlFile = path.resolve(bundleDirectory, SVC_FOLDER, 'oracle.yml')
    fs.writeFileSync(yamlFile, content)
    const defSvc = new DefaultSvcInitializerService()
    defSvc.initializeService('oracle')
    expect(fs.readFileSync(yamlFile).toString()).to.eq(content)
  })

  test.it(
    'populate missing service folder even if parent already exists',
    () => {
      fs.mkdirSync(keycloakDir)
      const defSvc = new DefaultSvcInitializerService()
      defSvc.initializeService('keycloak')
      checkBundleFile(BUNDLENAME, SVC_FOLDER, 'keycloak.yml')
      expect(fs.readdirSync(keycloakDir).length).eq(2)
    }
  )

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath)).to.eq(true)
  }
})
