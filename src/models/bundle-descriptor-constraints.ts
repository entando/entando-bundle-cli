import {
  ApiClaim,
  ApiType,
  AppBuilderMicroFrontend,
  BundleDescriptor,
  Commands,
  DBMS,
  EnvironmentVariable,
  ExternalApiClaim,
  MicroFrontend,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  Microservice,
  Nav,
  SecurityLevel,
  WidgetConfigMicroFrontend,
  WidgetMicroFrontend,
  WidgetParam
} from '../models/bundle-descriptor'
import { MicroFrontendStack, MicroserviceStack } from '../models/component'
import {
  fieldDependsOn,
  isMapOfStrings,
  mutualDependency,
  ObjectConstraints,
  regexp,
  UnionTypeConstraints,
  values,
  valueNotEqualTo,
  maxLength,
  exclusive,
  JsonPath,
  JsonValidationError,
  validateCustomElement
} from '../services/constraints-validator-service'

export const ALLOWED_NAME_REGEXP = /^[\da-z]+(?:(\.|_{1,2}|-+)[\da-z]+)*$/
export const ALLOWED_VERSION_REGEXP = /^\w+[\w.-]*$/
export const MAX_VERSION_LENGTH = 128
export const MAX_NAME_LENGTH = 50
export const MAX_WIDGET_CATEGORY_LENGTH = 80
export const INVALID_NAME_MESSAGE =
  'Name components may contain lowercase letters, digits and separators. A separator is defined as a period, one or two underscores, or one or more dashes. A name component may not start or end with a separator.'
export const INVALID_VERSION_MESSAGE =
  'Version may contain lowercase and uppercase letters, digits, underscores, periods and dashes. Version may not start with a period or a dash.'
export const DOCKER_PREFIX = 'docker://'
export const ALLOWED_BUNDLE_WITHOUT_REGISTRY_REGEXP =
  /^(docker:\/\/)*[\w-]+\/[\w-]+$/
export const ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP =
  /^(docker:\/\/)*[\w.-]+(:\d+)?(?:\/[\w-]+){2}$/
export const VALID_BUNDLE_FORMAT = `[${DOCKER_PREFIX}]<organization>/<repository> or [${DOCKER_PREFIX}]<registry>/<organization>/<repository>`

export const VALID_CONTEXT_PARAM_FORMAT =
  'Valid format for a contextParam is <code>_<value> where:\n - code is one of: page, info or systemParam\n - value is an alphanumeric string'

const nameRegExpValidator = regexp(ALLOWED_NAME_REGEXP, INVALID_NAME_MESSAGE)
const versionRegExpValidator = regexp(
  ALLOWED_VERSION_REGEXP,
  INVALID_VERSION_MESSAGE
)
const nameLengthValidator = maxLength(MAX_NAME_LENGTH)
const widgetCategoryLengthValidator = maxLength(MAX_WIDGET_CATEGORY_LENGTH)
const bundleRegExpValidator = regexp(
  ALLOWED_BUNDLE_WITH_REGISTRY_REGEXP,
  `Valid format is [${DOCKER_PREFIX}]<registry>/<organization>/<repository>`
)
const contextParamRegExpValidator = regexp(
  /(page|info|systemParam)_[\dA-Za-z]*/,
  VALID_CONTEXT_PARAM_FORMAT
)

// Constraints

