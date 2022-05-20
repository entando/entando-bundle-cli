import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../src/models/bundle-descriptor'
import BundleDescriptorService from '../../src/services/bundle-descriptor-service'
import TempDirHelper from '../helpers/temp-dir-helper'

describe('list', () => {
  const bundleDescriptor: BundleDescriptor = {
    name: 'bundle-list-test',
    version: '0.0.1',
    microfrontends: <Array<MicroFrontend>>[
      { name: 'mfe1', stack: 'react' },
      { name: 'mfe2', stack: 'angular' }
    ],
    microservices: <Array<MicroService>>[
      { name: 'ms1', stack: 'spring-boot' },
      { name: 'ms2', stack: 'node' }
    ]
  }

  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string
  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir(
      bundleDescriptor.name
    )
    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
  })

  after(() => {
    fs.rmSync(path.resolve(tempBundleDir), { recursive: true, force: true })
  })

  test
    .stdout()
    .command(['list'])
    .it('runs list', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.1\s+angular/)
      expect(output).to.match(/ms1\s+microservice\s+0\.0\.1\s+spring-boot/)
      expect(output).to.match(/ms2\s+microservice\s+0\.0\.1\s+node/)
    })

  test
    .stdout()
    .command(['list', '--ms'])
    .it('runs list --ms', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/ms1\s+microservice\s+0\.0\.1\s+spring-boot/)
      expect(output).to.match(/ms2\s+microservice\s+0\.0\.1\s+node/)
    })

  test
    .stdout()
    .command(['list', '--mfe'])
    .it('runs list --mfe', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.1\s+angular/)
    })

  test
    .stdout()
    .command(['list', '--ms', '--mfe'])
    .it('runs list --ms --mfe', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.1\s+angular/)
      expect(output).to.match(/ms1\s+microservice\s+0\.0\.1\s+spring-boot/)
      expect(output).to.match(/ms2\s+microservice\s+0\.0\.1\s+node/)
    })

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tempBundleDir, 'bundle.json'), { force: true })
    })
    .command(['list'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})
