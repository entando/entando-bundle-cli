import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BundleDescriptor,
  MicroFrontendType
} from '../../../src/models/bundle-descriptor'
import { MicroFrontendStack } from '../../../src/models/component'
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  GITKEEP_FILE,
  MICROFRONTENDS_FOLDER
} from '../../../src/paths'
import { BundleDescriptorConverterService } from '../../../src/services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../../helpers/temp-dir-helper'

describe('mfe rm', () => {
  const defaultMfeName = 'default-stack-mfe'
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    type: 'bundle',
    microservices: [],
    microfrontends: [
      {
        name: 'default-stack-mfe',
        customElement: 'default-stack-mfe',
        titles: { en: 'Default Stack MFE' },
        stack: MicroFrontendStack.React,
        type: MicroFrontendType.Widget,
        group: 'group',
        publicFolder: 'public',
        params: []
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
    bundleDescriptorService = new BundleDescriptorService()
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .do(() => {
      fs.mkdirSync(
        path.resolve(tempBundleDir, MICROFRONTENDS_FOLDER, 'default-stack-mfe')
      )

      const bundleDescriptorConverterService =
        new BundleDescriptorConverterService('test-docker-org')
      bundleDescriptorConverterService.generateYamlDescriptors({})
    })
    .command(['mfe rm', defaultMfeName])
    .it('removes a micro frontend', () => {
      const filePath: string = path.resolve(
        tempBundleDir,
        MICROFRONTENDS_FOLDER,
        defaultMfeName
      )
      const bundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()
      const outputDescriptorPath: string = path.resolve(
        tempBundleDir,
        ...DESCRIPTORS_OUTPUT_FOLDER,
        'widgets',
        'default-stack-mfe.yaml'
      )

      expect(fs.existsSync(filePath)).to.eq(false)
      expect(bundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: []
      })
      expect(fs.existsSync(outputDescriptorPath)).to.eq(false)
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

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-remove-all-mfe')
      expect(
        fs.existsSync(path.join(MICROFRONTENDS_FOLDER, GITKEEP_FILE))
      ).to.eq(true)
    })
    .command(['mfe add', 'mfe1'])
    .command(['mfe add', 'mfe2'])
    .command(['mfe rm', 'mfe1'])
    .do(() => {
      expect(
        fs.existsSync(path.join(MICROFRONTENDS_FOLDER, GITKEEP_FILE))
      ).to.eq(false)
    })
    .command(['mfe rm', 'mfe2'])
    .it(`restores ${GITKEEP_FILE} when last micro frontend is removed`, () => {
      expect(
        fs.existsSync(path.join(MICROFRONTENDS_FOLDER, GITKEEP_FILE))
      ).to.eq(true)
    })

  test
    .command('mfe rm')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('name')
    })
    .it('exits with an error if required argument is missing')
})
