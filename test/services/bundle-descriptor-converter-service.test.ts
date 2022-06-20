import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as YAML from 'yaml'
import * as sinon from 'sinon'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { OUTPUT_FOLDER } from '../../src/paths'
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
  WidgetContextParam
} from '../../src/models/bundle-descriptor'

describe('bundle-descriptor-converter-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  test.it('test bundle descriptors conversion', () => {
    const bundleDir = path.resolve(tempDirHelper.tmpDir, 'test-bundle')
    fs.mkdirSync(bundleDir, { recursive: true })

    process.chdir(bundleDir)

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
            }
          ]
        },
        {
          name: 'test-ms-no-dbms',
          stack: MicroserviceStack.Node
        }
      ],
      microfrontends: [
        {
          name: 'test-mfe',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          titles: {
            en: 'mfe title',
            it: 'titolo mfe'
          },
          group: 'free',
          publicFolder: 'public',
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
          contextParams: [WidgetContextParam.PageCode]
        },
        {
          name: 'test-mfe-no-code',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.Widget,
          titles: {},
          group: 'free',
          publicFolder: 'public'
        },
        {
          name: 'test-app-builder-mfe',
          stack: MicroFrontendStack.React,
          type: MicroFrontendType.AppBuilder,
          titles: {},
          group: 'free',
          publicFolder: 'public',
          slot: MicroFrontendAppBuilderSlot.Content,
          paths: []
        }
      ]
    })

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

    converterService.generateYamlDescriptors({
      path: `${bundleDir}/thumbnail.png`,
      size: 47,
      status: ThumbnailStatusMessage.OK,
      base64: Buffer.from('this is a thumbnail').toString('base64')
    })

    const mfeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe.yaml'
    )
    checkYamlFile(mfeDescriptorPath, {
      name: 'test-mfe',
      titles: {
        en: 'mfe title',
        it: 'titolo mfe'
      },
      group: 'free',
      descriptorVersion: 'v5',
      type: 'widget',
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
      contextParams: ['pageCode']
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
      titles: {},
      group: 'free',
      descriptorVersion: 'v5',
      type: 'widget'
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
      titles: {},
      group: 'free',
      descriptorVersion: 'v5',
      type: 'app-builder',
      slot: 'content',
      paths: []
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
      descriptorVersion: 'v5',
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
        }
      ]
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
      descriptorVersion: 'v5',
      image: 'docker-org/test-ms-no-dbms:0.0.1',
      dbms: DBMS.None
    })

    const bundleDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'descriptor.yaml'
    )
    checkYamlFile(bundleDescriptorPath, {
      name: 'test-bundle',
      descriptorVersion: 'v5',
      description: 'test description',
      components: {
        plugins: ['plugins/test-ms.yaml', 'plugins/test-ms-no-dbms.yaml'],
        widgets: [
          'widgets/test-mfe.yaml',
          'widgets/test-mfe-no-code.yaml',
          'widgets/test-app-builder-mfe.yaml'
        ]
      },
      global: {
        nav: [
          { label: { en: 'test', it: 'test' }, target: 'target', url: '/test' }
        ]
      },
      thumbnail: Buffer.from('this is a thumbnail').toString('base64')
    })
  })
})

function checkYamlFile(filePath: string, expectedContent: any) {
  expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const parsedContent = YAML.parse(fileContent)
  expect(parsedContent).to.deep.equal(expectedContent)
}
