import { expect, test } from '@oclif/test'
import TempDirHelper from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { MicroServiceService } from '../../../src/services/microservice-service'
import { MicroService } from '../../../src/models/bundle-descriptor'

describe('Remove MicroService', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-existing-ms')
      const ms: MicroService = {
        name: 'test-ms',
        image: 'test-image',
        dbms: 'mysql',
        stack: 'spring-boot'
      }
      const microServiceService = new MicroServiceService()
      microServiceService.addMicroService(ms)
      const bundleDescriptorService = new BundleDescriptorService(process.cwd())
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      expect(
        bundleDescriptor.microservices.some(ms => ms.name === 'test-ms')
      ).to.be.equal(true)
    })
    .command(['ms rm', 'test-ms'])
    .it('Removes an existing MicroService', function () {
      const bundleDescriptorService = new BundleDescriptorService(process.cwd())
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      expect(
        bundleDescriptor.microservices.some(ms => ms.name === 'test-ms')
      ).to.be.equal(false)
    })

  test
    .do(() => tempDirHelper.createInitializedBundleDir('test-bundle-no-ms'))
    .command(['ms rm', 'not-existing-bundle'])
    .catch(error => {
      expect(error.message).to.contain('not found')
    })
    .it("Returns error if MicroService to remove doesn't exist")

  test
    .do(() => tempDirHelper.createUninitializedBundleDir())
    .command(['ms rm', 'test-bundle'])
    .catch(error => {
      expect(error.message).to.contain('is not an initialized Bundle project')
    })
    .it('Returns error if Bundle directory not initialized')
})
