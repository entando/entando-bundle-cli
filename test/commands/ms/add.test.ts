import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BUNDLE_DESCRIPTOR_FILE_NAME,
  GITKEEP_FILE,
  MICROSERVICES_FOLDER
} from '../../../src/paths'
import {
  BundleDescriptor,
  Microservice,
  MicroFrontend
} from '../../../src/models/bundle-descriptor'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { ComponentHelper } from '../../helpers/mocks/component-helper'
import {
  DEFAULT_VERSION,
  MicroserviceStack
} from '../../../src/models/component'
import { CLIError } from '@oclif/errors'

describe('ms add', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-ms-test',
    version: '0.0.1',
    type: 'bundle',
    microservices: [],
    microfrontends: []
  }

  const defaultMsValues: Partial<Microservice> = {
    stack: MicroserviceStack.SpringBoot,
    healthCheckPath: '/api/health'
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string
  let microservicesDir: string

  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
    microservicesDir = path.resolve(tempBundleDir, MICROSERVICES_FOLDER)
    expect(fs.existsSync(path.join(microservicesDir, GITKEEP_FILE))).to.eq(true)
    fs.mkdirSync(path.resolve(microservicesDir, 'existing-ms-dir'))
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  test
    .command(['ms add', 'default-ms'])
    .it('adds a microservice with default values', () => {
      const msName = 'default-ms'
      const filePath: string = path.resolve(
        tempBundleDir,
        MICROSERVICES_FOLDER,
        msName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(
        fs.existsSync(path.join(microservicesDir, GITKEEP_FILE)),
        `${GITKEEP_FILE} file wasn't removed`
      ).to.eq(false)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [
          {
            ...defaultMsValues,
            name: msName
          }
        ]
      })
    })

  test
    .command(['ms add', 'node-ms', '--stack', 'node'])
    .it('adds a microservice with specified stack', () => {
      const msName = 'node-ms'
      const filePath: string = path.resolve(
        tempBundleDir,
        MICROSERVICES_FOLDER,
        msName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [
          {
            ...defaultMsValues,
            name: msName,
            stack: 'node'
          }
        ]
      })
    })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempBundleDir, MICROSERVICES_FOLDER, 'ms1'))
      const microservices: Microservice[] = [
        ComponentHelper.newMicroservice('ms1')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['ms add', 'ms2'])
    .it(
      'adds a new microservice to bundle having an existing microservice',
      () => {
        const msNames = ['ms1', 'ms2']
        const dirCont: string[] = fs.readdirSync(microservicesDir)
        const { microservices } = bundleDescriptorService.getBundleDescriptor()

        expect(msNames.every(name => dirCont.includes(name))).to.eq(true)
        expect(microservices.every(({ name }) => msNames.includes(name)))
      }
    )

  test
    .stderr()
    .command(['ms add', 'invalid name'])
    .catch(error => {
      expect(error.message).to.contain('not a valid microservice name')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if microservice name is invalid')

  test
    .stderr()
    .command(['ms add', 'too-long'.repeat(20)])
    .catch(error => {
      expect(error.message).to.contain('Microservice name is too long')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if microservice name is too long')

  test
    .stderr()
    .command(['ms add', 'existing-ms-dir'])
    .catch(error => {
      expect(error.message).to.contain('existing-ms-dir already exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if ms folder already exists')

  test
    .stderr()
    .do(() => {
      const microservices: Microservice[] = [
        ComponentHelper.newMicroservice('existing-ms-desc')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices
      })
    })
    .command(['ms add', 'existing-ms-desc'])
    .catch(error => {
      expect(error.message).to.contain('existing-ms-desc already exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if ms descriptor already exists')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tempBundleDir, BUNDLE_DESCRIPTOR_FILE_NAME), {
        force: true
      })
    })
    .command(['ms add', 'ms-in-notbundleproject'])
    .catch(error => {
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if current folder is not a Bundle project')

  test
    .do(() => {
      const microfrontends: MicroFrontend[] = [
        ComponentHelper.newMicroFrontend('component1')
      ]
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends
      })
    })
    .command(['ms add', 'component1'])
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
    .command('ms add')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('name')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if required argument is missing')

  test
    .command(['ms add', 'ms-custom', '--stack', 'custom'])
    .it('adds a microservice with custom stack', () => {
      const msName = 'ms-custom'
      const filePath: string = path.resolve(
        tempBundleDir,
        MICROSERVICES_FOLDER,
        msName
      )
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()

      expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
      expect(
        fs.existsSync(path.join(microservicesDir, GITKEEP_FILE)),
        `${GITKEEP_FILE} file wasn't removed`
      ).to.eq(false)
      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microservices: [
          {
            ...defaultMsValues,
            name: msName,
            stack: MicroserviceStack.Custom,
            commands: {
              run: "echo 'Please edit this command to customize the run phase' && exit 1",
              build:
                "echo 'Please edit this command to customize the build phase' && exit 1",
              pack: "echo 'Please edit this command to customize the pack phase' && exit 1"
            },
            version: DEFAULT_VERSION
          }
        ]
      })
    })
})
