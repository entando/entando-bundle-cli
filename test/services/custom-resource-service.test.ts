import { expect, test } from '@oclif/test'
import * as sinon from 'sinon'
import { YamlBundleDescriptor } from '../../src/models/yaml-bundle-descriptor'
import { CustomResourceService } from '../../src/services/custom-resource-service'

describe('CustomResourceService', () => {
  let customResourceService: CustomResourceService

  const mockYmlBundleDescriptor = {
    name: 'jeff-bundle',
    description: 'This is an awesome bundle',
    components: {
      plugins: ['plugins/my-service.yaml', 'plugins/another-ms.yaml'],
      widgets: ['widgets/jeff-mfe.yaml', 'widgets/another-mfe.yaml']
    },
    descriptorVersion: 'v6',
    thumbnail: 'data:image/png;base64,abcdef',
  }
    const mockYmlBundleDescriptorMultiTenants = {
        name: 'mt-bundle',
        description: 'This is an awesome bundle',
        components: {
            plugins: ['plugins/my-service.yaml', 'plugins/another-ms.yaml'],
            widgets: ['widgets/my-mfe.yaml', 'widgets/another-mfe.yaml']
        },
        descriptorVersion: 'v6',
        thumbnail: 'data:image/png;base64,abcdef',
        tenants: ['tenant1','tenant2']
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
        mockYmlBundleDescriptor,
        [],
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
      expect(desc.metadata.annotations["entando.org/tenants"]).to.eq('primary')
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
        mockYmlBundleDescriptor,
        []
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

  test.it('CustomResourceService should generate component labels', () => {
    const mockYmlBundleDescriptor: YamlBundleDescriptor = {
      name: 'jeff-bundle',
      description: 'This is an awesome bundle',
      components: {
        widgets: ['widgets/widget.yaml'],
        assets: ['assets/image.yaml'],
        categories: ['categories/categories.yaml'],
        labels: []
      },
      descriptorVersion: 'v6',
      thumbnail: 'data:image/png;base64,abcdef'
    }
    customResourceService = new CustomResourceService(
      'registry/repo/image',
      ['0.0.2', '0.0.1'],
      new Map(),
      mockYmlBundleDescriptor,
      []
    )
    const desc = customResourceService.createCustomResource()
    expect(desc.metadata.labels.plugin).undefined
    expect(desc.metadata.labels.widget).to.eq('true')
    expect(desc.metadata.labels.asset).to.eq('true')
    expect(desc.metadata.labels.category).to.eq('true')
    expect(desc.metadata.labels.label).undefined
  })

  test.it(
      'CustomResourceService should generate valid annotations with a list of tenants',
      () => {
          customResourceService = new CustomResourceService(
              'registry/repo/image',
              ['0.0.2', '0.0.1'],
              new Map(),
              mockYmlBundleDescriptorMultiTenants,
              ['tenant1','tenant2'],
          )
          const desc = customResourceService.createCustomResource()

          expect(desc.metadata.annotations["entando.org/tenants"]).to.eq(
              mockYmlBundleDescriptorMultiTenants.tenants.toString()
          )
      }
  )
})
