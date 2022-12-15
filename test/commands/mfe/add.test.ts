import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BUNDLE_DESCRIPTOR_FILE_NAME,
  GITKEEP_FILE,
  MICROFRONTENDS_FOLDER
} from '../../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroFrontendType,
  Microservice
} from '../../../src/models/bundle-descriptor'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { ComponentHelper } from '../../helpers/mocks/component-helper'
import {
  DEFAULT_VERSION,
  MicroFrontendStack
} from '../../../src/models/component'
import { CLIError } from '@oclif/errors'

describe('mfe add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-mfe-test',
    version: '0.0.1',
    type: 'bundle',
    microservices: [],
    microfrontends: []
  }

  const defaultMfeValues: Partial<MicroFrontend> = {
    stack: MicroFrontendStack.React,
    type: MicroFrontendType.Widget,
    group: 'free',
    publicFolder: 'public'
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string
  let microfrontendsDir: string

  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
    microfrontendsDir = path.resolve(tempBundleDir, MICROFRONTENDS_FOLDER)
    expect(fs.existsSync(path.join(microfrontendsDir, GITKEEP_FILE))).to.eq(
      true
    )
    fs.mkdirSync(path.resolve(microfrontendsDir, 'existing-mfe-dir'))
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .command(['mfe add', 'default-mfe'])
    .it('adds a micro frontend with default stack and type', () => {
      const mfeName = 'default-mfe'
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expectMfePathExists(mfeName)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...defaultMfeValues,
            name: mfeName,
            customElement: mfeName,
            titles: { en: mfeName, it: mfeName }
          }
        ]
      })
    })

  test
    .command(['mfe add', 'angular-mfe', '--stack', 'angular'])
    .it('adds a micro frontend with specified stack', () => {
      const mfeName = 'angular-mfe'
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expectMfePathExists(mfeName)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...defaultMfeValues,
            name: mfeName,
            customElement: mfeName,
            stack: 'angular',
            titles: { en: mfeName, it: mfeName }
          }
        ]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
      const microfrontends: MicroFrontend[] = [
        ComponentHelper.newMicroFrontend('mfe1')
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
        const dirCont: string[] = fs.readdirSync(microfrontendsDir)
        const { microfrontends } = bundleDescriptorService.getBundleDescriptor()

        expect(mfeNames.every(name => dirCont.includes(name))).to.eq(true)
        expect(microfrontends.every(({ name }) => mfeNames.includes(name)))
      }
    )

  test
    .command(['mfe add', 'widget-config-mfe', '--type', 'widget-config'])
    .it('adds a micro frontend with specified type', () => {
      const mfeName = 'widget-config-mfe'
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expectMfePathExists(mfeName)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...defaultMfeValues,
            name: mfeName,
            customElement: mfeName,
            type: 'widget-config'
          }
        ]
      })
    })

  test
    .command(['mfe add', 'invalid-slot-flag', '--slot', 'content'])
    .catch(error => {
      expect(error.message).to.contain(
        '--slot requires --type to be app-builder'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if --slot is used but type is not app-builder')

  test
    .stderr()
    .command(['mfe add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid Micro Frontend name')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if micro frontend name is invalid')

  test
    .stderr()
    .command(['mfe add', 'too-long'.repeat(20)])
    .catch(error => {
      expect(error.message).to.contain('Micro Frontend name is too long')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if micro frontend name is too long')

  test
    .stderr()
    .command(['mfe add', 'existing-mfe-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-dir already exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if mfe folder already exists')

  test
    .stderr()
    .do(() => {
      const microfrontends: MicroFrontend[] = [
        ComponentHelper.newMicroFrontend('existing-mfe-desc')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['mfe add', 'existing-mfe-desc'])
    .catch(error => {
      expect(error.message).to.contain('existing-mfe-desc already exists')
      expect((error as CLIError).oclif.exit).eq(2)
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
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if current folder is not a Bundle project')

  test
    .do(() => {
      const microservices: Microservice[] = [
        ComponentHelper.newMicroservice('component1')
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
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it(
      'exits with an error if another component with the same name already exists'
    )

  test
    .command(['mfe add', 'mfe-custom', '--stack', 'custom'])
    .it('adds a microfrontend with custom stack', () => {
      const mfeName = 'mfe-custom'
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expectMfePathExists(mfeName)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...defaultMfeValues,
            name: mfeName,
            customElement: mfeName,
            stack: MicroFrontendStack.Custom,
            commands: {
              run: "echo 'Please edit this command to customize the run phase' && exit 1",
              build:
                "echo 'Please edit this command to customize the build phase' && exit 1",
              pack: "echo 'Please edit this command to customize the pack phase' && exit 1"
            },
            version: DEFAULT_VERSION,
            titles: {
              en: mfeName,
              it: mfeName
            }
          }
        ]
      })
    })

  context('type is app-builder', () => {
    test
      .command(['mfe add', 'ab-default-slot-mfe', '--type', 'app-builder'])
      .it('adds an app-builder micro frontend with default slot', () => {
        const mfeName = 'ab-default-slot-mfe'
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()

        expectMfePathExists(mfeName)
        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...defaultMfeValues,
              name: mfeName,
              customElement: mfeName,
              type: 'app-builder',
              slot: 'content',
              paths: []
            }
          ]
        })
      })

    test
      .command([
        'mfe add',
        'ab-header-mfe',
        '--type',
        'app-builder',
        '--slot',
        'primary-header'
      ])
      .it('adds an app-builder micro frontend with specified slot', () => {
        const mfeName = 'ab-header-mfe'
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()

        expectMfePathExists(mfeName)
        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...defaultMfeValues,
              name: mfeName,
              customElement: mfeName,
              type: 'app-builder',
              slot: 'primary-header'
            }
          ]
        })
      })
  })

  test
    .command('mfe add')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('name')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if required argument is missing')

  function expectMfePathExists(mfeName: string) {
    const filePath: string = path.resolve(
      tempBundleDir,
      MICROFRONTENDS_FOLDER,
      mfeName
    )

    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
    expect(
      fs.existsSync(path.resolve(microfrontendsDir, GITKEEP_FILE)),
      `${GITKEEP_FILE} file wasn't removed`
    ).to.eq(false)
  }
})
