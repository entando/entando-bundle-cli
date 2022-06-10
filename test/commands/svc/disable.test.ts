import { expect, test } from '@oclif/test'
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
        'docker-compose -p sample-bundle -f svc/keycloak.yml rm -f -s'
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
})
