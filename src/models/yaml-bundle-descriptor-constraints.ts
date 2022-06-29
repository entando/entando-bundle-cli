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
          required: true,
          type: 'string'
        },
        widgets: {
          isArray: true,
          required: true,
          type: 'string'
        }
      }
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
