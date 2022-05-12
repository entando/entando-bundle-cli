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

    bundleDescriptorService = new BundleDescriptorService(process.cwd())
  })

  beforeEach(() => {
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
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
