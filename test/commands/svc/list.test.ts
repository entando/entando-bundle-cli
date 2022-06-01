import { expect, test } from '@oclif/test'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'

describe('svc list', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: ['postgresql']
    })
  })

  test
    .stdout()
    .command(['svc list'])
    .it('list active services successfully', ctx => {
      expect(ctx.stdout).to.contain('postgresql')
      expect(ctx.stdout).to.not.contain('keycloak')
      expect(ctx.stdout).to.not.contain('mysql')
    })

  test
    .stdout()
    .command(['svc list', '--available'])
    .it('list available services', ctx => {
      expect(ctx.stdout).to.not.contain('postgresql')
      expect(ctx.stdout).to.contain('keycloak')
      expect(ctx.stdout).to.contain('mysql')
    })
})
