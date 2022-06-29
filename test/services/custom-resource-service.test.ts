import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { CustomResourceService } from '../../src/services/custom-resource-service'

describe('CustomResourceService', () => {
  let customResourceService: CustomResourceService

  const mockYmlBundleDescriptor = {
    name: 'jeff-bundle',
    description: 'This is an awesome bundle',
    components: {
      plugins: ['plugins/my-service.yaml', 'plugins/another-ms.yaml'],
      widgets: ['widgets/another-mfe.yaml'],
      'app-builder': ['widgets/jeff-mfe.yaml']
    },
    descriptorVersion: 'v5',
    thumbnail: 'data:image/png;base64,abcdef'
  }

  beforeEach(() => {
    sinon.restore()
  })

  test.it(
    'CustomResourceService should generate a valid CR without digest',
    () => {
      customResourceService = new CustomResourceService(
        'registry/repo/image',
        ['0.0.2', '0.0.1'],
        new Map(),
        mockYmlBundleDescriptor
      )
      const desc = customResourceService.createCustomResource()
      expect(desc.metadata.name).to.eq('jeff-bundle-b03baccb')
      expect(desc.metadata.labels.plugin).to.eq('true')
      expect(desc.metadata.labels.widget).to.eq('true')
      expect(desc.spec.details.name).to.eq(mockYmlBundleDescriptor.name)
      expect(desc.spec.details.description).to.eq(
        mockYmlBundleDescriptor.description
      )
      expect(desc.spec.details['dist-tags'].latest).to.eq('0.0.2')
      expect(desc.spec.details.versions).to.deep.eq(['0.0.2', '0.0.1'])
      expect(desc.spec.details.thumbnail).to.eq('data:image/png;base64,abcdef')
      expect(desc.spec.tags).to.deep.eq([
        {
          shasum: undefined,
          integrity: undefined,
          version: '0.0.2',
          tarball: 'docker://registry/repo/image'
        },
        {
          shasum: undefined,
          integrity: undefined,
          version: '0.0.1',
          tarball: 'docker://registry/repo/image'
        }
      ])
    }
  )

  test.it(
    'CustomResourceService should generate a valid CR with digests',
    () => {
      customResourceService = new CustomResourceService(
        'registry/repo/image',
        ['0.0.2', '0.0.1'],
        new Map([
          ['0.0.1', 'sha256:123456'],
          ['0.0.2', 'sha256:654321']
        ]),
        mockYmlBundleDescriptor
      )
      const desc = customResourceService.createCustomResource()
      expect(desc.metadata.name).to.eq('jeff-bundle-b03baccb')
      expect(desc.metadata.labels.plugin).to.eq('true')
      expect(desc.metadata.labels.widget).to.eq('true')
      expect(desc.spec.details.name).to.eq(mockYmlBundleDescriptor.name)
      expect(desc.spec.details.description).to.eq(
        mockYmlBundleDescriptor.description
      )
      expect(desc.spec.details['dist-tags'].latest).to.eq('0.0.2')
      expect(desc.spec.details.versions).to.deep.eq(['0.0.2', '0.0.1'])
      expect(desc.spec.details.thumbnail).to.eq('data:image/png;base64,abcdef')
      expect(desc.spec.tags).to.deep.eq([
        {
          shasum: 'sha256:654321',
          integrity: 'sha256:654321',
          version: '0.0.2',
          tarball: 'docker://registry/repo/image'
        },
        {
          shasum: 'sha256:123456',
          integrity: 'sha256:123456',
          version: '0.0.1',
          tarball: 'docker://registry/repo/image'
        }
      ])
    }
  )

  test.it(
    'CustomResourceService should generate a valid CR when there are no plugins',
    () => {
      const mockYmlBundleDescriptor = {
        name: 'jeff-bundle',
        description: 'This is an awesome bundle',
        components: {
          plugins: [],
          widgets: [],
          'app-builder': ['widgets/jeff-mfe.yaml']
        },
        descriptorVersion: 'v5',
        thumbnail: 'data:image/png;base64,abcdef'
      }
      customResourceService = new CustomResourceService(
        'registry/repo/image',
        ['0.0.2', '0.0.1'],
        new Map(),
        mockYmlBundleDescriptor
      )
      const desc = customResourceService.createCustomResource()
      expect(desc.metadata.labels.plugin).to.eq('false')
      expect(desc.metadata.labels.widget).to.eq('true')
    }
  )

  test.it(
    'CustomResourceService should generate a valid CR when there are no plugins and no widgets',
    () => {
      const mockYmlBundleDescriptor = {
        name: 'jeff-bundle',
        description: 'This is an awesome bundle',
        components: {
          plugins: [],
          widgets: [],
          'app-builder': []
        },
        descriptorVersion: 'v5',
        thumbnail: 'data:image/png;base64,abcdef'
      }
      customResourceService = new CustomResourceService(
        'registry/repo/image',
        ['0.0.2', '0.0.1'],
        new Map(),
        mockYmlBundleDescriptor
      )
      const desc = customResourceService.createCustomResource()
      expect(desc.metadata.labels.plugin).to.eq('false')
      expect(desc.metadata.labels.widget).to.eq('false')
    }
  )
})
