import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../src/paths'
import {
  ConstraintsValidatorService,
  JsonValidationError
} from '../../src/services/constraints-validator-service'
import { BundleService } from '../../src/services/bundle-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

describe('BundleService', () => {
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
      BundleService.verifyBundleInitialized(bundleDir)
    })
    .catch(error => {
      expect(error.message).contain(
        BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
      )
      expect(error.message).contain('validation message')
      expect(error.message).contain('Position: $.microservices[0].name')
    })
    .it('Error in JSON validation shows error position')
})
