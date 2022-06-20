import { expect, test } from '@oclif/test'
import { ApiClaimService } from '../../src/services/api-claim-service'
import * as sinon from 'sinon'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import { ComponentHelper } from '../helpers/mocks/component-helper'
import { ApiType } from '../../src/models/bundle-descriptor'
import { MfeConfigService } from '../../src/services/mfe-config-service'

describe('ApiClaimService', () => {
  afterEach(() => {
    sinon.restore()
  })

  test
    .do(() => {
      const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()

      const mfeNoClaims = ComponentHelper.newMicroFrontend('mfe-no-claims')
      mfeNoClaims.apiClaims = undefined

      bundleDescriptor.microfrontends = [mfeNoClaims]

      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(bundleDescriptor)

      const apiClaimService = new ApiClaimService()
      apiClaimService.removeApiClaim('mfe-no-claims', 'my-claim')
    })
    .catch(error => {
      expect(error.message).eq('API claim named my-claim does not exist')
    })
    .it('Removing API claim from MFE having undefined claims array')

  test.it('Removing API claim when MFE config API array is undefined', () => {
    const bundleDescriptor = BundleDescriptorHelper.newBundleDescriptor()

    const myMfe = ComponentHelper.newMicroFrontend('my-mfe')
    myMfe.apiClaims = [
      {
        name: 'my-claim',
        type: ApiType.Internal,
        serviceName: 'my-service'
      }
    ]

    bundleDescriptor.microfrontends = [myMfe]

    sinon
      .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
      .returns(bundleDescriptor)
    sinon.stub(BundleDescriptorService.prototype, 'writeBundleDescriptor')
    sinon.stub(MfeConfigService.prototype, 'getMfeConfig').returns({})
    const writeMfeConfigStub = sinon.stub(
      MfeConfigService.prototype,
      'writeMfeConfig'
    )

    const apiClaimService = new ApiClaimService()
    apiClaimService.removeApiClaim('my-mfe', 'my-claim')

    sinon.assert.calledWith(writeMfeConfigStub, 'my-mfe', {})
  })
})
