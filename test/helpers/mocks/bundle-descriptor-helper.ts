import {
  BundleDescriptor,
  DBMS,
  MicroFrontendAppBuilderSlot,
  MicroFrontendType,
  SecurityLevel
} from '../../../src/models/bundle-descriptor'
import {
  MicroFrontendStack,
  MicroserviceStack
} from '../../../src/models/component'
import { YamlBundleDescriptor } from '../../../src/models/yaml-bundle-descriptor'
import { BUNDLE_DESCRIPTOR_VERSION } from '../../../src/services/bundle-descriptor-converter-service'

export class BundleDescriptorHelper {
  public static newBundleDescriptor(): BundleDescriptor {
    return {
      name: 'test-bundle',
      version: '0.0.1',
      type: 'bundle',
      description: 'test description',
      microservices: [
        {
          name: 'test-ms-spring-boot-1',
          stack: MicroserviceStack.SpringBoot,
          dbms: DBMS.PostgreSQL,
          ingressPath: '/path/to/service',
          healthCheckPath: '/path/to/check',
          roles: ['test-role'],
          permissions: [
            {
              clientId: 'realm-management',
              role: 'manage-users'
            }
          ],
          securityLevel: SecurityLevel.Lenient,
          env: [
            {
              name: 'test-env-1',
              value: 'test-value-1'
            }
          ]
        },
        {
          name: 'test-ms-spring-boot-2',
          stack: MicroserviceStack.SpringBoot,
          dbms: DBMS.PostgreSQL,
          ingressPath: '/path/to/service',
          healthCheckPath: '/path/to/check',
          roles: ['test-role'],
          permissions: [
            {
              clientId: 'realm-management',
              role: 'manage-users'
            }
          ],
          securityLevel: SecurityLevel.Lenient,
          env: [
            {
              name: 'test-env-2',
              value: 'test-value-2'
            }
          ]
        }
      ],
      microfrontends: [
        {
          name: 'test-mfe-1',
          customElement: 'test-mfe-1',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          titles: {
            en: 'mfe title 1',
            it: 'titolo mfe 1'
          },
          group: 'free',
          publicFolder: 'public',
          params: []
        },
        {
          name: 'test-mfe-2',
          customElement: 'test-mfe-2',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.WidgetConfig,
          group: 'free',
          publicFolder: 'public'
        },
        {
          name: 'test-mfe-3',
          customElement: 'test-mfe-3',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.AppBuilder,
          group: 'free',
          publicFolder: 'public',
          buildFolder: 'custombuildfolder',
          slot: MicroFrontendAppBuilderSlot.Content,
          paths: [],
          params: []
        }
      ]
    }
  }

  public static newYamlBundleDescriptor(): YamlBundleDescriptor {
    return {
      name: 'test-bundle',
      descriptorVersion: BUNDLE_DESCRIPTOR_VERSION,
      components: {
        widgets: ['test-mfe'],
        plugins: ['test-ms']
      }
    }
  }
}

export const mocks = [
  {
    expectedLineError: 6,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot"
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 9,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    },`
  },
  {
    expectedLineError: 3,
    body: `{
      "microservices": [
        {,
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 3,
    body: `{
      "microservices": [
        {,
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 3,
    body: `{
      "microservices": [
        ,{
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 1,
    body: `{,
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 1,
    body: `,{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 5,
    body: `{
      "microservices": [
        {
          "name": "my-service"
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 1,
    body: `{"microservices",
     [],
     "version":"0.0.1"}`
  },
  {
    expectedLineError: 5,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",[
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 5,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",]
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 5,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          ["stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 5,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          ]"stack": "spring-boot",
          "healthCheckPath": "/health"
        }
      ]
    }`
  },
  {
    expectedLineError: 7,
    body: `{
      "microservices": [
        {
          "name": "my-service",
          "stack": "spring-boot",
          "healthCheckPath": "/health"
        }}
      ]
    }`
  }
]

export const mocksOneLine = [
  {
    expectedLineError: 1,
    body: `{"microservices": [{"name": "my-service""stack": "spring-boot","healthCheckPath": "/health"}]}`
  },
  {
    expectedLineError: 1,
    body: `{"microservices": [{"name": "my-service""stack": "spring-boot","healthCheckPath": "/health"}]}\n`
  }
]
