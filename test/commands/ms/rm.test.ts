import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { MicroServiceService } from '../../../src/services/microservice-service'
import { MicroService } from '../../../src/models/bundle-descriptor'
import { MicroServiceStack } from '../../../src/models/component'
import { DESCRIPTORS_OUTPUT_FOLDER } from '../../../src/paths'

describe('Remove MicroService', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  test
    .do(() => {
      tempBundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-existing-ms'
      )
      const ms: MicroService = {
        name: 'test-ms',
        dbms: 'mysql',
        stack: MicroServiceStack.SpringBoot
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
      const outputPath: string = path.resolve(
        tempBundleDir,
        ...DESCRIPTORS_OUTPUT_FOLDER,
        'plugins',
        'test-ms'
      )

      expect(
        bundleDescriptor.microservices.some(ms => ms.name === 'test-ms')
      ).to.be.equal(false)
      expect(fs.existsSync(outputPath)).to.eq(false)
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
