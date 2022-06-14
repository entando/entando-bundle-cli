import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as YAML from 'yaml'
import * as sinon from 'sinon'
import { BundleDescriptorConverterService } from '../../src/services/bundle-descriptor-converter-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { OUTPUT_FOLDER } from '../../src/paths'
import { TempDirHelper } from '../helpers/temp-dir-helper'
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
  MicroFrontendAppBuilderSlot
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
            { name: 'my-api-claim', type: ApiType.Internal, serviceId: 'my-ms' }
          ],
          nav: [
            {
              label: { en: 'test', it: 'test' },
              target: 'target',
              url: '/test'
            }
          ]
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

    converterService.generateYamlDescriptors()

    const mfeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe.yaml'
    )
    checkYamlFile(mfeDescriptorPath, {
      titles: {
        en: 'mfe title',
        it: 'titolo mfe'
      },
      group: 'free',
      version: 'v5',
      type: 'widget',
      apiClaims: [
        { name: 'my-api-claim', type: ApiType.Internal, serviceId: 'my-ms' }
      ],
      nav: [
        { label: { en: 'test', it: 'test' }, target: 'target', url: '/test' }
      ]
    })

    const mfeNoCodeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe-no-code.yaml'
    )
    checkYamlFile(mfeNoCodeDescriptorPath, {
      titles: {},
      group: 'free',
      version: 'v5',
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
      titles: {},
      group: 'free',
      version: 'v5',
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
      version: 'v5',
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
