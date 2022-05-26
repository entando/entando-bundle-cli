import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BundleDescriptor } from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import TempDirHelper from '../../helpers/temp-dir-helper'

describe('mfe rm', () => {
  const defaultMfeName = 'default-stack-mfe'
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    microservices: [],
    microfrontends: [
      {
        name: 'default-stack-mfe',
        code: '123',
        titles: { en: 'Default Stack MFE' },
        stack: 'stack',
        group: 'group',
        customUiPath: ''
      }
    ]
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService = new BundleDescriptorService(process.cwd())
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .do(() => {
      fs.mkdirSync(
        path.resolve(tempBundleDir, 'microfrontends', 'default-stack-mfe')
      )
    })
    .command(['mfe rm', defaultMfeName])
    .it('removes a micro frontend', () => {
      const filePath: string = path.resolve(
        tempBundleDir,
        'microfrontends',
        defaultMfeName
      )
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath)).to.eq(false)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: []
      })
    })

  test
    .stderr()
    .command(['mfe rm', 'jojoma'])
    .catch(error => {
      expect(error.message).to.contain(
        'jojoma does not exist in the microfrontends section of the Bundle descriptor'
      )
    })
    .it(
      'exits with an error if the micro frontend does not exist in the descriptor'
    )

  test
    .stderr()
    .command(['mfe rm', defaultMfeName])
    .catch(error => {
      expect(error.message).to.contain(`does not exist`)
    })
    .it('exits with an error if the micro frontend folder does not exist')
})
