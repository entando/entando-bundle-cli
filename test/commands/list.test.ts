import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../../src/models/bundle-descriptor'
import BundleDescriptorService from '../../src/services/bundle-descriptor-service'

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

  let tmpDir: string
  let bundleDescriptorService: BundleDescriptorService

  before(() => {
    tmpDir = path.resolve(os.tmpdir(), bundleDescriptor.name)
    fs.mkdirSync(tmpDir)
    process.chdir(tmpDir)

    fs.mkdirSync('./microfrontends')
    fs.mkdirSync('./microservices')

    fs.mkdirSync(path.resolve('./microfrontends', 'mfe1'))
    fs.mkdirSync(path.resolve('./microfrontends', 'mfe2'))
    fs.mkdirSync(path.resolve('./microservices', 'ms1'))
    fs.mkdirSync(path.resolve('./microservices', 'ms2'))

    bundleDescriptorService = new BundleDescriptorService(process.cwd())
  })

  beforeEach(() => {
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)

    const mfe1PackageJSON: string = JSON.stringify({ version: '0.0.1' })
    const mfe2PackageJSON: string = JSON.stringify({ version: '0.0.2' })
    const ms1PomXML = '<project><version>0.1.1-SNAPSHOT</version></project>'
    const ms2PackageJSON: string = JSON.stringify({ version: '0.1.2' })

    fs.writeFileSync(
      path.resolve('./microfrontends', 'mfe1', 'package.json'),
      mfe1PackageJSON
    )
    fs.writeFileSync(
      path.resolve('./microfrontends', 'mfe2', 'package.json'),
      mfe2PackageJSON
    )
    fs.writeFileSync(
      path.resolve('./microservices', 'ms1', 'pom.xml'),
      ms1PomXML
    )
    fs.writeFileSync(
      path.resolve('./microservices', 'ms2', 'package.json'),
      ms2PackageJSON
    )
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .stdout()
    .command(['list'])
    .it('runs list', ctx => {
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
    .it('runs list --ms', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(
        /ms1\s+microservice\s+0\.1\.1-SNAPSHOT\s+spring-boot/
      )
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stdout()
    .command(['list', '--mfe'])
    .it('runs list --mfe', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
    })

  test
    .stdout()
    .command(['list', '--ms', '--mfe'])
    .it('runs list --ms --mfe', ctx => {
      const output: string = ctx.stdout

      expect(output).to.match(/mfe1\s+microfrontend\s+0\.0\.1\s+react/)
      expect(output).to.match(/mfe2\s+microfrontend\s+0\.0\.2\s+angular/)
      expect(output).to.match(
        /ms1\s+microservice\s+0\.1\.1-SNAPSHOT\s+spring-boot/
      )
      expect(output).to.match(/ms2\s+microservice\s+0\.1\.2\s+node/)
    })

  test
    .stderr()
    .do(() => {
      fs.writeFileSync(
        path.resolve('./microfrontends', 'mfe1', 'package.json'),
        JSON.stringify({})
      )
    })
    .command(['list'])
    .catch(error => {
      expect(error.message).to.contain(
        'Failed to get version of mfe1 microfrontend'
      )
    })
    .it('exits if an mfe component version cannot be obtained')

  test
    .stderr()
    .do(() => {
      fs.writeFileSync(
        path.resolve('./microservices', 'ms1', 'pom.xml'),
        '<project></project>'
      )
    })
    .command(['list'])
    .catch(error => {
      expect(error.message).to.contain(
        'Failed to get version of ms1 microservice'
      )
    })
    .it('exits if an ms component version cannot be obtained')

  test
    .stderr()
    .do(() => {
      fs.rmSync(path.resolve(tmpDir, 'bundle.json'), { force: true })
    })
    .command(['list'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})