const ENVIRONMENT_VARIABLE_CONSTRAINTS: UnionTypeConstraints<EnvironmentVariable> =
  {
    constraints: [
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
        secretKeyRef: {
          required: true,
          children: {
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
    ]
  }

const API_CLAIMS_CONSTRAINTS: UnionTypeConstraints<
  ApiClaim | ExternalApiClaim
> = {
  constraints: [
    {
      name: {
        required: true,
        type: 'string'
      },
      type: {
        required: true,
        type: 'string',
        validators: [values(ApiType)]
      },
      serviceName: {
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
        validators: [values(ApiType)]
      },
      serviceName: {
        required: true,
        type: 'string'
      },
      bundle: {
        required: true,
        type: 'string',
        validators: [bundleRegExpValidator]
      }
    }
  ],
  validators: [
    mutualDependency(
      { key: 'type', value: ApiType.External },
      { key: 'bundle' }
    )
  ]
}

export const NAV_CONSTRAINTS: ObjectConstraints<Nav> = {
  label: {
    required: true,
    validators: [isMapOfStrings],
    children: {}
  },
  target: {
    required: true,
    type: 'string',
    validators: [values(['internal', 'external'])]
  },
  url: {
    required: true,
    type: 'string'
  }
}

export const PARAM_CONSTRAINTS: ObjectConstraints<WidgetParam> = {
  name: {
    required: true,
    type: 'string'
  },
  description: {
    required: false,
    type: 'string'
  }
}

const COMMANDS_CONSTRAINTS: ObjectConstraints<Commands> = {
  build: {
    required: false,
    type: 'string'
  },
  run: {
    required: false,
    type: 'string'
  },
  pack: {
    required: false,
    type: 'string'
  }
}

const MICROSERVICE_CONSTRAINTS: ObjectConstraints<Microservice> = {
  name: {
    required: true,
    type: 'string',
    validators: [nameRegExpValidator, nameLengthValidator]
  },
  stack: {
    required: true,
    type: 'string',
    validators: [values(MicroserviceStack)]
  },
  deploymentBaseName: {
    required: false,
    type: 'string'
  },
  dbms: {
    required: false,
    type: 'string',
    validators: [values(DBMS)]
  },
  ingressPath: {
    required: false,
    type: 'string',
    validators: [nameLengthValidator]
  },
  healthCheckPath: {
    required: true,
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
  },
  commands: {
    required: false,
    children: COMMANDS_CONSTRAINTS
  },
  version: {
    required: false,
    type: 'string'
  }
}

const WIDGET_MICROFRONTEND_CONSTRAINTS: ObjectConstraints<WidgetMicroFrontend> =
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    stack: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendStack)]
    },
    titles: {
      required: true,
      validators: [isMapOfStrings],
      children: {}
    },
    publicFolder: {
      required: false,
      type: 'string'
    },
    buildFolder: {
      required: false,
      type: 'string'
    },
    group: {
      required: true,
      type: 'string'
    },
    apiClaims: {
      isArray: true,
      required: false,
      children: API_CLAIMS_CONSTRAINTS
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    },
    commands: {
      required: false,
      children: COMMANDS_CONSTRAINTS
    },
    customElement: {
      required: false,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    contextParams: {
      isArray: true,
      required: false,
      type: 'string',
      validators: [contextParamRegExpValidator]
    },
    configMfe: {
      required: false,
      type: 'string'
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    category: {
      required: false,
      validators: [widgetCategoryLengthValidator],
      type: 'string'
    },
    version: {
      required: false,
      type: 'string'
    }
  }

const WIDGETCONFIG_MICROFRONTEND_CONSTRAINTS: ObjectConstraints<WidgetConfigMicroFrontend> =
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    stack: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendStack)]
    },
    publicFolder: {
      required: false,
      type: 'string'
    },
    buildFolder: {
      required: false,
      type: 'string'
    },
    group: {
      required: true,
      type: 'string'
    },
    apiClaims: {
      isArray: true,
      required: false,
      children: API_CLAIMS_CONSTRAINTS
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    },
    commands: {
      required: false,
      children: COMMANDS_CONSTRAINTS
    },
    customElement: {
      required: false,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    version: {
      required: false,
      type: 'string'
    }
  }

const APPBUILDER_MICROFRONTEND_CONSTRAINTS: Array<
  ObjectConstraints<AppBuilderMicroFrontend>
> = [
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    stack: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendStack)]
    },
    publicFolder: {
      required: false,
      type: 'string'
    },
    buildFolder: {
      required: false,
      type: 'string'
    },
    group: {
      required: true,
      type: 'string'
    },
    apiClaims: {
      isArray: true,
      required: false,
      children: API_CLAIMS_CONSTRAINTS
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    },
    commands: {
      required: false,
      children: COMMANDS_CONSTRAINTS
    },
    customElement: {
      required: false,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    slot: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendAppBuilderSlot)]
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    version: {
      required: false,
      type: 'string'
    }
  },
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    stack: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendStack)]
    },
    publicFolder: {
      required: false,
      type: 'string'
    },
    buildFolder: {
      required: false,
      type: 'string'
    },
    group: {
      required: true,
      type: 'string'
    },
    apiClaims: {
      isArray: true,
      required: false,
      children: API_CLAIMS_CONSTRAINTS
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    },
    commands: {
      required: false,
      children: COMMANDS_CONSTRAINTS
    },
    customElement: {
      required: false,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    slot: {
      required: true,
      type: 'string',
      validators: [values(MicroFrontendAppBuilderSlot)]
    },
    paths: {
      isArray: true,
      required: true,
      type: 'string'
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    version: {
      required: false,
      type: 'string'
    }
  }
]

