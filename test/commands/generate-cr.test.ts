import {expect, test} from '@oclif/test'
import {BundleDescriptorService} from '../../src/services/bundle-descriptor-service'
import {BundleService} from '../../src/services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../../src/services/config-service'
import {BundleDescriptorHelper} from '../helpers/mocks/bundle-descriptor-helper'
import {DockerService} from '../../src/services/docker-service'
import * as sinon from 'sinon'
import {StubParallelProcessExecutorService} from '../helpers/mocks/stub-process'
import {CLIError} from '@oclif/errors'
import {TempDirHelper} from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {CliUx} from '@oclif/core'

describe('generate-cr', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  const tags = ['0.0.2', '0.0.1']
  const devTags = ['3.0.0-SNAPSHOT', '3.0.0-EHUB-234-PR-34', 'v3.0.0-SNAPSHOT', 'v3.0.0-EHUB-234-PR-34', 'v4.0.0-MY-CUSTOM-TAG']
  const prodTags = ['2.0.0', 'v2.0.0', 'v3.0.0', 'v3.1.1', '3.0.0-fix.1', '3.0.0-patch.1', 'v3.0.0-fix.1', 'v3.0.0-patch.1']
  const invalidTags = ['main', 'INVALID', 'v2.0.0-', '3.0.0-', '-3.1.1', 'a3.0.0-fix.1']
  const allTags = [...devTags, ...prodTags, ...invalidTags];
  const yamlDescriptor = BundleDescriptorHelper.newYamlBundleDescriptor()

  test
    .command('generate-cr')
    .catch(error => {
      expect(error.message).contain('not an initialized bundle project')
      expect(error.message).contain('Use the --image flag')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Exits if is not a valid bundle project')

  test
    .stdout()
    .command(['generate-cr', '--image', 'invalid-format'])
    .catch(error => {
      expect(error.message).contain('Invalid bundle image format')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Exits if image flag has invalid format')

  test
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
    })
    .stdout()
    .command(['generate-cr', '--image', 'entando/my-bundle'])
    .it('Accepts image name without registry', () => {
      const listTagsStub = DockerService.listTags as sinon.SinonStub
      sinon.assert.calledWith(
        listTagsStub,
        `${DockerService.getDefaultDockerRegistry()}/entando/my-bundle`
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
    })
    .stdout()
    .command([
      'generate-cr',
      '--image',
      'custom-registry.org/entando/my-bundle'
    ])
    .it('Accepts image name with registry', () => {
      const listTagsStub = DockerService.listTags as sinon.SinonStub
      sinon.assert.calledWith(
        listTagsStub,
        'custom-registry.org/entando/my-bundle'
      )
    })

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
    })
    .command('generate-cr')
    .catch(error => {
      expect(error.message).contain(
        'Docker organization not configured for the project'
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Exits if Docker organization is not found')

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
    })
    .stdout()
    .command('generate-cr')
    .it('Generate CR for current project and default registry', () => {
      const listTagsStub = DockerService.listTags as sinon.SinonStub
      sinon.assert.calledWith(
        listTagsStub,
        `${DockerService.getDefaultDockerRegistry()}/my-org/test-bundle`
      )
    })

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
      sinon
        .stub(ConfigService.prototype, 'getProperty')
        .withArgs(DOCKER_ORGANIZATION_PROPERTY)
        .returns('my-org')
        .withArgs(DOCKER_REGISTRY_PROPERTY)
        .returns('custom-registry.org')
      sinon
        .stub(BundleDescriptorService.prototype, 'getBundleDescriptor')
        .returns(BundleDescriptorHelper.newBundleDescriptor())
      sinon.stub(DockerService, 'listTags').resolves(tags)

      const stubDigestsExecutor = createStubDigestsExecutor(2)
      sinon
        .stub(DockerService, 'getDigestsExecutor')
        .returns(stubDigestsExecutor)

      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
    })
    .stdout()
    .stderr()
    .command(['generate-cr', '--digest'])
    .it(
      'Generate CR with digests for current project and custom registry',
      ctx => {
        const listTagsStub = DockerService.listTags as sinon.SinonStub
        sinon.assert.calledWith(
          listTagsStub,
          'custom-registry.org/my-org/test-bundle'
        )
        const getDigestsExecutorStub =
          DockerService.getDigestsExecutor as sinon.SinonStub
        sinon.assert.calledWith(
          getDigestsExecutorStub,
          'custom-registry.org/my-org/test-bundle',
          tags
        )
        expect(ctx.stderr).contain('Fetching bundle Docker repository tags')
      }
    )

  test
    .do(() => {
      sinon.stub(BundleService, 'isValidBundleProject')
      sinon.stub(DockerService, 'listTags').resolves(tags)
      const stubDigestsExecutor =
        new (class extends StubParallelProcessExecutorService {
          async getDigests(): Promise<Map<string, string>> {
            await super.execute()
            throw new CLIError('Unable to retrieve digests')
          }
        })([1, 1])
      sinon
        .stub(DockerService, 'getDigestsExecutor')
        .returns(stubDigestsExecutor)
    })
    .stdout()
    .stderr()
    .command([
      'generate-cr',
      '--digest',
      '--image',
      'docker://custom-registry.org/my-org/my-image'
    ])
    .catch(error => {
      expect(error.message).contain('Unable to retrieve digests')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Generate CR with digests fails retrieving digests', () => {
      const listTagsStub = DockerService.listTags as sinon.SinonStub
      sinon.assert.calledWith(
        listTagsStub,
        'custom-registry.org/my-org/my-image'
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves([])
    })
    .stdout()
    .stderr()
    .command(['generate-cr', '--image', 'docker://my-org/my-image'])
    .catch(error => {
      expect(error.message).contain('No tags found')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Generate CR fails if image has no tags', () => {
      const listTagsStub = DockerService.listTags as sinon.SinonStub
      sinon.assert.calledWith(
        listTagsStub,
        DockerService.getDefaultDockerRegistry() + '/my-org/my-image'
      )
    })

  test
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
    })
    .stdout()
    .stderr()
    .command(['generate-cr', '--image', 'my-org/my-image', '-o', 'my-cr.yml'])
    .it('Generate CR using output file', () => {
      expect(fs.existsSync('my-cr.yml')).eq(true)
    })

  test
    .stdout()
    .stderr()
    .command(['generate-cr', '-o', 'path/to/my-cr.yml'])
    .catch(error => {
      expect(error.message).contain(
        "Parent directory for the specified output file doesn't exist"
      )
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it("Generate CR fails if output file parent directory doesn't exist")

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      const existingCr = path.join(tempDirHelper.tmpDir, 'existing-cr-1.yml')
      fs.writeFileSync(existingCr, '')
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(false))
    .command(['generate-cr', '-o', 'existing-cr-1.yml'])
    .it(
      "Generate CR stops if user doesn't want to overwrite the existing file",
      () => {
        const listTagsStub = DockerService.listTags as sinon.SinonStub
        sinon.assert.notCalled(listTagsStub)
      }
    )

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
      const existingCr = path.join(tempDirHelper.tmpDir, 'existing-cr-2.yml')
      fs.writeFileSync(existingCr, '')
    })
    .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(true))
    .command([
      'generate-cr',
      '-o',
      'existing-cr-2.yml',
      '-i',
      'my-org/my-image'
    ])
    .it(
      'Generate CR proceeds if user wants to overwrite the existing file',
      () => {
        const listTagsStub = DockerService.listTags as sinon.SinonStub
        sinon.assert.calledOnce(listTagsStub)
      }
    )

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(DockerService, 'listTags').resolves(tags)
      sinon
        .stub(DockerService, 'getYamlDescriptorFromImage')
        .resolves(yamlDescriptor)
      const existingCr = path.join(tempDirHelper.tmpDir, 'existing-cr-3.yml')
      fs.writeFileSync(existingCr, '')
    })
    .command([
      'generate-cr',
      '-f',
      '-o',
      'existing-cr-3.yml',
      '-i',
      'my-org/my-image'
    ])
    .it(
      'Generate CR overwrites the existing file without asking confirmation',
      () => {
        const listTagsStub = DockerService.listTags as sinon.SinonStub
        sinon.assert.calledOnce(listTagsStub)
      }
    )

  test
    .stdout()
    .stderr()
    .command(['generate-cr', '-f', '-i', 'my-org/my-image'])
    .catch(error => {
      expect(error.message).contain('must also be provided when using')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it("generate-cr -f can't be used without -o")


  // TAG FILTERING TESTS
  executeTagFilteringTest(['dev'], devTags);
  executeTagFilteringTest(['prod'], prodTags);
  executeTagFilteringTest(['dev', 'prod'], [...devTags, ...prodTags]);

  function executeTagFilteringTest(tagTypes: string[], expectedTags: string[]) {

    test
      .stdout()
      .stderr()
      .do(() => {
        sinon.stub(DockerService, 'listTags').resolves(allTags)
        const stubDigestsExecutor = createStubDigestsExecutor(expectedTags.length);
        sinon
          .stub(DockerService, 'getDigestsExecutor')
          .returns(stubDigestsExecutor)
        sinon.stub(DockerService, 'getYamlDescriptorFromImage').resolves(yamlDescriptor)
      })
      .stub(CliUx.ux, 'confirm', () => sinon.stub().resolves(true))
      .command([
        'generate-cr',
        '-i',
        'my-org/my-image',
        '-d',
        '-t',
        ...tagTypes
      ])
      .it(
        `Filter tags by ${tagTypes} tag type`,
        () => {
          const listTagsStub = DockerService.getDigestsExecutor as sinon.SinonStub
          sinon.assert.calledWith(
            listTagsStub,
            'registry.hub.docker.com/my-org/my-image',
            expectedTags)
        }
      )
  }
})

function createStubDigestsExecutor(resultsCount: number) {
  return new (class extends StubParallelProcessExecutorService {
    async getDigests(): Promise<Map<string, string>> {
      await super.execute()
      const tagsWithDigests = new Map()
      for (let i = resultsCount; i > 0; i--) {
        tagsWithDigests.set(`0.0.${i}`, `sha256:abcd${i}`)
      }

      return tagsWithDigests
    }
  })(Array.from<number>({length: resultsCount}).fill(0))
}
