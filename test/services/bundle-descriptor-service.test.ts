import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import {
  ConstraintsValidatorService,
  JsonValidationError
} from '../../src/services/constraints-validator-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { ComponentService } from '../../src/services/component-service'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../src/paths'
import {
  mocksExpectedErrorWithInput,
  mocksExpectedErrorWithInputOneLine
} from '../helpers/mocks/bundle-descriptor-helper'

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

  test
    .do(() => {
      const bundleDescriptorService = new BundleDescriptorService()
      bundleDescriptorService.writeDescriptor(
        `{"microservices": [{"name": "my-service","stack": "spring-boot","healthCheckPath": "/health"}]}`
      )
      sinon
        .stub(JSON, 'parse')
        .throws(new SyntaxError('error description without position number'))
      new BundleDescriptorService(bundleDir).validateBundleDescriptor()
    })
    .catch(error => {
      expect(error.message).contain(
        BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
      )
    })
    .it('Error in JSON parse without position')

  for (const [index, mock] of mocksExpectedErrorWithInput.entries()) {
    test
      .do(() => {
        const bundleDescriptorService = new BundleDescriptorService()
        bundleDescriptorService.writeDescriptor(mock.body)
        new BundleDescriptorService(bundleDir).validateBundleDescriptor()
      })
      .catch(error => {
        // debug
        // console.log(`error: ` + error.message)
        expect(error.message).contain(
          BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
        )
        expect(error.message).contain(
          'Malformed JSON at line ' + mock.expectedLineError
        )
      })
      .it(
        `Test with mock ${index} Error in JSON parse on line ${mock.expectedLineError}`
      )
  }

  test
    .do(() => {
      const bundleDescriptorService = new BundleDescriptorService()
      bundleDescriptorService.writeDescriptor(
        `{"microservices": [{"name": "my-service","stack": "spring-boot","healthCheckPath": "/health"}]}`
      )
      sinon
        .stub(JSON, 'parse')
        .throws(new Error('generic error from JSON parse'))
      new BundleDescriptorService(bundleDir).validateBundleDescriptor()
    })
    .catch(error => {
      expect(error.message).contain(
        BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
      )
    })
    .it('Generic Error from JSON parse')

  test
    .do(() => {
      const bundleDescriptorService = new BundleDescriptorService()
      bundleDescriptorService.writeDescriptor(
        `{
          "microservices": [
            {
              "name": "my-service",
              "stack": "spring-boot",
              "healthCheckPath": "/health"
            }
          ]
        }`
      )
      sinon.stub(JSON, 'parse').throws(new SyntaxError('position 64532'))
      new BundleDescriptorService(bundleDir).validateBundleDescriptor()
    })
    .catch(error => {
      expect(error.message).contain(
        BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
      )
      expect(error.message).contain('Malformed JSON at line 1')
    })
    .it('overflow position from JSON parse')

  for (const [index, mock] of mocksExpectedErrorWithInputOneLine.entries()) {
    test
      .do(() => {
        const bundleDescriptorService = new BundleDescriptorService()
        bundleDescriptorService.writeDescriptor(mock.body)
        new BundleDescriptorService(bundleDir).validateBundleDescriptor()
      })
      .catch(error => {
        // debug
        // console.log(`error: ` + error.message)
        expect(error.message).contain(
          BUNDLE_DESCRIPTOR_FILE_NAME + ' is not valid'
        )
        expect(error.message).contain(
          'Malformed JSON at line ' + mock.expectedLineError
        )

        expect(error.message).contain('and column')
      })
      .it(
        `Test with mocksOneLine with index ${index}. Error in JSON parse on line ${mock.expectedLineError}`
      )
  }
})
