import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import {
  CONFIG_FOLDER,
  CONFIG_FILE,
  BUNDLE_DESCRIPTOR_FILE_NAME,
  SVC_FOLDER,
  GITKEEP_FILE,
  MICROFRONTENDS_FOLDER,
  MICROSERVICES_FOLDER,
  PSC_FOLDER,
  LOGS_FOLDER,
  WIDGETS_FOLDER,
  CUSTOM_WIDGET_TEMPLATE_EXTENSION
} from '../../src/paths'
import { expect, test } from '@oclif/test'
import { ProcessExecutorService } from '../../src/services/process-executor-service'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import {
  BundleDescriptor,
  DBMS,
  MicroFrontendType,
  WidgetMicroFrontend
} from '../../src/models/bundle-descriptor'
import {
  SUPPORTED_PSC_V1_TO_V5_TYPES,
  YamlBundleDescriptorV1,
  YamlPluginDescriptorV1,
  YamlWidgetConfigDescriptorV1,
  YamlWidgetDescriptorV1
} from '../../src/models/yaml-bundle-descriptor'
import * as YAML from 'yaml'
import { MicroserviceStack } from '../../src/models/component'
import { CliUx } from '@oclif/core'
import { writeFileSyncRecursive } from '../../src/utils'
import * as inquirer from 'inquirer'

