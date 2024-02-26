import { expect, test } from '@oclif/test'
import {
  ConstraintsValidatorService,
  JsonValidationError,
  UNION_TYPE_ERROR_MESSAGE
} from '../../src/services/constraints-validator-service'
import {
  BUNDLE_DESCRIPTOR_CONSTRAINTS,
  INVALID_NAME_MESSAGE,
  INVALID_VERSION_MESSAGE,
  VALID_CONTEXT_PARAM_FORMAT
} from '../../src/models/bundle-descriptor-constraints'
import {
  BundleDescriptorHelper,
  mockBundleWithInvalidBundleDescriptorVersion
} from '../helpers/mocks/bundle-descriptor-helper'
import { YamlBundleDescriptor } from '../../src/models/yaml-bundle-descriptor'
import { YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS } from '../../src/models/yaml-bundle-descriptor-constraints'
import {
  MicroFrontendStack,
  MicroserviceStack
} from '../../src/models/component'
import * as sinon from 'sinon'
import { existsSyncMock } from '../helpers/mocks/validator-helper'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

describe('BundleDescriptorValidatorService', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  test.it('No error thrown with valid object', () => {
    ConstraintsValidatorService.validateObjectConstraints(
      BundleDescriptorHelper.newBundleDescriptor(),
      BUNDLE_DESCRIPTOR_CONSTRAINTS
    )
  })

  test
    .do(() => {
      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDir = tempDirHelper.createInitializedBundleDir()
      process.chdir(bundleDir)
      bundleDescriptorService.writeDescriptor(mockBundleWithInvalidBundleDescriptorVersion)
      const invalidDescriptor = bundleDescriptorService.getBundleDescriptor();
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "bundleDescriptorVersion" is not valid. Allowed values are: v5, v6')
    })
    .it('Validates invalid bundleDescriptorVersion')

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
    .it('Validates microservice required name field')

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
    .it('Validates api claim with invalid type field')

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
        'One field between "bundle" and "bundleReference" must be set.'
      )
      expect(error.message).contain('$.microfrontends[1].apiClaims[0]')
    })
    .it('Validates external api claim type field dependency')

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
    .it('Validates api claim bundle field dependency')

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
    .it('Validates micro frontend with invalid apiClaims field')

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
    .it('Validates required microservices array')

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
      invalidDescriptor.microfrontends[1].stack = 'invalid-stack'
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "stack" is not valid. Allowed values are: react, angular'
      )
      expect(error.message).contain('$.microfrontends[1].stack')
    })
    .it('Validates micro frontend with invalid stack field')

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
        'Field "bundle" is not valid. Valid format is [docker://]<registry>/<organization>/<repository>'
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
        'Field "bundle" is not valid. Valid format is [docker://]<registry>/<organization>/<repository>'
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
        'One field between "bundle" and "bundleReference" must be set.'
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
      const category = 'category'
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].category = category
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it('No error thrown with micro frontend of type widget and category field')

  test
    .do(() => {
      const category = 'too-long'.repeat(20)
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].category = category
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "category" is too long. The maximum length is 80'
      )
      expect(error.message).contain('$.microfrontends[0]')
    })
    .it('Validates micro frontend of type widget and category too long')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[2].category = 'test'
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "category" requires field "type" to have value: widget'
      )
      expect(error.message).contain('$.microfrontends[2]')
    })
    .it('Validates micro frontend with invalid category for type app-builder ')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].category = 'test'
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "category" requires field "type" to have value: widget'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })

    .it('Validates micro frontend with invalid category for type config ')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].titles = {
        ...invalidDescriptor.microfrontends[0].titles
      }
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
      invalidDescriptor.microfrontends[0].name = 'mfe-name'
      invalidDescriptor.microfrontends[0].configMfe = 'mfe-name'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "configMfe" value must not be equal to field "name" value'
      )
      expect(error.message).contain('$.microfrontends[0]')
    })
    .it('Validates micro frontend with invalid name and configMfe')

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
      expect(error.message).contain('Field "paths" should be an array')
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
      invalidDescriptor.microfrontends[1].titles = {
        ...invalidDescriptor.microfrontends[0].titles
      }
      invalidDescriptor.microfrontends[1].type = 'widget'
      invalidDescriptor.microfrontends[1].contextParams = ['invalid-param']

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(VALID_CONTEXT_PARAM_FORMAT)
      expect(error.message).contain('$.microfrontends[1].contextParams[0]')
    })
    .it('Validates micro frontend with invalid contextParams field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].nav = 'invalidvalue'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "nav" should be an array')
      expect(error.message).contain('$.microfrontends[1].nav')
    })
    .it('Validates micro frontend with invalid nav field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].params = 'invalidvalue'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "params" should be an array')
      expect(error.message).contain('$.microfrontends[0].params')
    })
    .it('Validates micro frontend with invalid params field')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].configMfe = 'config-mfe'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "configMfe" requires field "type" to have value: widget'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend configMfe field dependency')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].configMfe = 'test-mfe-1'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "configMfe" value must not be equal to field "name" value'
      )
      expect(error.message).contain('$.microfrontends[0]')
    })
    .it(
      'Validates widget micro frontend with configMfe field value equal to name field value'
    )

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.name = 'too-long'.repeat(20)

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "name" is too long')
      expect(error.message).contain('$.name')
    })
    .it('Validates bundle name too long')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microservices[0].name = 'too-long'.repeat(20)

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "name" is too long')
      expect(error.message).contain('$.microservices[0].name')
    })
    .it('Validates microservices name too long')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].name = 'too-long'.repeat(20)

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "name" is too long')
      expect(error.message).contain('$.microfrontends[0].name')
    })
    .it('Validates microfrontend name too long')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microservices[0].ingressPath = 'too-long'.repeat(20)

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "ingressPath" is too long')
      expect(error.message).contain('$.microservices[0].ingressPath')
    })
    .it('Validates ingressPath too long')

  testInvalidBundleName('--starts-with-separator')
  testInvalidBundleName('ends-with-separator--')
  testInvalidBundleName('invalid___separator')
  testInvalidBundleName('invalid..separator')
  testInvalidBundleName('INVALID-NAME')
  testInvalidBundleName('invalid name with spaces')

  function testInvalidBundleName(invalidBundleName: string) {
    test
      .do(() => {
        const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
        invalidDescriptor.name = invalidBundleName
        ConstraintsValidatorService.validateObjectConstraints(
          invalidDescriptor,
          BUNDLE_DESCRIPTOR_CONSTRAINTS
        )
      })
      .catch(error => {
        expect(error.message).contain(
          'Field "name" is not valid. ' + INVALID_NAME_MESSAGE
        )
        expect(error.message).contain('$.name')
      })
      .it(`Validates invalid bundle name "${invalidBundleName}"`)
  }

  test
    .do(() => {
      const validDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      validDescriptor.name = 'this-name-is.valid-123.abc'
      ConstraintsValidatorService.validateObjectConstraints(
        validDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it('Validates valid bundle name')

  testInvalidBundleVersion('.invalid-start-with-period')
  testInvalidBundleVersion('-invalid-start-with-dash')
  testInvalidBundleVersion('invalid version')

  function testInvalidBundleVersion(invalidVersion: string) {
    test
      .do(() => {
        const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
        invalidDescriptor.version = invalidVersion
        ConstraintsValidatorService.validateObjectConstraints(
          invalidDescriptor,
          BUNDLE_DESCRIPTOR_CONSTRAINTS
        )
      })
      .catch(error => {
        expect(error.message).contain(
          'Field "version" is not valid. ' + INVALID_VERSION_MESSAGE
        )
        expect(error.message).contain('$.version')
      })
      .it(`Validates invalid bundle version "${invalidVersion}"`)
  }

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.version = 'x'.repeat(500)
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "version" is too long')
      expect(error.message).contain('$.version')
    })
    .it('Validates bundle version too long')

  test
    .do(() => {
      const validDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      validDescriptor.version = '__this---version__is.VALID-123_abc__'
      ConstraintsValidatorService.validateObjectConstraints(
        validDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it('Validates valid bundle version')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[1].parentName = 'test name'
      invalidDescriptor.microfrontends[1].parentCode = 'test_code'

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "parentName" cannot be present alongside field "parentCode"'
      )
      expect(error.message).contain('$.microfrontends[1]')
    })
    .it('Validates micro frontend exclusive fields parentName and parentCode')

  test
    .do(() => {
      const invalidDescriptor: any =
        BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].paramsDefaults = {
        testParam: { a: 'invalid' }
      }
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "paramsDefaults" is not valid. Should be a key-value map of strings'
      )
      expect(error.message).contain('$.microfrontends[0].paramsDefaults')
    })
    .it('Validates micro frontend paramsDefaults')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      invalidDescriptor.microfrontends[0].stack = MicroFrontendStack.Custom
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Component "test-mfe-1" requires the "commands" fields since it has a custom stack'
      )
      expect(error.message).contain('$.microfrontends[0]')
    })
    .it('Validates microfrontend with custom stack and no commands')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      const microservice = invalidDescriptor.microservices[0]
      microservice.stack = MicroserviceStack.Custom
      microservice.commands = {
        build: 'custom-build.sh'
      }
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Component "test-ms-spring-boot-1" requires to specify the "run" command since it has a custom stack'
      )
      expect(error.message).contain('$.microservices[0]')
    })
    .it('Validates microservice with custom stack and some missing commands')

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      const microservice = invalidDescriptor.microservices[0]
      microservice.stack = MicroserviceStack.Custom
      microservice.commands = {
        build: 'custom-build.sh',
        run: 'custom-run.sh',
        pack: 'custom-pack.sh'
      }
      microservice.version = '1.0.0'
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it(
      'Validates microservice with custom stack, all the commands and version'
    )

  test
    .do(() => {
      const invalidDescriptor = BundleDescriptorHelper.newBundleDescriptor()
      const microservice = invalidDescriptor.microservices[0]
      microservice.stack = MicroserviceStack.Custom
      microservice.commands = {
        build: 'custom-build.sh',
        run: 'custom-run.sh',
        pack: 'custom-pack.sh'
      }
      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Component "test-ms-spring-boot-1" requires the "version" fields since it has a custom stack'
      )
      expect(error.message).contain('$.microservices[0]')
    })
    .it(
      'Validates microservice with custom stack and all the commands but without version'
    )

  test
    .do(() => {
      const validDescriptor: any = BundleDescriptorHelper.newBundleDescriptor()
      ConstraintsValidatorService.validateObjectConstraints(
        validDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it('Validates microfrontend with "customElement" and no ftl file')

  test
    .do(() => {
      const invalidDescriptor: any = {
        ...BundleDescriptorHelper.newBundleDescriptor()
      }
      const mfe = invalidDescriptor.microfrontends[1]

      existsSyncMock(mfe.name, true)

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "customElement" is not allowed with custom template (ftl)'
      )
    })
    .it('Validates microfrontend with "customElement" and ftl file')

  test
    .do(() => {
      const invalidDescriptor: any = {
        ...BundleDescriptorHelper.newBundleDescriptor()
      }
      delete invalidDescriptor.microfrontends[1].customElement

      ConstraintsValidatorService.validateObjectConstraints(
        invalidDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "customElement" is required without custom template (ftl)'
      )
    })
    .it('Validates microfrontend with no "customElement" and no ftl file')

  test
    .do(() => {
      const validDescriptor: any = {
        ...BundleDescriptorHelper.newBundleDescriptor()
      }
      const mfe = validDescriptor.microfrontends[1]
      delete mfe.customElement

      existsSyncMock(mfe.name, true)

      ConstraintsValidatorService.validateObjectConstraints(
        validDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it('Validates microfrontend with no "customElement" and with ftl file')

  test
    .do(() => {
      const validDescriptor: any = {
        ...BundleDescriptorHelper.newBundleDescriptor()
      }
      const mfe = validDescriptor.microfrontends[1]
      delete mfe.customElement
      mfe.customUiPath = `${mfe.name}.ftl`

      existsSyncMock(mfe.name, true)

      ConstraintsValidatorService.validateObjectConstraints(
        validDescriptor,
        BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .it(
      'Validates microfrontend with no "customElement", with ftl file and "customUiPath"'
    )
})

describe('Validates YAML descriptor', () => {
  it('Validates valid YAML descriptor', () => {
    const yamlBundleDescriptor: YamlBundleDescriptor = {
      name: 'test-bundle',
      descriptorVersion: 'v6',
      components: {
        widgets: ['widgets/mfe1.yaml', 'widgets/mfe2.yaml'],
        plugins: ['plugins/my-service.yaml']
      },
      ext: {
        nav: [
          {
            label: {
              en: 'Entando Developers'
            },
            target: 'external',
            url: 'https://developer.entando.com/'
          }
        ]
      }
    }

    ConstraintsValidatorService.validateObjectConstraints(
      yamlBundleDescriptor,
      YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS
    )
  })

  test
    .do(() => {
      const yamlBundleDescriptor: YamlBundleDescriptor = {
        name: 'test-bundle',
        descriptorVersion: 'v6',
        components: {},
        ext: {
          nav: [
            {
              label: {
                en: 'Entando Developers'
              },
              target: 'platform',
              url: 'https://developer.entando.com/'
            }
          ]
        }
      }

      ConstraintsValidatorService.validateObjectConstraints(
        yamlBundleDescriptor,
        YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "target" is not valid. Allowed values are: internal, external'
      )
      expect(error.message).contain('$.ext.nav[0].target')
    })
    .it('Validates invalid nav target')

})
