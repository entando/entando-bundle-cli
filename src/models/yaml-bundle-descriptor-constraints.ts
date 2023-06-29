import {
  ObjectConstraints,
  UnionTypeConstraints,
  isMapOfStrings,
  maxLength,
  values
} from '../services/constraints-validator-service'
import {
  BundleType,
  DescriptorVersion,
  YamlBundleDescriptor,
  YamlBundleDescriptorV1,
  YamlEnvironmentVariable,
  YamlPluginDescriptorV1,
  YamlWidgetConfigDescriptorV1,
  YamlWidgetDescriptorV1
} from './yaml-bundle-descriptor'
import {
  MAX_NAME_LENGTH,
  NAV_CONSTRAINTS,
  PARAM_CONSTRAINTS,
  RESOURCES_CONSTRAINTS,
  contextParamRegExpValidator,
  nameLengthValidator,
  nameRegExpValidator,
  widgetCategoryLengthValidator
} from './bundle-descriptor-constraints'
import { DBMS, MicroFrontendType, SecurityLevel } from './bundle-descriptor'

export const YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS: ObjectConstraints<YamlBundleDescriptor> =
  {
    name: {
      required: true,
      type: 'string'
    },
    descriptorVersion: {
      required: true,
      type: 'string'
    },
    description: {
      required: false,
      type: 'string'
    },
    thumbnail: {
      required: false,
      type: 'string'
    },
    components: {
      required: true,
      children: {
        plugins: {
          isArray: true,
          required: false,
          type: 'string'
        },
        widgets: {
          isArray: true,
          required: false,
          type: 'string'
        },
        assets: {
          isArray: true,
          required: false,
          type: 'string'
        },
        categories: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentModels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentTemplates: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentTypes: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contents: {
          isArray: true,
          required: false,
          type: 'string'
        },
        fragments: {
          isArray: true,
          required: false,
          type: 'string'
        },
        groups: {
          isArray: true,
          required: false,
          type: 'string'
        },
        labels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        languages: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pageModels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pageTemplates: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pages: {
          isArray: true,
          required: false,
          type: 'string'
        },
        resources: {
          isArray: true,
          required: false,
          type: 'string'
        }
      }
    },
    ext: {
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

export const YAML_BUNDLE_DESCRIPTOR_CONSTRAINTS_V1: ObjectConstraints<YamlBundleDescriptorV1> =
  {
    code: {
      required: true,
      type: 'string'
    },
    'bundle-type': {
      required: false,
      type: 'string',
      validators: [values(BundleType)]
    },
    descriptorVersion: {
      required: false,
      type: 'string',
      validators: [values([DescriptorVersion.V1])]
    },
    description: {
      required: false,
      type: 'string'
    },
    thumbnail: {
      required: false,
      type: 'string'
    },
    components: {
      required: true,
      children: {
        plugins: {
          isArray: true,
          required: false,
          type: 'string'
        },
        widgets: {
          isArray: true,
          required: false,
          type: 'string'
        },
        assets: {
          isArray: true,
          required: false,
          type: 'string'
        },
        categories: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentModels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentTemplates: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contentTypes: {
          isArray: true,
          required: false,
          type: 'string'
        },
        contents: {
          isArray: true,
          required: false,
          type: 'string'
        },
        fragments: {
          isArray: true,
          required: false,
          type: 'string'
        },
        groups: {
          isArray: true,
          required: false,
          type: 'string'
        },
        labels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        languages: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pageModels: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pageTemplates: {
          isArray: true,
          required: false,
          type: 'string'
        },
        pages: {
          isArray: true,
          required: false,
          type: 'string'
        },
        resources: {
          isArray: true,
          required: false,
          type: 'string'
        }
      }
    },
    ext: {
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

const ENVIRONMENT_VARIABLE_CONSTRAINTS: UnionTypeConstraints<YamlEnvironmentVariable> =
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
        valueFrom: {
          required: true,
          children: {
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
        }
      }
    ]
  }

export const YAML_PLUGIN_DESCRIPTOR_CONSTRAINTS_V1: ObjectConstraints<YamlPluginDescriptorV1> =
  {
    name: {
      required: false,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    descriptorVersion: {
      required: false,
      type: 'string'
    },
    image: {
      required: true,
      type: 'string'
    },
    deploymentBaseName: {
      required: false,
      type: 'string'
    },
    dbms: {
      required: true,
      type: 'string',
      validators: [values(DBMS)]
    },
    ingressPath: {
      required: false,
      type: 'string',
      validators: [maxLength(MAX_NAME_LENGTH)]
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
    environmentVariables: {
      isArray: true,
      required: false,
      children: ENVIRONMENT_VARIABLE_CONSTRAINTS
    },
    resources: {
      required: false,
      children: RESOURCES_CONSTRAINTS
    }
  }

export const YAML_WIDGET_DESCRIPTOR_CONSTRAINTS_V1: ObjectConstraints<YamlWidgetDescriptorV1> =
  {
    code: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    group: {
      required: true,
      type: 'string'
    },
    descriptorVersion: {
      required: false,
      type: 'string'
    },
    type: {
      required: false,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    customUiPath: {
      required: false,
      type: 'string'
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    configMfe: {
      required: false,
      type: 'string'
    },
    contextParams: {
      isArray: true,
      required: false,
      type: 'string',
      validators: [contextParamRegExpValidator]
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    },
    widgetCategory: {
      required: false,
      type: 'string',
      validators: [widgetCategoryLengthValidator]
    },
    titles: {
      required: true,
      validators: [isMapOfStrings],
      children: {}
    }
  }

export const YAML_WIDGET_CONFIG_CONSTRAINTS_V1: ObjectConstraints<YamlWidgetConfigDescriptorV1> =
  {
    code: {
      required: true,
      type: 'string',
      validators: [nameRegExpValidator, nameLengthValidator]
    },
    group: {
      required: true,
      type: 'string'
    },
    descriptorVersion: {
      required: false,
      type: 'string'
    },
    type: {
      required: false,
      type: 'string',
      validators: [values(MicroFrontendType)]
    },
    customUiPath: {
      required: false,
      type: 'string'
    },
    parentName: {
      required: false,
      type: 'string'
    },
    parentCode: {
      required: false,
      type: 'string'
    },
    params: {
      isArray: true,
      required: false,
      children: PARAM_CONSTRAINTS
    },
    paramsDefaults: {
      required: false,
      validators: [isMapOfStrings],
      children: {}
    },
    configMfe: {
      required: false,
      type: 'string'
    },
    contextParams: {
      isArray: true,
      required: false,
      type: 'string',
      validators: [contextParamRegExpValidator]
    },
    nav: {
      isArray: true,
      required: false,
      children: NAV_CONSTRAINTS
    }
  }
