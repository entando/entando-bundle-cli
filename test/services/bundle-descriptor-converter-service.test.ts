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
  MicroServiceStack
} from '../../src/models/component'
import { ComponentService } from '../../src/services/component-service'
import { ApiType } from '../../src/models/bundle-descriptor'

describe('bundle-descriptor-converter-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  test.it('test bundle descriptors conversion', () => {
    const bundleDir = path.resolve(tempDirHelper.tmpDir, 'test-bundle')
    fs.mkdirSync(bundleDir, { recursive: true })

    const bundleDescriptorService = new BundleDescriptorService(bundleDir)

    bundleDescriptorService.createBundleDescriptor({
      name: 'test-bundle',
      version: '0.0.1',
      type: 'bundle',
      description: 'test description',
      microservices: [
        {
          name: 'test-ms',
          stack: MicroServiceStack.SpringBoot,
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
              name: 'test-env1',
              value: 'test-value1'
            }
          ]
        }
      ],
      microfrontends: [
        {
          name: 'test-mfe',
          code: 'test-mfe-code',
          stack: MicroFrontendStack.React,
          titles: {
            en: 'mfe title',
            it: 'titolo mfe'
          },
          group: 'free',
          publicFolder: 'public',
          customUiPath: 'path/to/ui',
          configUi: {
            customElement: 'test-config',
            resources: ['path/to/test-config.js']
          },
          apiClaims: [
            { name: 'my-api-claim', type: ApiType.Internal, serviceId: 'my-ms' }
          ]
        },
        {
          name: 'test-mfe-no-code',
          stack: MicroFrontendStack.React,
          titles: {},
          group: 'free',
          publicFolder: 'public',
          customUiPath: 'path/to/ui'
        }
      ]
    })

    sinon.stub(ComponentService.prototype, 'getVersionedComponents').returns([
      {
        name: 'test-ms',
        version: '0.0.5',
        type: ComponentType.MICROSERVICE,
        stack: MicroServiceStack.SpringBoot
      }
    ])

    const converterService = new BundleDescriptorConverterService(
      bundleDir,
      'docker-org'
    )

    converterService.generateYamlDescriptors()

    const mfeDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'widgets',
      'test-mfe.yaml'
    )
    checkYamlFile(mfeDescriptorPath, {
      code: 'test-mfe-code',
      titles: {
        en: 'mfe title',
        it: 'titolo mfe'
      },
      group: 'free',
      version: 'v2',
      apiClaims: [
        { name: 'my-api-claim', type: ApiType.Internal, serviceId: 'my-ms' }
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
      code: 'test-mfe-no-code',
      titles: {},
      group: 'free',
      version: 'v2'
    })

    const msDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'plugins',
      'test-ms.yaml'
    )
    checkYamlFile(msDescriptorPath, {
      descriptorVersion: 'v4',
      image: 'docker-org/test-ms:0.0.5',
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
      environmentVariables: [
        {
          name: 'test-env1',
          value: 'test-value1'
        }
      ]
    })

    const bundleDescriptorPath = path.resolve(
      bundleDir,
      ...OUTPUT_FOLDER,
      'descriptors',
      'descriptor.yaml'
    )
    checkYamlFile(bundleDescriptorPath, {
      code: 'test-bundle',
      description: 'test description',
      components: {
        plugins: ['plugins/test-ms.yaml'],
        widgets: ['widgets/test-mfe.yaml', 'widgets/test-mfe-no-code.yaml']
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
