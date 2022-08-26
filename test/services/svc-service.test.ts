import { expect, test } from '@oclif/test'
import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { SvcService } from '../../src/services/svc-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { SVC_FOLDER } from '../../src/paths'

describe('svc-service', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)
  let svcService: SvcService

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    svcService = new SvcService('entando-bundle-cli')
    svcService.enableService('keycloak')
    svcService.enableService('postgresql')
  })

  afterEach(() => {
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: []
    })
    const svcfiles = ['postgresql.yml', 'mysql.yml', 'postgresql.yml']
    for (const svcfile of svcfiles) {
      const filepath = path.resolve(bundleDirectory, 'svc', svcfile)
      if (fs.existsSync(filepath)) {
        fs.rmSync(filepath)
      }
    }

    const keycloakLoc = path.resolve(bundleDirectory, 'svc', 'keycloak')
    if (fs.existsSync(keycloakLoc)) {
      fs.rmSync(keycloakLoc, { recursive: true })
    }
  })

  test.it('run getAllServices method', () => {
    const svcService: SvcService = new SvcService('entando-bundle-cli')
    const services = svcService.getAllServices()
    expect(services).to.have.length(4)
    expect(services).to.includes('keycloak')
    expect(services).to.includes('postgresql')
    expect(services).to.includes('mysql')
    expect(services).to.includes('oracle')
  })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['keycloak']
      })
    })
    .it('run getAvailableServices method', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      const services = svcService.getAvailableServices()
      expect(services).to.have.length(3)
      expect(services).to.includes('postgresql')
      expect(services).to.includes('mysql')
      expect(services).to.includes('oracle')
      expect(services).to.not.includes('keycloak')
    })

  test.it('enable a service successfully', () => {
    const svcService: SvcService = new SvcService('entando-bundle-cli')
    expect(() => svcService.enableService('mysql')).to.not.throw(CLIError)
  })

  test.it('enable a service that does not exist in svc folder', () => {
    const svcService: SvcService = new SvcService('entando-bundle-cli')
    expect(() => svcService.enableService('macosx')).to.throw(CLIError)
  })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('enable a service that is already enabled', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.enableService('postgresql')).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      delete bundleDescriptor.svc
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .it(
      'svc that is non-existent in bundle descriptor creates svc attribute',
      () => {
        const svcService: SvcService = new SvcService('entando-bundle-cli')
        expect(() => svcService.enableService('mysql')).to.not.throw(CLIError)
        const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
        expect(bundleDescriptor).to.haveOwnProperty('svc')
      }
    )

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('disable a service successfully', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.disableService('postgresql', true)).to.not.throw(
        CLIError
      )
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/postgresql.yml rm -f -s postgresql'
      )
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('disable a service that does not exist in svc folder', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.disableService('win98', true)).to.throw(CLIError)
    })

  test.it('disable a service that is not enabled', async () => {
    const svcService: SvcService = new SvcService('entando-bundle-cli')
    expect(() => svcService.disableService('mysql', true)).to.throw(CLIError)
  })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      delete bundleDescriptor.svc
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .it(
      'svc that is non-existent in bundle descriptor creates svc attribute',
      () => {
        const svcService: SvcService = new SvcService('entando-bundle-cli')
        expect(() => svcService.enableService('keycloak')).to.not.throw(
          CLIError
        )
        const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
        expect(bundleDescriptor).to.haveOwnProperty('svc')
      }
    )

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('start an enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      svcService.startServices(['mysql'])
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/mysql.yml up --build -d mysql'
      )
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: []
      })
    })
    .it('start with no enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.startServices([])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .it('start with disabled/unlisted service', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.startServices(['postgresql'])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .it('start with disabled/unlisted services', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.startServices(['macosx', 'win98'])).to.throw(
        CLIError
      )
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(404))
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .it('start with error number', async () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      const result = await svcService.startServices(['mysql'])
      expect(result).to.not.eq(0)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('stop an enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      svcService.stopServices(['mysql'])
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/mysql.yml stop mysql'
      )
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: []
      })
    })
    .it('stop with no enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.stopServices([])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['keycloak']
      })
    })
    .it('stop with disabled/unlisted service', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.stopServices(['mysql'])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('stop with disabled/unlisted services', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.stopServices(['macosx'])).to.throw(CLIError)
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(404))
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .it('stop with error', async () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      const result = await svcService.stopServices(['mysql'])
      expect(result).to.not.eq(0)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('restart an enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      svcService.restartServices(['postgresql'])
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/postgresql.yml restart postgresql'
      )
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: []
      })
    })
    .it('restart with no enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.restartServices([])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .it('restart with disabled/unlisted service', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.restartServices(['keycloak'])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('restart with disabled/unlisted services', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.restartServices(['macosx'])).to.throw(CLIError)
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(403))
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgres']
      })
    })
    .it('restart with error', async () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      const result = await svcService.restartServices(['postgres'])
      expect(result).to.not.eq(0)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['mysql']
      })
    })
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .it('display logs of an enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      svcService.logServices(['mysql'])
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/mysql.yml logs -f mysql'
      )
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: []
      })
    })
    .it('display logs with no enabled service listed in descriptor', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.logServices([])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('display logs with disabled/unlisted service', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.logServices(['keycloak'])).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('display logs with disabled/unlisted services', () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      expect(() => svcService.logServices(['macosx'])).to.throw(CLIError)
    })

  test
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(403))
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgres']
      })
    })
    .it('display logs with error', async () => {
      const svcService: SvcService = new SvcService('entando-bundle-cli')
      const result = await svcService.logServices(['postgres'])
      expect(result).to.not.eq(0)
    })

  test.it('disable custom service removing service data', () => {
    const myServiceYaml = path.resolve(
      bundleDirectory,
      SVC_FOLDER,
      'myservice.yml'
    )
    const myServiceFolder = path.resolve(
      bundleDirectory,
      SVC_FOLDER,
      'myservice'
    )
    fs.writeFileSync(myServiceYaml, '')
    fs.mkdirSync(myServiceFolder)
    const svcService = new SvcService('entando-bundle-cli')
    expect(svcService.getEnabledServices().includes('myservice')).false
    svcService.enableService('myservice')
    expect(svcService.getEnabledServices().includes('myservice')).true
    svcService.disableService('myservice', true)
    expect(svcService.getEnabledServices().includes('myservice')).false
    expect(fs.existsSync(myServiceYaml)).false
    expect(fs.existsSync(myServiceFolder)).false
  })

  test.it('disable service when YAML file has already been removed', () => {
    const svcService = new SvcService('entando-bundle-cli')
    expect(svcService.getEnabledServices().includes('postgresql')).true
    const myServiceYaml = path.resolve(
      bundleDirectory,
      SVC_FOLDER,
      'postgresql.yml'
    )
    fs.rmSync(myServiceYaml)
    svcService.disableService('postgresql', true)
    expect(svcService.getEnabledServices().includes('postgresql')).false
  })
})
