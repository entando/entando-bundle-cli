import { ObjectConstraints, values } from '../services/constraints-validator-service'
import { BundleType, DescriptorVersion, YamlBundleDescriptor, YamlBundleDescriptorV1 } from './yaml-bundle-descriptor'
import { NAV_CONSTRAINTS } from './bundle-descriptor-constraints'

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
  "bundle-type": {
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