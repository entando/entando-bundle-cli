import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'

describe('svc stop', () => {
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
      svc: ['keycloak', 'mysql']
    })
  })

  test
    .stdout()
    .stub(
      ProcessExecutorService,
      'executeProcess',
      sinon.stub().returns('docker-compose executed')
    )
    .command(['svc stop', '--all'])
    .it('stop active services successfully', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p my-bundle -f svc/keycloak.yml -f svc/mysql.yml stop'
      )
    })

  test
    .stdout()
    .stub(
      ProcessExecutorService,
      'executeProcess',
      sinon.stub().returns('docker-compose executed')
    )
    .command(['svc stop', 'keycloak'])
    .it('stop specific service keycloak', () => {
      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p my-bundle -f svc/keycloak.yml stop'
      )
    })

  test
    .stderr()
    .command(['svc stop'])
    .catch(error => {
      expect(error.message).to.contain('At least one service name is required.')
    })
    .it('stop without any arguments and flags')

  test
    .stderr()
    .command(['svc stop', 'macosx'])
    .catch(error => {
      expect(error.message).to.contain('Service macosx is not enabled.')
    })
    .it('stop an unlisted service')
})
