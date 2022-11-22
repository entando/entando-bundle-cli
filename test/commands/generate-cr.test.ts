import { expect, test } from '@oclif/test'
import { BundleDescriptorService } from '../../src/services/bundle-descriptor-service'
import { BundleService } from '../../src/services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../../src/services/config-service'
import { BundleDescriptorHelper } from '../helpers/mocks/bundle-descriptor-helper'
import { DockerService } from '../../src/services/docker-service'
import * as sinon from 'sinon'
import { StubParallelProcessExecutorService } from '../helpers/mocks/stub-parallel-process-executor-service'
import { CLIError } from '@oclif/errors'
import { TempDirHelper } from '../helpers/temp-dir-helper'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CliUx } from '@oclif/core'

describe('generate-cr', () => {
  const tempDirHelper = new TempDirHelper(__filename)

  afterEach(() => {
    sinon.restore()
  })

  const tags = ['0.0.2', '0.0.1']
  const yamlDescriptor = BundleDescriptorHelper.newYamlBundleDescriptor()

  test
    .command('generate-cr')
    .catch(error => {
      expect(error.message).contain('not an initialized bundle project')
      expect(error.message).contain('Use the --image flag')
    })
    .it('Exits if is not a valid bundle project')

  test
    .stdout()
    .command(['generate-cr', '--image', 'invalid-format'])
    .catch(error => {
      expect(error.message).contain('Invalid bundle image format')
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

      const stubDigestsExecutor =
        new (class extends StubParallelProcessExecutorService {
          async getDigests(): Promise<Map<string, string>> {
            await super.execute()
            const tagsWithDigests = new Map()
            tagsWithDigests.set('0.0.2', 'sha256:abcd')
            tagsWithDigests.set('0.0.1', 'sha256:1234')
            return tagsWithDigests
          }
        })([0, 0])
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
    })
    .it("generate-cr -f can't be used without -o")
})
