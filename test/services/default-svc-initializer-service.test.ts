import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as YAML from 'yaml'
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
    checkBundleFile(BUNDLENAME, SVC_FOLDER, 'keycloak', 'keycloak-db')
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

  describe('generated templates', () => {
    const deps = require('../../package.json').org_entando_dependencies

    for (const service of ['keycloak', 'postgresql', 'oracle']) {
      test.it(`${service}: valid YAML, no placeholders, no version key`, () => {
        const { text, yml } = generate(service)
        expect(text).to.not.match(/%[A-Z_]+%/)
        expect(yml.services).to.haveOwnProperty(service)
        expect(yml).to.not.haveOwnProperty('version')
      })
    }

    test.it('keycloak: Keycloak 24 configuration', () => {
      const { text, yml } = generate('keycloak')
      const keycloak = yml.services.keycloak
      expect(keycloak.image).to.eq(`entando/entando-keycloak:${deps.keycloak}`)
      const entrypoint = keycloak.entrypoint.join(' ')
      expect(entrypoint).to.contain('/opt/convert-vars.sh')
      expect(entrypoint).to.contain('kc.sh start-dev --import-realm')
      expect(keycloak.volumes).to.have.members([
        './keycloak/realm-config:/opt/keycloak/data/import:ro',
        './keycloak/keycloak-db:/opt/keycloak/data/h2'
      ])
      expect(yml).to.not.haveOwnProperty('volumes')
      // the compose interpolation must reach the generated file untouched
      // eslint-disable-next-line no-template-curly-in-string
      expect(keycloak.user).to.eq('${ENTANDO_SVC_UID:-1000}:0')
      expect(keycloak.environment).to.include.members([
        'KC_HTTP_PORT=9080',
        'DB_VENDOR=dev-file'
      ])
      expect(keycloak.ports).to.include('9080:9080')
      expect(keycloak).to.not.haveOwnProperty('command')
      expect(text).to.not.contain('/opt/jboss')
      expect(text).to.not.contain('-Dkeycloak.migration')
    })

    test.it('postgresql: PostgreSQL image and volume hint', () => {
      const { text, yml } = generate('postgresql')
      expect(yml.services.postgresql.image).to.eq(
        `entando/entando-postgres-rocky:${deps.postgres}`
      )
      expect(yml.services.postgresql.environment).to.include(
        'POSTGRESQL_DATABASE=sample-bundle'
      )
      expect(text).to.contain('/var/lib/pgsql/')
      expect(text).to.not.contain('/var/lib/postgresql/data')
    })

    // images published for amd64 only declare their platform, multi-arch images run natively
    const platforms: Record<string, string | undefined> = {
      keycloak: undefined,
      postgresql: undefined,
      oracle: 'linux/amd64'
    }
    for (const [service, platform] of Object.entries(platforms)) {
      test.it(`${service}: platform ${platform ?? 'not declared'}`, () => {
        const { yml } = generate(service)
        expect(yml.services[service].platform).to.eq(platform)
      })
    }
  })

  function generate(service: string): { text: string; yml: any } {
    new DefaultSvcInitializerService().initializeService(service)
    const text = fs
      .readFileSync(path.resolve(bundleDirectory, SVC_FOLDER, `${service}.yml`))
      .toString()
    return { text, yml: YAML.parse(text) }
  }

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath)).to.eq(true)
  }
})
