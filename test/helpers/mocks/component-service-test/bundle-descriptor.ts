export const bundleDescriptor = {
  name: 'test-bundle',
  version: '0.0.1',
  type: 'bundle',
  description: 'test description',
  microservices: [
    {
      name: 'test-ms-spring-boot-1',
      stack: 'spring-boot',
      image: 'test-spring-boot-image',
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
      securityLevel: 'lenient',
      env: [
        {
          name: 'test-env-1',
          value: 'test-value-1'
        }
      ]
    },
    {
      name: 'test-ms-spring-boot-2',
      stack: 'spring-boot',
      image: 'test-spring-boot-image-2',
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
      securityLevel: 'lenient',
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
      stack: 'react',
      titles: {
        en: 'mfe title 1',
        it: 'titolo mfe 1'
      },
      group: 'free',
      customUiPath: 'path/to/ui',
      configUi: {
        customElement: 'test-config',
        resources: ['path/to/test-config.js']
      }
    },
    {
      name: 'test-mfe-2',
      code: 'test-mfe-code-2',
      stack: 'react',
      titles: {
        en: 'mfe title 2',
        it: 'titolo mfe 2'
      },
      group: 'free',
      customUiPath: 'path/to/ui',
      configUi: {
        customElement: 'test-config',
        resources: ['path/to/test-config.js']
      }
    }
  ]
}
