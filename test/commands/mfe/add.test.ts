import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { ComponentHelper } from '../../helpers/mocks/components'

describe('mfe add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    type: 'bundle',
    microservices: [],
    microfrontends: []
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
    const microfrontendsDir = path.resolve(tempBundleDir, 'microfrontends')
    fs.mkdirSync(path.resolve(microfrontendsDir, 'existing-mfe-dir'))
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .command(['mfe add', 'default-stack-mfe'])
    .it('adds a micro frontend with default stack', () => {
      const mfeName = 'default-stack-mfe'
      const filePath: string = path.resolve(
        tempBundleDir,
        'microfrontends',
        mfeName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            name: mfeName,
            stack: 'react',
            group: 'free',
            titles: { en: mfeName, it: mfeName },
            publicFolder: 'public'
          }
        ]
      })
    })

  test
    .command(['mfe add', 'angular-mfe', '--stack', 'angular'])
    .it('adds a micro frontend with specified stack', () => {
      const mfeName = 'angular-mfe'
      const filePath: string = path.resolve(
        tempBundleDir,
        'microfrontends',
        mfeName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            name: mfeName,
            stack: 'angular',
            group: 'free',
            titles: { en: mfeName, it: mfeName },
            publicFolder: 'public'
          }
        ]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
      const microfrontends: MicroFrontend[] = [
        ComponentHelper.newMicroFrontEnd('mfe1')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['mfe add', 'mfe2'])
    .it(
      'adds a new micro frontend to bundle having an existing micro frontend',
      () => {
        const mfeNames = ['mfe1', 'mfe2']
        const dirCont: string[] = fs.readdirSync(
          path.resolve(tempBundleDir, 'microfrontends')
        )
        const { microfrontends } = bundleDescriptorService.getBundleDescriptor()

        expect(mfeNames.every(name => dirCont.includes(name))).to.eq(true)
        expect(microfrontends.every(({ name }) => mfeNames.includes(name)))
      }
    )

  test
    .stderr()
    .command(['mfe add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid Micro Frontend name')
    })
    .it('exists with an error if micro frontend name is invalid')

  test
    .stderr()
    .command(['mfe add', 'existing-mfe-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-dir already exists')
    })
    .it('exits with an error if mfe folder already exists')

  test
    .stderr()
    .do(() => {
      const microfrontends: MicroFrontend[] = [
        ComponentHelper.newMicroFrontEnd('existing-mfe-desc')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['mfe add', 'existing-mfe-desc'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-desc already exists')
    })
    .it('exits with an error if mfe descriptor already exists')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tempBundleDir, BUNDLE_DESCRIPTOR_FILE_NAME), {
        force: true
      })
    })
    .command(['mfe add', 'mfe-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits with an error if current folder is not a Bundle project')

  test
    .do(() => {
      const microservices: MicroService[] = [
        ComponentHelper.newMicroService('component1')
      ]

      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['mfe add', 'component1'])
    .catch(error => {
      expect(error.message).to.contain(
        'A component (microservice or micro frontend) with name component1 already exists'
      )
    })
    .it(
      'exits with an error if another component with the same name already exists'
    )
})