const MICROFRONTEND_CONSTRAINTS: UnionTypeConstraints<MicroFrontend> = {
  constraints: [
    WIDGET_MICROFRONTEND_CONSTRAINTS,
    WIDGETCONFIG_MICROFRONTEND_CONSTRAINTS,
    ...APPBUILDER_MICROFRONTEND_CONSTRAINTS
  ],
  validators: [
    fieldDependsOn(
      { key: 'contextParams' },
      { key: 'type', value: MicroFrontendType.Widget }
    ),
    fieldDependsOn(
      { key: 'configMfe' },
      { key: 'type', value: MicroFrontendType.Widget }
    ),
    fieldDependsOn(
      { key: 'category' },
      { key: 'type', value: MicroFrontendType.Widget }
    ),
    valueNotEqualTo({ key: 'configMfe' }, { key: 'name' }),
    mutualDependency(
      { key: 'titles' },
      { key: 'type', value: MicroFrontendType.Widget }
    ),
    mutualDependency(
      { key: 'slot' },
      { key: 'type', value: MicroFrontendType.AppBuilder }
    ),
    mutualDependency(
      { key: 'paths' },
      { key: 'slot', value: MicroFrontendAppBuilderSlot.Content }
    ),
    exclusive('parentName', 'parentCode'),
    exclusive('customElement', 'customUiPath'),
    validateCustomElement()
  ]
}

export const BUNDLE_DESCRIPTOR_CONSTRAINTS: ObjectConstraints<BundleDescriptor> =
  {
    name: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    description: {
      required: false,
      type: 'string'
    },
    version: {
      required: true,
      type: 'string',
      validators: [versionRegExpValidator, maxLength(MAX_VERSION_LENGTH)]
    },
    type: {
      required: true,
      type: 'string',
      validators: [values(['bundle'])]
    },
    microservices: {
      isArray: true,
      required: true,
      children: MICROSERVICE_CONSTRAINTS,
      validators: [microserviceValidator]
    },
    microfrontends: {
      isArray: true,
      required: true,
      children: MICROFRONTEND_CONSTRAINTS,
      validators: [microfrontendValidator]
    },
    svc: {
      isArray: true,
      required: false,
      type: 'string'
    },
    global: {
      required: false,
      children: {
        nav: {
          isArray: true,
          required: true,
          children: NAV_CONSTRAINTS
        }
      }
    }
  }

function microfrontendValidator(
  key: string,
  field: unknown,
  jsonPath: JsonPath
): void {
  const mfe = field as MicroFrontend
  if (mfe.stack === MicroFrontendStack.Custom) {
    validateCustomStack(mfe.name, mfe.commands, mfe.version, jsonPath)
  }
}

function microserviceValidator(
  key: string,
  field: unknown,
  jsonPath: JsonPath
): void {
  const ms = field as Microservice
  if (ms.stack === MicroserviceStack.Custom) {
    validateCustomStack(ms.name, ms.commands, ms.version, jsonPath)
  }
}

function validateCustomStack(
  componentName: string,
  commands: Commands | undefined,
  version: string | undefined,
  jsonPath: JsonPath
): void {
  if (commands) {
    for (const phase of Object.keys(COMMANDS_CONSTRAINTS)) {
      if (!commands[phase as keyof Commands]) {
        throw new JsonValidationError(
          `Component "${componentName}" requires to specify the "${phase}" command since it has a custom stack`,
          jsonPath
        )
      }
    }
  } else {
    throw new JsonValidationError(
      `Component "${componentName}" requires the "commands" fields since it has a custom stack`,
      jsonPath
    )
  }

  if (!version) {
    throw new JsonValidationError(
      `Component "${componentName}" requires the "version" fields since it has a custom stack`,
      jsonPath
    )
  }
}
