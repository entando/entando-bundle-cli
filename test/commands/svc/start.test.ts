import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'
import { SvcService } from '../../../src/services/svc-service'

describe('svc start', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: ['postgresql', 'mysql']
    })
  })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['svc start', '--all'])
    .it('start active services successfully', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/postgresql.yml -f svc/mysql.yml up --build -d'
      )
    })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['svc start', 'mysql'])
    .it('start specific service mysql', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/mysql.yml up --build -d'
      )
    })

  test
    .stderr()
    .command(['svc start'])
    .catch(error => {
      expect(error.message).to.contain('At least one service name is required.')
    })
    .it('start without any arguments and flags')

  test
    .stderr()
    .command(['svc start', 'win98'])
    .catch(error => {
      expect(error.message).to.contain('Service win98 is not enabled.')
    })
    .it('start an unlisted service')

  test
    .stderr()
    .stub(SvcService.prototype, 'startServices', sinon.stub().resolves(404))
    .command(['svc start', 'mysql'])
    .catch(error => {
      expect(error.message).to.contain(
        'Starting service(s) mysql failed, exited with code 404'
      )
    })
    .it('start command unsuccessful - exits with error code', () => {
      const runStub = SvcService.prototype.startServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['mysql'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'startServices',
      sinon.stub().resolves(new Error('an error you cannot refuse'))
    )
    .command(['svc start', 'postgresql'])
    .catch(error => {
      expect(error.message).to.contain(
        'Command failed due to error: an error you cannot refuse'
      )
    })
    .it('start command unsuccessful - exits with Error instance', () => {
      const runStub = SvcService.prototype.startServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['postgresql'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'startServices',
      sinon.stub().resolves('antikeycloakhertz')
    )
    .command(['svc start', 'keycloak'])
    .catch(error => {
      expect(error.message).to.contain(
        'Process killed by signal antikeycloakhertz'
      )
    })
    .it('start command unsuccessful - exits with signal', () => {
      const runStub = SvcService.prototype.startServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['keycloak'])
    })
})
