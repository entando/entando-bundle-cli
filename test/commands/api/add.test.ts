import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import { BundleDescriptor, MicroFrontend, MicroService } from '../../../src/models/bundle-descriptor'
import { MfeConfig } from '../../../src/models/mfe-config'

describe('api add', () => {
  let bundleDescriptor: BundleDescriptor
  let tmpDir: string

  before(() => {
    tmpDir = path.resolve(os.tmpdir(), 'bundle-api-test')
    fs.mkdirSync(tmpDir)
    fs.mkdirSync(path.resolve(tmpDir, 'microfrontends', 'mfe1'), { recursive: true })
  })

  beforeEach(() => {
    bundleDescriptor = {
      name: 'bundle-api-test',
      version: '0.0.1',
      type: 'bundle',
      microservices: <Array<MicroService>>[
        { name: 'ms1', stack: 'spring-boot' }
      ],
      microfrontends: <Array<MicroFrontend>>[
        { name: 'mfe1', stack: 'react' }
      ]
    }

    process.chdir(tmpDir)
    writeBundleDescriptor(bundleDescriptor)
    writeMfeConfig('mfe1', {})
  })

  after(() => {
    fs.rmSync(path.resolve(tmpDir), { recursive: true, force: true })
  })

  test
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .it('runs api add mfe1 ms1-api --serviceId ms1 --serviceUrl http://localhost:8080', () => {
      const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [{
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            { name: 'ms1-api', type: 'internal', serviceId: 'ms1' }
          ]
        }]
      })

      expect(updatedMfeConfig).to.eql({
        api: { 'ms1-api': { url: 'http://localhost:8080' } }
      })
    })

  test
    .do(() => {
      const microservices = <Array<MicroService>>[...bundleDescriptor.microservices, { name: 'ms2', stack: 'node' }]
      const microfrontends = <Array<MicroFrontend>>[{
        ...bundleDescriptor.microfrontends[0], apiClaims: [{ name: 'ms1-api', type: 'internal', serviceId: 'ms1' }]
      }]
      bundleDescriptor = { ...bundleDescriptor, microfrontends, microservices }
      writeBundleDescriptor(bundleDescriptor)
      writeMfeConfig('mfe1', { api: { 'ms1-api': { url: 'http://localhost:8080' } } })
    })
    .command(['api add', 'mfe1', 'ms2-api', '--serviceId', 'ms2', '--serviceUrl', 'http://localhost:8081'])
    .it('runs api add mfe1 ms2-api --serviceId ms2 --serviceUrl http://localhost:8081', () => {
      const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [{
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            { name: 'ms1-api', type: 'internal', serviceId: 'ms1' },
            { name: 'ms2-api', type: 'internal', serviceId: 'ms2' }
          ]
        }]
      })

      expect(updatedMfeConfig).to.eql({
        api: {
          'ms1-api': { url: 'http://localhost:8080' },
          'ms2-api': { url: 'http://localhost:8081' }
        }
      })
    })

  test
    .do(() => {
      fs.rmSync(path.resolve('microfrontends', 'mfe1', 'mfe-config.json'))
    })
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .it('runs api add mfe1 ms1-api --serviceId ms1 --serviceUrl http://localhost:8080', () => {
      const updatedBundleDescriptor: BundleDescriptor = getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [{
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            { name: 'ms1-api', type: 'internal', serviceId: 'ms1' }
          ]
        }]
      })

      expect(updatedMfeConfig).to.eql({
        api: { 'ms1-api': { url: 'http://localhost:8080' } }
      })
    })

  test
    .stderr()
    .do(() => {
      writeBundleDescriptor({
        ...bundleDescriptor,
        microfrontends: []
      })
    })
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .catch(error => {
      expect(error.message).to.contain('mfe1 does not exist')
    })
    .it('exits if microfrontend does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      writeBundleDescriptor({
        ...bundleDescriptor,
        microservices: []
      })
    })
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .catch(error => {
      expect(error.message).to.contain('ms1 does not exist')
    })
    .it('exits if microservice does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      const microfrontends = <Array<MicroFrontend>>[{
        ...bundleDescriptor.microfrontends[0], apiClaims: [{ name: 'ms1-api', type: 'internal', serviceId: 'ms1' }]
      }]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      writeBundleDescriptor(bundleDescriptor)
    })
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .catch(error => {
      expect(error.message).to.contain('API claim ms1-api already exists')
    })
    .it('exits if API claim already exists')

  test
    .stderr()
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'invalidurl'])
    .catch(error => {
      expect(error.message).to.contain('invalidurl is not a valid URL')
    })
    .it('exits if serviceUrl is not a valid URL')

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command(['api add', 'mfe1', 'ms1-api', '--serviceId', 'ms1', '--serviceUrl', 'http://localhost:8080'])
    .catch(error => {
      expect(error.message).to.contain('not an initialized Bundle project')
    })
    .it('exits if current folder is not a Bundle project')
})

function writeBundleDescriptor(bundleDescriptor: BundleDescriptor): void {
  fs.writeFileSync(BUNDLE_DESCRIPTOR_FILE_NAME, JSON.stringify(bundleDescriptor))
}

function writeMfeConfig(mfeName: string, mfeConfig: MfeConfig): void {
  fs.writeFileSync(path.resolve('microfrontends', mfeName, 'mfe-config.json'), JSON.stringify(mfeConfig))
}

function getBundleDescriptor(): BundleDescriptor {
  return JSON.parse(fs.readFileSync(BUNDLE_DESCRIPTOR_FILE_NAME, 'utf-8'))
}

function getMfeConfig(mfeName: string): MfeConfig {
  return JSON.parse(fs.readFileSync(path.resolve('microfrontends', mfeName, 'mfe-config.json'), 'utf-8'))
}
