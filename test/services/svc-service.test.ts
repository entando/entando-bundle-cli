import { expect, test } from '@oclif/test'
import { CLIError } from '@oclif/errors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { SvcService } from '../../src/services/svc-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'

describe('svc-service', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
    fs.rmSync(path.resolve(bundleDirectory, 'svc', 'mysql.yml'))
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
  })

  afterEach(() => {
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: []
    })
  })

  test.it('run getAvailableServices method', () => {
    const svcService: SvcService = new SvcService(bundleDirectory)
    const services = svcService.getAvailableServices()
    expect(services).to.have.length(2)
    expect(services).to.includes('keycloak')
    expect(services).to.includes('postgresql')
    expect(services).to.not.includes('mysql')
  })

  test.it('enable a service successfully', () => {
    const svcService: SvcService = new SvcService(bundleDirectory)
    expect(() => svcService.enableService('keycloak')).to.not.throw(CLIError)
  })

  test.it('enable a service that does not exist in svc folder', () => {
    const svcService: SvcService = new SvcService(bundleDirectory)
    expect(() => svcService.enableService('macosx')).to.throw(CLIError)
  })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['postgresql']
      })
    })
    .it('enable a service that is already enabled', () => {
      const svcService: SvcService = new SvcService(bundleDirectory)
      expect(() => svcService.enableService('postgresql')).to.throw(CLIError)
    })

  test
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      delete bundleDescriptor.svc
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .it(
      'svc that is non-existent in bundle descriptor creates svc attribute',
      () => {
        const svcService: SvcService = new SvcService(bundleDirectory)
        expect(() => svcService.enableService('keycloak')).to.not.throw(
          CLIError
        )
        const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
        expect(bundleDescriptor).to.haveOwnProperty('svc')
      }
    )
})