describe('convert', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const testFolder = path.dirname(__dirname)
  const descriptorV1FilePath = path.resolve(
    testFolder,
    'resources/bundle-sample/descriptor.yaml'
  )
  let descV1Json: YamlBundleDescriptorV1
  const inputPlatformGroups = [
    'fragments',
    'categories',
    'pages',
    'pageTemplates',
    'invalid',
    'something',
    'contentTypes',
    'contentTemplates',
    'contents',
    'assets',
    'groups',
    'labels',
    'languages',
    'pageModels',
    'contentModels',
    'resources'
  ]

  beforeEach(() => {
    // creating a subfolder for testing the bundle-sample conversion
    fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, 'bundle-sample'))
    // copy descriptor v1 in tmpDir
    fs.copyFileSync(
      descriptorV1FilePath,
      path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'descriptor.yaml')
    )
    descV1Json = YAML.parse(fs.readFileSync(descriptorV1FilePath, 'utf-8'))
  })

  afterEach(() => {
    const foldersToRemove = ['bundle-sample', 'bundle-sample-v5']
    foldersToRemove.map(fileName => {
      return fs.rmSync(path.resolve(tempDirHelper.tmpDir, fileName), {
        recursive: true,
        force: true
      })
    })
  })

  after(() => {
    fs.rmSync(path.resolve(tempDirHelper.tmpDir), {
      recursive: true,
      force: true
    })
  })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .command(['convert', '--bundle-path', `bundle-sample`])
    .it('runs convert bundle ', () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      checkGitKeepFile(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)
      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
    })
    .command(['convert'])
    .it('runs convert bundle without --bundle-path', () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      checkGitKeepFile(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')
    })
  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json as any
      delete localDescV1Json.descriptorVersion
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle without --bundle-path and without descriptorVersion in descriptor',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        checkGitKeepFile(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.copyFileSync(
        path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'plugin.yaml'
        )
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid plugin (name of plugin retrieved from image)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkMicroservice(bundleDescriptor, 'entando-sample-plugin')
        expect(bundleDescriptor.microservices[0].env).to.be.eql([
          { name: 'ENV_1_NAME', value: 'env1value' },
          {
            name: 'ENV_2_NAME',
            secretKeyRef: { key: 'env-2-secret-key', name: 'env-2-secret' }
          }
        ])
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      const localpluginV1Json: YamlPluginDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
          'utf-8'
        )
      )
      localpluginV1Json.image =
        'docker.io/entando/entando-sample-sha-plugin@sha256:0.0.1'
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'plugin.yaml'
        ),
        YAML.stringify(localpluginV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid plugin (name of plugin retrieved from image, where image name is sha based)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkMicroservice(bundleDescriptor, 'entando-sample-sha-plugin')
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      const localpluginV1Json: YamlPluginDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
          'utf-8'
        )
      )
      localpluginV1Json.image =
        'docker.io/entando/entando-sample-plugin-without-tag'
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'plugin.yaml'
        ),
        YAML.stringify(localpluginV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid plugin (name of plugin retrieved from image, where image name does not contain the tag)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkMicroservice(bundleDescriptor, 'entando-sample-plugin-without-tag')
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      const localpluginV1Json: YamlPluginDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
          'utf-8'
        )
      )
      delete localpluginV1Json.environmentVariables
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'plugin.yaml'
        ),
        YAML.stringify(localpluginV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid plugin without environment variables',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkMicroservice(bundleDescriptor, 'entando-sample-plugin')
        expect(bundleDescriptor.microservices[0]).to.not.have.property('env')
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      const localpluginV1Json: YamlPluginDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
          'utf-8'
        )
      )
      delete localpluginV1Json.environmentVariables
      localpluginV1Json.name = 'sample-plugin'
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'plugin.yaml'
        ),
        YAML.stringify(localpluginV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid plugin (name retrieved from plugin descriptor)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        checkMicroservice(bundleDescriptor, 'sample-plugin')
        expect(bundleDescriptor.microservices[0]).to.not.have.property('env')
      }
    )

  const templatePluginV1Json: YamlPluginDescriptorV1 = YAML.parse(
    fs.readFileSync(
      path.resolve(testFolder, 'resources/bundle-sample/plugin.yaml'),
      'utf-8'
    )
  )
  const invalidPlugins: Array<{
    description: string
    plugin: YamlPluginDescriptorV1
  }> = []

  // without image
  const pluginWithoutImage = JSON.parse(JSON.stringify(templatePluginV1Json))
  delete pluginWithoutImage.image
  invalidPlugins.push({
    description: 'image not found in plugin descriptor',
    plugin: pluginWithoutImage
  })

  // without dbms
  const pluginWithoutDbms = JSON.parse(JSON.stringify(templatePluginV1Json))
  delete pluginWithoutDbms.dbms
  invalidPlugins.push({
    description: 'dbms not found in plugin descriptor',
    plugin: pluginWithoutDbms
  })

  // invalid dbms
  const pluginWithInvalidDbms = JSON.parse(JSON.stringify(templatePluginV1Json))
  pluginWithInvalidDbms.dbms = 'invalidDbms'
  invalidPlugins.push({
    description: 'dbms not valid in plugin descriptor',
    plugin: pluginWithInvalidDbms
  })

  // without healthCheckPath
  const pluginWithoutHealthCheckPath = JSON.parse(
    JSON.stringify(templatePluginV1Json)
  )
  delete pluginWithoutHealthCheckPath.healthCheckPath
  invalidPlugins.push({
    description: 'healthCheckPath not found in plugin descriptor',
    plugin: pluginWithInvalidDbms
  })

  // with invalid securityLevel
  const pluginWithInvalidSecurityLevel = JSON.parse(
    JSON.stringify(templatePluginV1Json)
  )
  pluginWithInvalidSecurityLevel.securityLevel = 'invalidSecurityLevel'
  invalidPlugins.push({
    description: 'securityLevel not valid in plugin descriptor',
    plugin: pluginWithInvalidSecurityLevel
  })

  // with invalid ingressPath
  const pluginWithInvalidIngressPath = JSON.parse(
    JSON.stringify(templatePluginV1Json)
  )
  pluginWithInvalidIngressPath.ingressPath = '*'.repeat(51)
  invalidPlugins.push({
    description: 'ingressPath not valid in plugin descriptor',
    plugin: pluginWithInvalidIngressPath
  })

  for (const invalidPlugin of invalidPlugins) {
    test
      .stdout()
      .stderr()
      .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
      .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
      .do(() => {
        process.chdir('bundle-sample')
        const localDescV1Json = descV1Json
        localDescV1Json.components.plugins = ['plugins/plugin.yaml']
        fs.mkdirSync(
          path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
        )
        fs.writeFileSync(
          path.resolve(
            tempDirHelper.tmpDir,
            'bundle-sample',
            'plugins',
            'plugin.yaml'
          ),
          YAML.stringify(invalidPlugin.plugin)
        )
        fs.writeFileSync(
          path.resolve('descriptor.yaml'),
          YAML.stringify(localDescV1Json)
        )
      })
      .command(['convert'])
      .it(
        `runs convert bundle with a invalid plugin (${invalidPlugin.description})`,
        () => {
          const bundleName = 'bundle-sample-v5'
          checkFoldersStructure(bundleName)
          expect(
            (ProcessExecutorService.executeProcess as sinon.SinonStub).called
          ).to.equal(true)

          const bundleDescriptor = parseBundleDescriptor(bundleName)
          expect(bundleDescriptor.name).to.eq(bundleName)
          expect(bundleDescriptor.version).to.eq('0.0.1')
          expect(bundleDescriptor.description).to.eq(
            'bundle-sample-v5 description'
          )
          expect(bundleDescriptor.type).to.eq('bundle')
          expect(bundleDescriptor.microservices.length).to.eq(0)
        }
      )
  }

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/plugin.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a plugin, where plugin descriptor does not exist',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        expect(bundleDescriptor.microservices.length).to.eq(0)
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.plugins = ['plugins/sample-plugin.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'plugins')
      )
      const localPlugin = JSON.parse(JSON.stringify(templatePluginV1Json))
      delete localPlugin.image
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'plugins',
          'sample-plugin.yaml'
        ),
        YAML.stringify(localPlugin)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      `runs convert bundle with a invalid plugin (plugin has no name)`,
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        expect(bundleDescriptor.microservices.length).to.eq(0)
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        'key: value\nkey: value2'
      )
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor invalid. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 is invalid YAML')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json as any
      delete localDescV1Json.code
      localDescV1Json.name = 'bundle-sample'
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor invalid. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 has no code')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json as any
      delete localDescV1Json.components
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor invalid. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 has no components')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json as any
      localDescV1Json.descriptorVersion = 'v5'
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor invalid. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 has descriptorVersion v5')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json as any
      localDescV1Json['bundle-type'] = 'invalid-type'
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor invalid. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 has bundle-type invalid')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      fs.rmSync(path.resolve('descriptor.yaml'))
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain(
        'Bundle descriptor not found. Is this a v1 Bundle project?'
      )
    })
    .it('throws an error when descriptor of bundle v1 is not found')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      fs.writeFileSync(
        path.resolve('entando.json'),
        '{"name": "bundle-sample"}'
      )
      fs.rmSync(path.resolve('descriptor.yaml'))
    })
    .command(['convert'])
    .catch(error => {
      expect(error.message).to.contain('The Bundle is already a v5')
    })
    .it('throws an error when descriptor is a v5')

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () =>
      sinon
        .stub()
        .resolves(
          path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'services')
        )
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      const svc1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/sample-svc.yml'),
          'utf-8'
        )
      )
      const svc2 = JSON.parse(JSON.stringify(svc1))

      // edit svc name of svc1
      svc1.svc1 = svc1['sample-svc']
      delete svc1['sample-svc']

      // edit svc name of svc1
      svc2.svc2 = svc1['sample-svc']
      delete svc2['sample-svc']

      writeFileSyncRecursive(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'services',
          'svc1.yml'
        ),
        YAML.stringify(svc1)
      )
      writeFileSyncRecursive(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'services',
          'svc2.yml'
        ),
        YAML.stringify(svc2)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(`runs convert bundle converting the service files`, () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')
      expect(bundleDescriptor.svc?.length).to.eq(2)
      expect(bundleDescriptor.svc?.[0]).to.eq('svc1')
      expect(bundleDescriptor.svc?.[1]).to.eq('svc2')

      checkBundleFile(bundleName, SVC_FOLDER, 'svc1.yml')
      checkBundleFile(bundleName, SVC_FOLDER, 'svc2.yml')
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      const svc1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/sample-svc.yml'),
          'utf-8'
        )
      )
      const svc2 = JSON.parse(JSON.stringify(svc1))

      // edit svc name of svc1
      svc1.sv1 = svc1['sample-svc']
      delete svc1['sample-svc']

      // edit svc name of svc1
      svc2.svc2 = svc1['sample-svc']
      delete svc2['sample-svc']

      writeFileSyncRecursive(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'services',
          'svc1.yml'
        ),
        YAML.stringify(svc1)
      )
      writeFileSyncRecursive(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'services',
          'svc2.yml'
        ),
        YAML.stringify(svc2)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command([
      'convert',
      '--svc-path',
      `${path.resolve(
        tempDirHelper.tmpDir,
        'entando-bundle-cli-commands-convert-test',
        'bundle-sample',
        'services'
      )}`
    ])
    .it(
      `runs convert bundle converting the service files (using --svc-path flag)`,
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        expect(bundleDescriptor.svc?.length).to.eq(2)
        expect(bundleDescriptor.svc?.[0]).to.eq('svc1')
        expect(bundleDescriptor.svc?.[1]).to.eq('svc2')

        checkBundleFile(bundleName, SVC_FOLDER, 'svc1.yml')
        checkBundleFile(bundleName, SVC_FOLDER, 'svc2.yml')
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      for (const group of inputPlatformGroups) {
        fs.mkdirSync(group)
        fs.writeFileSync(
          path.resolve(group, `${group.toLowerCase()}-sample.yaml`),
          ''
        )
      }

      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(`runs convert bundle importing the platform files`, () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')
      const validGroupFolder = inputPlatformGroups.filter(group =>
        (SUPPORTED_PSC_V1_TO_V5_TYPES as unknown as string[]).includes(group)
      )
      const invalidGroupFolder = inputPlatformGroups.filter(
        group =>
          !(SUPPORTED_PSC_V1_TO_V5_TYPES as unknown as string[]).includes(group)
      )
      for (const validGroup of validGroupFolder) {
        checkBundleFile(bundleName, PSC_FOLDER, validGroup)
        checkBundleFile(
          bundleName,
          PSC_FOLDER,
          validGroup,
          `${validGroup.toLowerCase()}-sample.yaml`
        )
      }

      for (const invalidGroup of invalidGroupFolder) {
        checkBundleFileDoesNotExist(bundleName, PSC_FOLDER, invalidGroup)
        checkBundleFileDoesNotExist(
          bundleName,
          PSC_FOLDER,
          invalidGroup,
          `${invalidGroup.toLowerCase()}-sample.yaml`
        )
      }
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .onFirstCall()
        .resolves({ isMfe: true })
        .onSecondCall()
        .resolves({ type: MicroFrontendType.Widget })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      const localwidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
          'utf-8'
        )
      )
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        YAML.stringify(localwidgetV1Json)
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'sample-widget-different-name.ftl'
        ),
        'custom ftl'
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it('runs convert bundle with a valid mfe widget', () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')

      checkMicrofrontend(bundleDescriptor, 'sample-widget')
      checkFTLFileForMfe(bundleDescriptor.name, 'sample-widget', true)
      const mfe = bundleDescriptor.microfrontends[0] as WidgetMicroFrontend
      expect(bundleDescriptor.microfrontends[0].type).to.eql(
        MicroFrontendType.Widget
      )
      expect(mfe.titles).to.eql({
        en: 'sample widget',
        it: 'widget campione'
      })
      expect(mfe.category).to.eql('widget-category')
    })

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .onFirstCall()
        .resolves({ isMfe: true })
        .onSecondCall()
        .resolves({ type: MicroFrontendType.Widget })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      const localwidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
          'utf-8'
        )
      )
      delete localwidgetV1Json.customUiPath
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        YAML.stringify(localwidgetV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid mfe widget (without custom ftl)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkMicrofrontend(bundleDescriptor, 'sample-widget')
        checkFTLFileForMfe(bundleDescriptor.name, 'sample-widget', false)
        const mfe = bundleDescriptor.microfrontends[0] as WidgetMicroFrontend
        expect(bundleDescriptor.microfrontends[0].type).to.eql(
          MicroFrontendType.Widget
        )
        expect(mfe.titles).to.eql({
          en: 'sample widget',
          it: 'widget campione'
        })
        expect(mfe.category).to.eql('widget-category')
      }
    )
  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .onFirstCall()
        .resolves({ isMfe: true })
        .onSecondCall()
        .resolves({ type: MicroFrontendType.Widget })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        'key: value\nkey: value2'
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a invalid mfe widget (widget descriptor is not a valid YAML)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        expect(bundleDescriptor.microfrontends.length).to.eq(0)
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .onFirstCall()
        .resolves({ isMfe: true })
        .onSecondCall()
        .resolves({ type: MicroFrontendType.Widget })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a invalid mfe widget (widget descriptor not found)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        expect(bundleDescriptor.microfrontends.length).to.eq(0)
      }
    )

  const templateMfeWidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
    fs.readFileSync(
      path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
      'utf-8'
    )
  )
  const invalidWidgets: Array<{
    description: string
    widget: YamlWidgetDescriptorV1
  }> = []

  // without code
  const mfeWidgetWithoutCode = JSON.parse(
    JSON.stringify(templateMfeWidgetV1Json)
  )
  delete mfeWidgetWithoutCode.code
  invalidWidgets.push({
    description: 'code not found in widget descriptor',
    widget: mfeWidgetWithoutCode
  })

  // without group
  const mfeWidgetWithoutGroup = JSON.parse(
    JSON.stringify(templateMfeWidgetV1Json)
  )
  delete mfeWidgetWithoutGroup.group
  invalidWidgets.push({
    description: 'group not found in widget descriptor',
    widget: mfeWidgetWithoutGroup
  })

  // with invalid widgetCategory
  const mfeWidgetWithInvalidWidgetCategory = JSON.parse(
    JSON.stringify(templateMfeWidgetV1Json)
  )
  mfeWidgetWithInvalidWidgetCategory.widgetCategory = '*'.repeat(81)
  invalidWidgets.push({
    description: 'widgetCategory not valid in widget descriptor',
    widget: mfeWidgetWithInvalidWidgetCategory
  })

  for (const invalidMfeWidget of invalidWidgets) {
    test
      .stdout()
      .stderr()
      .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
      .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
      .stub(
        inquirer,
        'prompt',
        sinon
          .stub()
          .onFirstCall()
          .resolves({ isMfe: true })
          .onSecondCall()
          .resolves({ type: MicroFrontendType.Widget })
      )
      .do(() => {
        process.chdir('bundle-sample')
        const localDescV1Json = descV1Json
        localDescV1Json.components.widgets = ['widgets/widget.yaml']
        fs.mkdirSync(
          path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
        )
        fs.writeFileSync(
          path.resolve(
            tempDirHelper.tmpDir,
            'bundle-sample',
            'widgets',
            'widget.yaml'
          ),
          YAML.stringify(invalidMfeWidget)
        )
        fs.writeFileSync(
          path.resolve(
            tempDirHelper.tmpDir,
            'bundle-sample',
            'widgets',
            'sample-widget-different-name.ftl'
          ),
          'custom ftl'
        )
        fs.writeFileSync(
          path.resolve('descriptor.yaml'),
          YAML.stringify(localDescV1Json)
        )
      })
      .command(['convert'])
      .it(
        `runs convert bundle with a invalid mfe widget (${invalidMfeWidget.description})`,
        () => {
          const bundleName = 'bundle-sample-v5'
          checkFoldersStructure(bundleName)
          expect(
            (ProcessExecutorService.executeProcess as sinon.SinonStub).called
          ).to.equal(true)

          const bundleDescriptor = parseBundleDescriptor(bundleName)
          expect(bundleDescriptor.name).to.eq(bundleName)
          expect(bundleDescriptor.version).to.eq('0.0.1')
          expect(bundleDescriptor.description).to.eq(
            'bundle-sample-v5 description'
          )
          expect(bundleDescriptor.type).to.eq('bundle')
          expect(bundleDescriptor.microfrontends.length).to.eq(0)
        }
      )
  }

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon
        .stub()
        .onFirstCall()
        .resolves({ isMfe: true })
        .onSecondCall()
        .resolves({ type: MicroFrontendType.WidgetConfig })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      const localwidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
          'utf-8'
        )
      )
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        YAML.stringify(localwidgetV1Json)
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'sample-widget-different-name.ftl'
        ),
        'custom ftl'
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it('runs convert bundle with a valid widget-config', () => {
      const bundleName = 'bundle-sample-v5'
      checkFoldersStructure(bundleName)
      expect(
        (ProcessExecutorService.executeProcess as sinon.SinonStub).called
      ).to.equal(true)

      const bundleDescriptor = parseBundleDescriptor(bundleName)
      expect(bundleDescriptor.name).to.eq(bundleName)
      expect(bundleDescriptor.version).to.eq('0.0.1')
      expect(bundleDescriptor.description).to.eq('bundle-sample-v5 description')
      expect(bundleDescriptor.type).to.eq('bundle')

      checkMicrofrontend(bundleDescriptor, 'sample-widget')
      checkFTLFileForMfe(bundleDescriptor.name, 'sample-widget', true)

      const mfe = bundleDescriptor.microfrontends[0] as WidgetMicroFrontend
      expect(bundleDescriptor.microfrontends[0].type).to.eql(
        MicroFrontendType.WidgetConfig
      )
      expect(mfe.titles).to.be.undefined
      expect(mfe.category).to.be.undefined
    })

  const templateWidgetConfigV1Json: YamlWidgetConfigDescriptorV1 = YAML.parse(
    fs.readFileSync(
      path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
      'utf-8'
    )
  )
  const invalidWidgetConfigList: Array<{
    description: string
    widget: YamlWidgetConfigDescriptorV1
  }> = []

  // without code
  const mfeWidgetConfigWithoutCode = JSON.parse(
    JSON.stringify(templateWidgetConfigV1Json)
  )
  delete mfeWidgetConfigWithoutCode.code
  invalidWidgetConfigList.push({
    description: 'code not found in widget-config descriptor',
    widget: mfeWidgetConfigWithoutCode
  })

  // without group
  const mfeWidgetConfigWithoutGroup = JSON.parse(
    JSON.stringify(templateMfeWidgetV1Json)
  )
  delete mfeWidgetConfigWithoutGroup.group
  invalidWidgetConfigList.push({
    description: 'group not found in widget-config descriptor',
    widget: mfeWidgetConfigWithoutGroup
  })

  for (const invalidMfeWidgetConfig of invalidWidgetConfigList) {
    test
      .stdout()
      .stderr()
      .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
      .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
      .stub(
        inquirer,
        'prompt',
        sinon
          .stub()
          .onFirstCall()
          .resolves({ isMfe: true })
          .onSecondCall()
          .resolves({ type: MicroFrontendType.Widget })
      )
      .do(() => {
        process.chdir('bundle-sample')
        const localDescV1Json = descV1Json
        localDescV1Json.components.widgets = ['widgets/widget.yaml']
        fs.mkdirSync(
          path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
        )
        fs.writeFileSync(
          path.resolve(
            tempDirHelper.tmpDir,
            'bundle-sample',
            'widgets',
            'widget.yaml'
          ),
          YAML.stringify(invalidMfeWidgetConfig)
        )
        fs.writeFileSync(
          path.resolve(
            tempDirHelper.tmpDir,
            'bundle-sample',
            'widgets',
            'sample-widget-different-name.ftl'
          ),
          'custom ftl'
        )
        fs.writeFileSync(
          path.resolve('descriptor.yaml'),
          YAML.stringify(localDescV1Json)
        )
      })
      .command(['convert'])
      .it(
        `runs convert bundle with a invalid mfe widget-config (${invalidMfeWidgetConfig.description})`,
        () => {
          const bundleName = 'bundle-sample-v5'
          checkFoldersStructure(bundleName)
          expect(
            (ProcessExecutorService.executeProcess as sinon.SinonStub).called
          ).to.equal(true)

          const bundleDescriptor = parseBundleDescriptor(bundleName)
          expect(bundleDescriptor.name).to.eq(bundleName)
          expect(bundleDescriptor.version).to.eq('0.0.1')
          expect(bundleDescriptor.description).to.eq(
            'bundle-sample-v5 description'
          )
          expect(bundleDescriptor.type).to.eq('bundle')
          expect(bundleDescriptor.microfrontends.length).to.eq(0)
        }
      )
  }

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon.stub().onFirstCall().resolves({ isMfe: false })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      const localwidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
          'utf-8'
        )
      )
      localwidgetV1Json.customUiPath =
        './ftldir/sample-widget-different-name.ftl'
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        YAML.stringify(localwidgetV1Json)
      )
      writeFileSyncRecursive(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'ftldir',
          'sample-widget-different-name.ftl'
        ),
        'custom ftl'
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid widget moved in platform files',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        expect(bundleDescriptor.microfrontends.length).to.eq(0)
        // widget is the old name of widget descriptor which is preserved
        checkWidgetPSCFolders(bundleName, 'widget')
        checkFTLFileForPscWidget(
          bundleName,
          'sample-widget-different-name.ftl',
          true
        )
        const widgetDesc = parseWidgetDescriptorFromPscFolder(
          bundleName,
          'widget.yaml'
        )
        expect(widgetDesc.customUiPath).to.eq(
          'sample-widget-different-name.ftl'
        )
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon.stub().onFirstCall().resolves({ isMfe: false })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      const localwidgetV1Json: YamlWidgetDescriptorV1 = YAML.parse(
        fs.readFileSync(
          path.resolve(testFolder, 'resources/bundle-sample/widget.yaml'),
          'utf-8'
        )
      )
      delete localwidgetV1Json.customUiPath
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        YAML.stringify(localwidgetV1Json)
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a valid widget moved in platform files (without custom ftl)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')
        expect(bundleDescriptor.microfrontends.length).to.eq(0)
        // widget is the old name of widget descriptor which is preserved
        checkWidgetPSCFolders(bundleName, 'widget')
        checkFTLFileForPscWidget(
          bundleName,
          'sample-widget-different-name.ftl',
          false
        )
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon.stub().onFirstCall().resolves({ isMfe: false })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a invalid widget (platform files - widget descriptor not found)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkBundleFileDoesNotExist(
          bundleName,
          PSC_FOLDER,
          WIDGETS_FOLDER,
          'widget.yaml'
        )
      }
    )

  test
    .stdout()
    .stderr()
    .stub(ProcessExecutorService, 'executeProcess', sinon.stub().resolves(0))
    .stub(CliUx.ux, 'prompt', () => sinon.stub().resolves())
    .stub(
      inquirer,
      'prompt',
      sinon.stub().onFirstCall().resolves({ isMfe: false })
    )
    .do(() => {
      process.chdir('bundle-sample')
      const localDescV1Json = descV1Json
      localDescV1Json.components.widgets = ['widgets/widget.yaml']
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, 'bundle-sample', 'widgets')
      )
      fs.writeFileSync(
        path.resolve(
          tempDirHelper.tmpDir,
          'bundle-sample',
          'widgets',
          'widget.yaml'
        ),
        'key: value\nkey: value2'
      )
      fs.writeFileSync(
        path.resolve('descriptor.yaml'),
        YAML.stringify(localDescV1Json)
      )
    })
    .command(['convert'])
    .it(
      'runs convert bundle with a invalid widget (platform files - widget descriptor is not a valid YAML)',
      () => {
        const bundleName = 'bundle-sample-v5'
        checkFoldersStructure(bundleName)
        expect(
          (ProcessExecutorService.executeProcess as sinon.SinonStub).called
        ).to.equal(true)

        const bundleDescriptor = parseBundleDescriptor(bundleName)
        expect(bundleDescriptor.name).to.eq(bundleName)
        expect(bundleDescriptor.version).to.eq('0.0.1')
        expect(bundleDescriptor.description).to.eq(
          'bundle-sample-v5 description'
        )
        expect(bundleDescriptor.type).to.eq('bundle')

        checkBundleFileDoesNotExist(
          bundleName,
          PSC_FOLDER,
          WIDGETS_FOLDER,
          'widget.yaml'
        )
      }
    )

  function checkMicroservice(
    bundleDescriptor: BundleDescriptor,
    microserviceName: string
  ) {
    checkMicroserviceFolders(bundleDescriptor.name, microserviceName)
    expect(bundleDescriptor.microservices.length).to.eq(1)
    expect(bundleDescriptor.microservices[0].name).to.eq(microserviceName)
    expect(bundleDescriptor.microservices[0].dbms).to.eq(DBMS.None)
    expect(bundleDescriptor.microservices[0].healthCheckPath).to.eq(
      '/api/health'
    )
    expect(bundleDescriptor.microservices[0].stack).to.eq(
      MicroserviceStack.Custom
    )
    expect(bundleDescriptor.microservices[0].commands).to.be.eql({
      build:
        "echo 'Please edit this command to customize the build phase' && exit 1",
      run: "echo 'Please edit this command to customize the run phase' && exit 1",
      pack: "echo 'Please edit this command to customize the pack phase' && exit 1"
    })

    expect(bundleDescriptor.microservices[0].permissions).to.be.eql([
      { clientId: 'realm-management', role: 'manage-users' },
      { clientId: 'realm-management', role: 'view-users' }
    ])
    expect(bundleDescriptor.microservices[0].roles).to.be.eql([
      'task-list',
      'task-get'
    ])
    expect(bundleDescriptor.microservices[0].securityLevel).to.eq('lenient')
    expect(bundleDescriptor.microservices[0].ingressPath).to.eq(
      '/entandoSamplePlugin'
    )
    expect(bundleDescriptor.microservices[0].version).to.eq('0.0.1')
  }

  function checkMicrofrontend(
    bundleDescriptor: BundleDescriptor,
    microfrontendName: string
  ) {
    checkMicrofrontendFolders(bundleDescriptor.name, microfrontendName)

    expect(bundleDescriptor.microfrontends.length).to.eq(1)
    expect(bundleDescriptor.microfrontends[0].name).to.eq(microfrontendName)

    expect(bundleDescriptor.microfrontends[0].group).to.eq('customGroup')

    expect(bundleDescriptor.microfrontends[0].stack).to.eq(
      MicroserviceStack.Custom
    )
    expect(bundleDescriptor.microfrontends[0].commands).to.be.eql({
      build:
        "echo 'Please edit this command to customize the build phase' && exit 1",
      run: "echo 'Please edit this command to customize the run phase' && exit 1",
      pack: "echo 'Please edit this command to customize the pack phase' && exit 1"
    })
  }

  function checkFoldersStructure(bundleName: string) {
    checkBundleFile(bundleName, CONFIG_FOLDER)
    checkBundleFile(bundleName, CONFIG_FOLDER, CONFIG_FILE)
    checkBundleFile(
      bundleName,
      ...LOGS_FOLDER,
      'conversion-bundle-sample-v1-to-v5.log'
    )
    checkBundleFile(bundleName, BUNDLE_DESCRIPTOR_FILE_NAME)
    checkBundleFile(bundleName, '.gitignore')
    checkBundleFile(bundleName, SVC_FOLDER)
  }

  function checkGitKeepFile(bundleName: string) {
    checkBundleFile(bundleName, MICROSERVICES_FOLDER, GITKEEP_FILE)
    checkBundleFile(bundleName, MICROFRONTENDS_FOLDER, GITKEEP_FILE)
    checkBundleFile(bundleName, PSC_FOLDER, GITKEEP_FILE)
  }

  function checkMicroserviceFolders(bundleName: string, pluginName: string) {
    checkBundleFile(bundleName, MICROSERVICES_FOLDER, pluginName)
  }

  function checkMicrofrontendFolders(bundleName: string, widgetName: string) {
    checkBundleFile(bundleName, MICROFRONTENDS_FOLDER, widgetName)
  }

  function checkWidgetPSCFolders(bundleName: string, widgetName: string) {
    checkBundleFile(
      bundleName,
      PSC_FOLDER,
      WIDGETS_FOLDER,
      `${widgetName}.yaml`
    )
  }

  function checkFTLFileForMfe(
    bundleName: string,
    mfeName: string,
    exists: boolean
  ) {
    const ftlName = `${mfeName}${CUSTOM_WIDGET_TEMPLATE_EXTENSION}`
    if (exists) {
      checkBundleFile(bundleName, MICROFRONTENDS_FOLDER, mfeName, ftlName)
    } else {
      checkBundleFileDoesNotExist(
        bundleName,
        MICROFRONTENDS_FOLDER,
        mfeName,
        ftlName
      )
    }
  }

  function checkFTLFileForPscWidget(
    bundleName: string,
    ftlName: string,
    exist: boolean
  ) {
    if (exist) {
      checkBundleFile(bundleName, PSC_FOLDER, WIDGETS_FOLDER, ftlName)
    } else {
      checkBundleFileDoesNotExist(
        bundleName,
        PSC_FOLDER,
        WIDGETS_FOLDER,
        ftlName
      )
    }
  }

  function checkBundleFile(bundleName: string, ...pathSegments: string[]) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(true)
  }

  function checkBundleFileDoesNotExist(
    bundleName: string,
    ...pathSegments: string[]
  ) {
    const filePath = path.resolve(
      tempDirHelper.tmpDir,
      bundleName,
      ...pathSegments
    )
    expect(fs.existsSync(filePath), `${filePath} wasn't created`).to.eq(false)
  }

  function parseBundleDescriptor(bundleName: string): BundleDescriptor {
    return new BundleDescriptorService(
      path.resolve(tempDirHelper.tmpDir, bundleName)
    ).getBundleDescriptor()
  }

  function parseWidgetDescriptorFromPscFolder(
    bundleName: string,
    widgetDescName: string
  ): YamlWidgetDescriptorV1 {
    const desc = fs.readFileSync(
      path.resolve(
        tempDirHelper.tmpDir,
        bundleName,
        PSC_FOLDER,
        WIDGETS_FOLDER,
        widgetDescName
      ),
      'utf-8'
    )
    return YAML.parse(desc) as YamlWidgetDescriptorV1
  }
})
