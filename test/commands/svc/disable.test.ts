import { expect, test } from '@oclif/test'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'

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
    .command(['svc disable', 'keycloak'])
    .it('disable a service successfully', () => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      expect(bundleDescriptor.svc).to.have.length(1)
      expect(bundleDescriptor.svc).to.deep.equal(['postgresql'])
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
