import { expect, test } from '@oclif/test'
import {
  ConstraintsValidatorService,
  JsonValidationError,
  UNION_TYPE_ERROR_MESSAGE
} from '../../src/services/constraints-validator-service'
import {
  BUNDLE_DESCRIPTOR_CONSTRAINTS,
  INVALID_NAME_MESSAGE
} from '../../src/models/bundle-descriptor-constraints'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'

describe('BundleDescriptorValidatorService', () => {
  test.it('No error thrown with valid object', () => {
    ConstraintsValidatorService.validateObjectConstraints(
      BundleDescriptorHelper.newBundleDescriptor(),
      BUNDLE_DESCRIPTOR_CONSTRAINTS
    )
  })

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microservices[0].name = undefined
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "name" is required')
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microservices[0].name'
      )
    })
    .it('Validates required field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'invalid-claim',
          type: 'invalid-type',
          serviceName: 'service-name'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "type" is not valid. Allowed values are: internal, external'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it('Validates field that allows only specific values')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'invalid-claim',
          type: 'external',
          serviceName: 'service-name'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "type" with value "external" requires field "bundle" to have a value'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it(
      'Validates union type with a field that requires another field to exist'
    )

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'invalid-claim',
          type: 'internal',
          serviceName: 'service-name',
          bundle: 'my-bundle'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "bundle" requires field "type" to have value: external'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it(
      'Validates union type with a field that requires another field to have a specific value'
    )

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = {}
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "apiClaims" should be an array')
      expect(error.message).contain('$.microfrontends[1].apiClaims')
    })
    .it('Validates object instead of array')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microservices = undefined
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "microservices" is required')
      expect((error as JsonValidationError).jsonPath).eq('$.microservices')
    })
    .it('Validates required array')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].titles = {
        en: {
          not: 'valid'
        }
      }
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "titles" is not valid. Should be a key-value map of strings'
      )
      expect(error.message).contain('$.microfrontends[0].titles')
    })
    .it('Validates microfrontend titles')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.description = []
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "description" is not valid. Should be a string'
      )
      expect((error as JsonValidationError).jsonPath).eq('$.description')
    })
    .it('Validates primitive field wrong type')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].name = 'invalid mfe name'
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "name" is not valid. ' + INVALID_NAME_MESSAGE
      )
      expect(error.message).contain('$.microfrontends[1].name')
    })
    .it('Validates name using RegExp')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'bad-claim',
          type: 'external',
          serviceName: 'my-service',
          bundle: 'http://hub.docker.com/r/entando/test2'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).not.contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain(
        'Field "bundle" is not valid. Valid format is <registry>/<organization>/<repository>'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0].bundle')
    })
    .it('Validates invalid bundle format containing http://')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'bad-claim',
          type: 'external',
          serviceName: 'my-service',
          bundle: 'entando/test2'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).not.contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain(
        'Field "bundle" is not valid. Valid format is <registry>/<organization>/<repository>'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0].bundle')
    })
    .it('Validates invalid bundle format missing the registry')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'bad-claim',
          type: 'external',
          serviceName: 'my-service'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).not.contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain(
        'Field "type" with value "external" requires field "bundle" to have a value'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it(
      'Validates mutual dependency between external API claim and bundle field'
    )

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'bad-claim',
          type: 'internal',
          serviceName: 'my-service',
          bundle: 'custom.registry.com/entando/my-bundle'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).not.contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain(
        'Field "bundle" requires field "type" to have value: external'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it(
      'Validates inverse mutual dependency between external API claim and bundle field'
    )

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'bad-claim',
          type: 'internal'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).not.contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain('Field "serviceName" is required')
      expect(error.message).contain(
        '$.microfrontends[1].apiClaims[0].serviceName'
      )
    })
    .it('Validates missing serviceName in API claim')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microservices[1].env = [
        {
          name: 'bad-env'
        }
      ]
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(UNION_TYPE_ERROR_MESSAGE)
      expect(error.message).contain('Field "value" is required')
      expect(error.message).contain('Position: $.microservices[1].env[0].value')
      expect(error.message).contain('Field "valueFrom" is required')
      expect(error.message).contain(
        'Position: $.microservices[1].env[0].valueFrom'
      )
    })
    .it('Validates microservice env field with no value or valueFrom fields')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'invalid-type'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "type" is not valid. Allowed values are: app-builder, widget, widget-config'
      )
      expect(error.message).contain('$.microfrontends[1].type')
    })
    .it('Validates micro frontend with invalid type field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'app-builder'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "type" with value "app-builder" requires field "slot" to have a value'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend app-builder type field dependency')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'widget'
      invalidDescriptor.microfrontends[1].slot = 'primary-header'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "slot" requires field "type" to have value: app-builder'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend slot field dependency')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'app-builder'
      invalidDescriptor.microfrontends[1].slot = 'invalid-slot'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "slot" is not valid. Allowed values are: primary-header, primary-menu, content'
      )
      expect(error.message).contain('$.microfrontends[1].slot')
    })
    .it('Validates micro frontend with invalid slot field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'app-builder'
      invalidDescriptor.microfrontends[1].slot = 'primary-header'
      invalidDescriptor.microfrontends[1].paths = []

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "paths" requires field "slot" to have value: content'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend paths field dependency')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'app-builder'
      invalidDescriptor.microfrontends[1].slot = 'content'
      invalidDescriptor.microfrontends[1].paths = 'adsf'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "paths" should be an array'
      )
      expect(error.message).contain('$.microfrontends[1].paths')
    })
    .it('Validates micro frontend with invalid paths field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'widget-config'
      invalidDescriptor.microfrontends[1].contextParams = 'pageCode'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "contextParams" requires field "type" to have value: widget'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend contextParams field dependency')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].type = 'widget'
      invalidDescriptor.microfrontends[1].contextParams = ['invalid-param']

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "contextParams" is not valid. Allowed values are: pageCode, langCode, applicationBaseUrl'
      )
      expect(error.message).contain('$.microfrontends[1].contextParams[0]')
    })
    .it('Validates micro frontend with invalid contextParams field')
})
