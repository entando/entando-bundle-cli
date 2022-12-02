import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'
import { SvcService } from '../../../src/services/svc-service'

describe('svc restart', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('my-bundle')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: ['keycloak', 'postgresql']
    })
  })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['svc restart', '--all'])
    .it('restart active services successfully', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker compose -p my-bundle -f svc/keycloak.yml -f svc/postgresql.yml restart keycloak postgresql'
      )
    })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['svc restart', 'keycloak'])
    .it('restart specific service keycloak', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker compose -p my-bundle -f svc/keycloak.yml restart keycloak'
      )
    })

  test
    .stderr()
    .command(['svc restart'])
    .catch(error => {
      expect(error.message).to.contain('At least one service name is required.')
    })
    .it('restart without any arguments and flags')

  test
    .stderr()
    .command(['svc restart', 'win2000'])
    .catch(error => {
      expect(error.message).to.contain('Service win2000 is not enabled.')
    })
    .it('restart an unlisted service')

  test
    .stderr()
    .stub(SvcService.prototype, 'restartServices', sinon.stub().resolves(403))
    .command(['svc restart', 'rabbitmq'])
    .catch(error => {
      expect(error.message).to.contain(
        'Restarting service(s) rabbitmq failed, exited with code 403'
      )
    })
    .it('restart command unsuccessful - exits with error code', () => {
      const runStub = SvcService.prototype.restartServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['rabbitmq'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'restartServices',
      sinon.stub().resolves(new Error('an error who needs no intro'))
    )
    .command(['svc restart', 'postgresql'])
    .catch(error => {
      expect(error.message).to.contain(
        'Command failed due to error: an error who needs no intro'
      )
    })
    .it('restart command unsuccessful - exits with Error instance', () => {
      const runStub = SvcService.prototype.restartServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['postgresql'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'restartServices',
      sinon.stub().resolves('mysqueal')
    )
    .command(['svc restart', 'mysql'])
    .catch(error => {
      expect(error.message).to.contain('Process killed by signal mysqueal')
    })
    .it('restart command unsuccessful - exits with signal', () => {
      const runStub = SvcService.prototype.restartServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['mysql'])
    })
})
