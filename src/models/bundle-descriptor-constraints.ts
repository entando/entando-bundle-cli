import {
  ApiClaim,
  ApiType,
  BundleDescriptor,
  EnvironmentVariable,
  ExternalApiClaim,
  MicroFrontend,
  MicroService,
  SecurityLevel
} from '../models/bundle-descriptor'
import { MicroFrontendStack, MicroServiceStack } from '../models/component'
import {
  JsonPath,
  JsonValidationError,
  ObjectConstraints,
  UnionTypeConstraints,
  Validator
} from '../services/constraints-validator-service'

export const ALLOWED_NAME_REGEXP = /^[\w-]+$/
export const INVALID_NAME_MESSAGE =
  'Only alphanumeric characters, underscore and dash are allowed'

// Validators

const nameRegExpValidator = regexp(ALLOWED_NAME_REGEXP, INVALID_NAME_MESSAGE)

function regexp(regexp: RegExp, message: string): Validator {
  return function (key: string, field: any, jsonPath: JsonPath): void {
    if (!regexp.test(field)) {
      throw new JsonValidationError(
        `Field "${key}" is not valid. ${message}`,
        jsonPath
      )
    }
  }
}

function values(iterable: any): Validator {
  return function (key: string, field: any, jsonPath: JsonPath): void {
    if (!Object.values(iterable).includes(field)) {
      throw new JsonValidationError(
        `Field "${key}" is not valid. Allowed values are: ${Object.values(
          iterable
        ).join(', ')}`,
        jsonPath
      )
    }
  }
}

function isMapOfStrings(key: string, field: unknown, jsonPath: JsonPath): void {
  for (const [index, value] of Object.entries(field as any)) {
    if (typeof index !== 'string' || typeof value !== 'string') {
      throw new JsonValidationError(
        `Field "${key}" is not valid. Should be a key-value map of strings`,
        jsonPath
      )
    }
  }
}

// Constraints

const ENVIRONMENT_VARIABLE_CONSTRAINTS: UnionTypeConstraints<EnvironmentVariable> =
  [
    {
      name: {
        required: true,
        type: 'string'
      },
      value: {
        required: true,
        type: 'string'
      }
    },
    {
      name: {
        required: true,
        type: 'string'
      },
      valueFrom: {
        required: true,
        items: {
          secretKeyRef: {
            required: true,
            items: {
              name: {
                required: true,
                type: 'string'
              },
              key: {
                required: true,
                type: 'string'
              }
            }
          }
        }
      }
    }
  ]

const API_CLAIMS_CONSTRAINTS: UnionTypeConstraints<
  ApiClaim | ExternalApiClaim
> = [
  {
    name: {
      required: true,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values([ApiType.Internal])]
    },
    serviceId: {
      required: true,
      type: 'string'
    }
  },
  {
    name: {
      required: true,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values([ApiType.External])]
    },
    serviceId: {
      required: true,
      type: 'string'
    },
    bundleId: {
      required: true,
      type: 'string'
    }
  }
]

const MICROSERVICE_CONSTRAINTS: ObjectConstraints<MicroService> = {
  name: {
    required: true,
    type: 'string',
    validators: [nameRegExpValidator]
  },
  stack: {
    required: true,
    type: 'string',
    validators: [values(MicroServiceStack)]
  },
  deploymentBaseName: {
    required: false,
    type: 'string'
  },
  dbms: {
    required: true,
    type: 'string'
  },
  ingressPath: {
    required: false,
    type: 'string'
  },
  healthCheckPath: {
    required: false,
    type: 'string'
  },
  roles: {
    isArray: true,
    required: false,
    type: 'string'
  },
  securityLevel: {
    required: false,
    type: 'string',
    validators: [values(SecurityLevel)]
  },
  permissions: {
    isArray: true,
    required: false,
    children: {
      clientId: {
        required: true,
        type: 'string'
      },
      role: {
        required: true,
        type: 'string'
      }
    }
  },
  env: {
    isArray: true,
    required: false,
    children: ENVIRONMENT_VARIABLE_CONSTRAINTS
  }
}

const MICROFRONTEND_CONSTRAINTS: ObjectConstraints<MicroFrontend> = {
  name: {
    required: true,
    type: 'string',
    validators: [nameRegExpValidator]
  },
  code: {
    required: false,
    type: 'string'
  },
  stack: {
    required: true,
    type: 'string',
    validators: [values(MicroFrontendStack)]
  },
  titles: {
    required: true,
    validators: [isMapOfStrings],
    items: {}
  },
  publicFolder: {
    required: true,
    type: 'string'
  },
  customUiPath: {
    required: true,
    type: 'string'
  },
  configUi: {
    required: false,
    items: {
      customElement: {
        required: true,
        type: 'string'
      },
      resources: {
        isArray: true,
        required: true,
        type: 'string'
      }
    }
  },
  group: {
    required: true,
    type: 'string'
  },
  apiClaims: {
    isArray: true,
    required: false,
    children: API_CLAIMS_CONSTRAINTS
  }
}

export const BUNDLE_DESCRIPTOR_CONSTRAINTS: ObjectConstraints<BundleDescriptor> =
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator]
    },
    description: {
      required: false,
      type: 'string'
    },
    version: {
      required: true,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(['bundle'])]
    },
    microservices: {
      isArray: true,
      required: true,
      children: MICROSERVICE_CONSTRAINTS
    },
    microfrontends: {
      isArray: true,
      required: true,
      children: MICROFRONTEND_CONSTRAINTS
    },
    svc: {
      isArray: true,
      required: false,
      type: 'string'
    }
  }
