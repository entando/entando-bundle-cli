import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../src/paths'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../src/models/bundle-descriptor'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

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

    fs.mkdirSync(path.resolve('microfrontends', 'mfe1'))
    fs.mkdirSync(path.resolve('microfrontends', 'mfe2'))
    fs.mkdirSync(path.resolve('microservices', 'ms1'))
    fs.mkdirSync(path.resolve('microservices', 'ms2'))

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
  })

  beforeEach(() => {
    process.chdir(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)

    const mfe1PackageJSON: string = JSON.stringify({ version: '0.0.1' })
    const mfe2PackageJSON: string = JSON.stringify({ version: '0.0.2' })
    const ms1PomXML = '<project><version>0.1.1-SNAPSHOT</version></project>'
    const ms2PackageJSON: string = JSON.stringify({ version: '0.1.2' })

    fs.writeFileSync(
      path.resolve('microfrontends', 'mfe1', 'package.json'),
      mfe1PackageJSON
    )
    fs.writeFileSync(
      path.resolve('microfrontends', 'mfe2', 'package.json'),
      mfe2PackageJSON
    )
    fs.writeFileSync(path.resolve('microservices', 'ms1', 'pom.xml'), ms1PomXML)
    fs.writeFileSync(
      path.resolve('microservices', 'ms2', 'package.json'),
      ms2PackageJSON
    )
  })

  test
    .stdout()
    .command(['list'])
    .it('lists all components', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
      expect(output).to.match(
        /ms1\s+microservice\s+0\.1\.1-SNAPSHOT\s+spring-boot/
      )
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stdout()
    .command(['list', '--ms'])
    .it('lists only microservice components', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(
        /ms1\s+microservice\s+0\.1\.1-SNAPSHOT\s+spring-boot/
      )
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stdout()
    .command(['list', '--mfe'])
    .it('lists only micro frontend components', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
    })

  test
    .stdout()
    .command(['list', '--ms', '--mfe'])
    .it('lists micro frontend and microservice components', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
      expect(output).to.match(
        /ms1\s+microservice\s+0\.1\.1-SNAPSHOT\s+spring-boot/
      )
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stdout()
    .do(() => {
      fs.rmSync(path.resolve('./microfrontends', 'mfe1', 'package.json'))
      fs.rmSync(path.resolve('./microservices', 'ms1', 'pom.xml'))
    })
    .command(['list'])
    .it('lists all components including ones without versions', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+undefined\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
      expect(output).to.match(/ms1\s+microservice\s+undefined\s+spring-boot/)
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tempBundleDir, BUNDLE_DESCRIPTOR_FILE_NAME), {
        force: true
      })
    })
    .command(['list'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits with an error if current folder is not a Bundle project')
})
