import {
  BundleDescriptor,
  SecurityLevel
} from '../../../src/models/bundle-descriptor'
import {
  MicroFrontendStack,
  MicroserviceStack
} from '../../../src/models/component'

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
          dbms: 'postgres',
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
          dbms: 'postgres',
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
          code: 'test-mfe-code-1',
          stack: MicroFrontendStack.React,
          titles: {
            en: 'mfe title 1',
            it: 'titolo mfe 1'
          },
          group: 'free',
          publicFolder: 'public'
        },
        {
          name: 'test-mfe-2',
          code: 'test-mfe-code-2',
          stack: MicroFrontendStack.React,
          titles: {
            en: 'mfe title 2',
            it: 'titolo mfe 2'
          },
          group: 'free',
          publicFolder: 'public'
        }
      ]
    }
  }
}
