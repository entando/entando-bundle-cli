import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as sinon from 'sinon'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { ProcessExecutorService } from '../../../src/services/process-executor-service'

describe('svc disable', () => {
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
      svc: ['keycloak', 'postgresql']
    })
  })

  test
    .stdout()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(fs, 'rmSync', sinon.stub().returns(1))
    .command(['svc disable', 'keycloak'])
    .it('disable a service successfully', () => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      expect(bundleDescriptor.svc).to.have.length(1)
      expect(bundleDescriptor.svc).to.deep.equal(['postgresql'])

      const runStub = ProcessExecutorService.executeProcess as sinon.SinonStub
      expect(runStub.called).to.equal(true)
      expect(runStub.args[0]).to.have.length(1)
      expect(runStub.args[0][0]).to.haveOwnProperty(
        'command',
        'docker-compose -p sample-bundle -f svc/keycloak.yml rm -f -s keycloak'
      )
    })

  test
    .stderr()
    .command(['svc disable', 'win386'])
    .catch(error => {
      expect(error.message).to.contain('Service win386 does not exist')
    })
    .it('disable a service that is unavailable')

  test
    .stderr()
    .command(['svc disable', 'mysql'])
    .catch(error => {
      expect(error.message).to.contain('Service mysql is not enabled')
    })
    .it('disable a service that is not enabled')

  test
    .command('svc disable')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('serviceName')
    })
    .it('exits with an error if required argument is missing')
})
