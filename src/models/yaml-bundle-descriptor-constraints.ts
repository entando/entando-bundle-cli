import { ObjectConstraints } from '../services/constraints-validator-service'
import { YamlBundleDescriptor } from './yaml-bundle-descriptor'
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
