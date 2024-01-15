import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as YAML from 'yaml'
import * as sinon from 'sinon'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BUNDLE_DESCRIPTOR_NAME, OUTPUT_FOLDER } from '../../src/paths'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import { ThumbnailStatusMessage } from '../../src/services/bundle-thumbnail-service'
import {
  ComponentType,
  MicroFrontendStack,
  MicroserviceStack
} from '../../src/models/component'
import { ComponentService } from '../../src/services/component-service'
import {
  ApiType,
  DBMS,
  SecurityLevel,
  MicroFrontendType,
  MicroFrontendAppBuilderSlot,
  BundleDescriptorVersion
} from '../../src/models/bundle-descriptor'

describe('bundle-descriptor-converter-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  test.it('test bundle descriptors conversion', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir('test-bundle')

    const bundleDescriptorService = new BundleDescriptorService()

    bundleDescriptorService.createBundleDescriptor({
      name: 'test-bundle',
      version: '0.0.1',
      type: 'bundle',
      description: 'test description',
      global: {
        nav: [
          { label: { en: 'test', it: 'test' }, target: 'target', url: '/test' }
        ]
      },
      microservices: [
        {
          name: 'test-ms',
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
              name: 'test-env1',
              value: 'test-value1'
            },
            {
              name: 'test-secret-env-1',
              secretKeyRef: {
                name: 'test-secret-key-ref-name-1',
                key: 'test-secret-key-ref-key-1'
              }
            }
          ],
          resources: {
            cpu: '100m',
            memory: '20gb',
            storage: '10gb'
          }
        },
        {
          name: 'test-ms-no-dbms',
          stack: MicroserviceStack.Node,
          healthCheckPath: '/api/health'
        }
      ],
      microfrontends: [
        {
          name: 'test-mfe',
          customElement: 'test-mfe',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          titles: {
            en: 'mfe title',
            it: 'titolo mfe'
          },
          group: 'free',
          publicFolder: 'public',
          configMfe: 'test-mfe-no-code',
          apiClaims: [
            {
              name: 'my-api-claim',
              type: ApiType.Internal,
              serviceName: 'my-ms'
            },
            {
              name: 'my-external-api-claim',
              type: ApiType.External,
              serviceName: 'my-ms-2',
              bundle: 'registry.hub.docker.com/entando/example-qe-bundle-01'
            }
          ],
          nav: [
            {
              label: { en: 'test', it: 'test' },
              target: 'target',
              url: '/test'
            }
          ],
          contextParams: ['pageCode'],
          params: [
            {
              name: 'param1',
              description: 'this is param1'
            }
          ],
          parentName: 'parent-mfe',
          paramsDefaults: {
            param1: 'defaultvalue'
          }
        },
        {
          name: 'test-mfe-no-code',
          customElement: 'test-mfe-no-code',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.WidgetConfig,
          group: 'free',
          publicFolder: 'public'
        },
        {
          name: 'test-app-builder-mfe',
          customElement: 'test-app-builder-mfe',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.AppBuilder,
          group: 'free',
          publicFolder: 'public',
          slot: MicroFrontendAppBuilderSlot.Content,
          paths: [],
          nav: [],
          parentCode: 'parent-mfe'
        },
        {
          name: 'test-mfe-no-params',
          customElement: 'test-mfe-no-params',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          group: 'free',
          titles: {
            en: 'no-params title'
          }
        }
      ]
    })

    fs.mkdirSync(`${bundleDir}/microfrontends/test-app-builder-mfe`)
    fs.writeFileSync(
      `${bundleDir}/microfrontends/test-app-builder-mfe/test-app-builder-mfe.ftl`,
      '<div>custom-ui</div>'
    )

    fs.writeFileSync(`${bundleDir}/thumbnail.png`, 'this is a thumbnail')

    sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
      {
        name: 'test-ms',
        version: '0.0.5',
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.SpringBoot
      },
      {
        name: 'test-ms-no-dbms',
        version: '0.0.1',
        type: ComponentType.MICROSERVICE,
        stack: MicroserviceStack.Node
      }
    ])

    const converterService = new BundleDescriptorConverterService('docker-org')

    converterService.generateYamlDescriptors(
      {
        assets: ['assets/my-image.yml']
      },
      {
        path: `${bundleDir}/thumbnail.png`,
        size: 47,
        status: ThumbnailStatusMessage.OK,
        base64: Buffer.from('this is a thumbnail').toString('base64')
      }
    )

    const mfeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe.yaml'
    )
    checkYamlFile(mfeDescriptorPath, {
      name: 'test-mfe',
      customElement: 'test-mfe',
      titles: {
        en: 'mfe title',
        it: 'titolo mfe'
      },
      group: 'free',
      descriptorVersion: 'v5',
      type: 'widget',
      configMfe: 'test-mfe-no-code',
      apiClaims: [
        { name: 'my-api-claim', type: ApiType.Internal, pluginName: 'my-ms' },
        {
          name: 'my-external-api-claim',
          type: ApiType.External,
          pluginName: 'my-ms-2',
          bundleId: '36fcf4de'
        }
      ],
      nav: [
        { label: { en: 'test', it: 'test' }, target: 'target', url: '/test' }
      ],
      contextParams: ['pageCode'],
      params: [
        {
          name: 'param1',
          description: 'this is param1'
        }
      ],
      parentName: 'parent-mfe',
      paramsDefaults: {
        param1: 'defaultvalue'
      }
    })

    const mfeNoCodeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe-no-code.yaml'
    )
    checkYamlFile(mfeNoCodeDescriptorPath, {
      name: 'test-mfe-no-code',
      customElement: 'test-mfe-no-code',
      group: 'free',
      descriptorVersion: 'v5',
      type: 'widget-config',
      params: []
    })

    const appBuilderMfeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-app-builder-mfe.yaml'
    )
    checkYamlFile(appBuilderMfeDescriptorPath, {
      name: 'test-app-builder-mfe',
      customElement: 'test-app-builder-mfe',
      group: 'free',
      descriptorVersion: 'v5',
      type: 'app-builder',
      ext: {
        appBuilder: {
          slot: 'content',
          paths: [],
          nav: []
        }
      },
      params: [],
      customUiPath: 'test-app-builder-mfe.ftl',
      parentCode: 'parent-mfe'
    })

    const mfeNoParamsDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe-no-params.yaml'
    )
    checkYamlFile(mfeNoParamsDescriptorPath, {
      name: 'test-mfe-no-params',
      customElement: 'test-mfe-no-params',
      group: 'free',
      descriptorVersion: 'v5',
      type: 'widget',
      titles: {
        en: 'no-params title'
      },
      params: []
    })

    const msDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'plugins',
      'test-ms.yaml'
    )
    checkYamlFile(msDescriptorPath, {
      name: 'test-ms',
      descriptorVersion: 'v6',
      image: 'docker-org/test-ms:0.0.5',
      dbms: 'postgresql',
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
      environmentVariables: [
        {
          name: 'test-env1',
          value: 'test-value1'
        },
        {
          name: 'test-secret-env-1',
          valueFrom: {
            secretKeyRef: {
              name: 'test-secret-key-ref-name-1',
              key: 'test-secret-key-ref-key-1'
            }
          }
        }
      ],
      resources: {
        cpu: '100m',
        memory: '20gb',
        storage: '10gb'
      }
    })

    const msNoDbmsDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'plugins',
      'test-ms-no-dbms.yaml'
    )
    checkYamlFile(msNoDbmsDescriptorPath, {
      name: 'test-ms-no-dbms',
      descriptorVersion: 'v6',
      image: 'docker-org/test-ms-no-dbms:0.0.1',
      dbms: DBMS.None,
      healthCheckPath: '/api/health'
    })

    const bundleDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      BUNDLE_DESCRIPTOR_NAME
    )
    checkYamlFile(bundleDescriptorPath, {
      name: 'test-bundle',
      descriptorVersion: 'v6',
      description: 'test description',
      components: {
        assets: ['assets/my-image.yml'],
        plugins: ['plugins/test-ms.yaml', 'plugins/test-ms-no-dbms.yaml'],
        widgets: [
          'widgets/test-mfe.yaml',
          'widgets/test-mfe-no-code.yaml',
          'widgets/test-app-builder-mfe.yaml',
          'widgets/test-mfe-no-params.yaml'
        ]
      },
      ext: {
        nav: [
          { label: { en: 'test', it: 'test' }, target: 'target', url: '/test' }
        ]
      },
      thumbnail: Buffer.from('this is a thumbnail').toString('base64')
    })

    const testAppBuilderMfeCustomUiPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-app-builder-mfe.ftl'
    )
    expect(
      fs.existsSync(testAppBuilderMfeCustomUiPath),
      `${testAppBuilderMfeCustomUiPath} wasn't created`
    ).to.eq(true)
  })

  test.it('test bundle without thumbnail', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir(
      'test-bundle-no-thumbnail'
    )
    const bundleDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      BUNDLE_DESCRIPTOR_NAME
    )

    const converterService = new BundleDescriptorConverterService('docker-org')
    converterService.generateYamlDescriptors({})

    checkYamlFile(bundleDescriptorPath, {
      name: 'test-bundle-no-thumbnail',
      descriptorVersion: 'v6',
      description: 'test-bundle-no-thumbnail description',
      components: {}
    })
  })

  test.it('test bundle conversion with a specific bundle descriptor version', () => {
    const bundleDir = tempDirHelper.createInitializedBundleDir(
      'test-bundle-v5'
    )
    const bundleDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      BUNDLE_DESCRIPTOR_NAME
    )

    const converterService = new BundleDescriptorConverterService('docker-org')
    const bundleDescriptorService = new BundleDescriptorService()

    bundleDescriptorService.createBundleDescriptor({
      name: 'test-bundle-v5',
      version: '0.0.1',
      type: 'bundle',
      description: 'test-bundle-v5 description',
      bundleDescriptorVersion: BundleDescriptorVersion.v5,
      microservices: [
        {
          name: 'test-ms',
          stack: MicroserviceStack.SpringBoot,
          dbms: DBMS.PostgreSQL,
          version: '0.0.1',
          healthCheckPath: '/path/to/check'
        }
      ],
      microfrontends: [
        {
          name: 'test-mfe',
          customElement: 'test-mfe',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          titles: {
            en: 'mfe title',
            it: 'titolo mfe'
          },
          group: 'free',
          publicFolder: 'public',
          configMfe: 'test-mfe-no-code',
        }
      ]
    })

    fs.writeFileSync(`${bundleDir}/thumbnail.png`, 'this is a thumbnail')

    converterService.generateYamlDescriptors({})

    checkYamlFile(bundleDescriptorPath, {
      name: 'test-bundle-v5',
      descriptorVersion: 'v5',
      description: 'test-bundle-v5 description',
      components: {
        plugins: [
          "plugins/test-ms.yaml"
        ],
        widgets: [
          "widgets/test-mfe.yaml"
        ]
      }
    })
  })
})

function checkYamlFile(filePath: string, expectedContent: any) {
  expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const parsedContent = YAML.parse(fileContent)
  expect(parsedContent).to.deep.equal(expectedContent)
}
