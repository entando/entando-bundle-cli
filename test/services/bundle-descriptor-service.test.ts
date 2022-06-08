import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../src/paths'
import {
  ConstraintsValidatorService,
  JsonValidationError
} from '../../src/services/constraints-validator-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { ComponentService } from '../../src/services/component-service'

describe('BundleDescriptorService', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  let bundleDir: string
  before(() => {
    bundleDir = tempDirHelper.createInitializedBundleDir()
  })

  beforeEach(() => {
    process.chdir(bundleDir)
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .do(() => {
      sinon
        .stub(ConstraintsValidatorService, 'validateObjectConstraints')
        .throws(
          new JsonValidationError('validation message', [
            'microservices',
            0,
            'name'
          ])
        )
      new BundleDescriptorService(bundleDir).validateBundleDescriptor()
    })
    .catch(error => {
      expect(error.message).contain(
        BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
      )
      expect(error.message).contain('validation message')
      expect(error.message).contain('Position: $.microservices[0].name')
    })
    .it('Error in JSON validation shows error position')

  test
    .do(() => {
      sinon.stub(ConstraintsValidatorService, 'validateObjectConstraints')
      sinon.stub(ComponentService.prototype, 'checkDuplicatedComponentNames')
      new BundleDescriptorService(bundleDir).validateBundleDescriptor()
    })
    .it('Checks for duplicate component names', () => {
      const checkStub = ComponentService.prototype
        .checkDuplicatedComponentNames as sinon.SinonStub
      expect(checkStub.called).to.equal(true)
    })
})
