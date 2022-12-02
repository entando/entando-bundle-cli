import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'
import { SvcService } from '../../../src/services/svc-service'
import { CLIError } from '@oclif/errors'

describe('svc logs', () => {
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
    .command(['svc logs', '--all'])
    .it('display logs of active services successfully', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker compose -p my-bundle -f svc/keycloak.yml -f svc/postgresql.yml logs -f keycloak postgresql'
      )
    })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .command(['svc logs', 'keycloak'])
    .it('display logs of a specific service keycloak', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker compose -p my-bundle -f svc/keycloak.yml logs -f keycloak'
      )
    })

  test
    .stderr()
    .command(['svc logs'])
    .catch(error => {
      expect(error.message).to.contain('At least one service name is required.')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('display log command without any arguments and flags')

  test
    .stderr()
    .command(['svc logs', 'win2000'])
    .catch(error => {
      expect(error.message).to.contain('Service win2000 is not enabled.')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('display logs using an unlisted service')

  test
    .stderr()
    .stub(SvcService.prototype, 'logServices', sinon.stub().resolves(403))
    .command(['svc logs', 'rabbitmq'])
    .catch(error => {
      expect(error.message).to.contain(
        'Logs display service(s) rabbitmq failed, exited with code 403'
      )
      expect((error as CLIError).oclif.exit).eq(403)
    })
    .it('display logs command unsuccessful - exits with error code', () => {
      const runStub = SvcService.prototype.logServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['rabbitmq'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'logServices',
      sinon.stub().resolves(new Error('an error who needs no intro'))
    )
    .command(['svc logs', 'postgresql'])
    .catch(error => {
      expect(error.message).to.contain(
        'Command failed due to error: an error who needs no intro'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('display logs command unsuccessful - exits with Error instance', () => {
      const runStub = SvcService.prototype.logServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['postgresql'])
    })

  test
    .stderr()
    .stub(
      SvcService.prototype,
      'logServices',
      sinon.stub().resolves('mysqueal')
    )
    .command(['svc logs', 'mysql'])
    .catch(error => {
      expect(error.message).to.contain('Process killed by signal mysqueal')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('display logs command unsuccessful - exits with signal', () => {
      const runStub = SvcService.prototype.logServices as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.deep.equal(['mysql'])
    })
})
