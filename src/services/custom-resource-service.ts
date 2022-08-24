import { DOCKER_PREFIX } from '../models/bundle-descriptor-constraints'
import {
  CustomResourceComponentLabels,
  CustomResourceDescriptor
} from '../models/custom-resource-descriptor'
import {
  SupportedComponents,
  YamlBundleDescriptor
} from '../models/yaml-bundle-descriptor'
import { BundleService } from './bundle-service'

const API_VERSION = 'entando.org/v1'
const KIND = 'EntandoDeBundle'

const LABELS_MAPPING: Record<
  SupportedComponents,
  CustomResourceComponentLabels
> = {
  plugins: 'plugin',
  widgets: 'widget',
  assets: 'asset',
  categories: 'category',
  contentTemplates: 'contentTemplate',
  contentModels: 'contentTemplate', // renaming old nomenclature
  contentTypes: 'contentType',
  contents: 'content',
  fragments: 'fragment',
  groups: 'group',
  labels: 'label',
  languages: 'language',
  pages: 'page',
  pageTemplates: 'pageTemplate',
  pageModels: 'pageTemplate', // renaming old nomenclature
  resources: 'resource'
}

export class CustomResourceService {
  private readonly image: string

  private readonly tags: string[]

  private readonly digests: Map<string, string>

  private readonly yamlDescriptor: YamlBundleDescriptor

  public constructor(
    image: string,
    tags: string[],
    digests: Map<string, string>,
    yamlDescriptor: YamlBundleDescriptor
  ) {
    this.image = image
    this.tags = tags
    this.digests = digests
    this.yamlDescriptor = yamlDescriptor
  }

  public createCustomResource(): CustomResourceDescriptor {
    const crDescriptor: CustomResourceDescriptor = {
      apiVersion: API_VERSION,
      kind: KIND,
      metadata: {
        name:
          this.yamlDescriptor.name +
          '-' +
          BundleService.generateBundleId(this.image),
        labels: {
          'bundle-type': 'standard-bundle'
        }
      },
      spec: {
        details: {
          name: this.yamlDescriptor.name,
          description: this.yamlDescriptor.description,
          'dist-tags': {
            latest: this.tags[0]
          },
          versions: [],
          thumbnail: this.yamlDescriptor.thumbnail
        },
        tags: []
      }
    }

    for (const tag of this.tags) {
      crDescriptor.spec.details.versions.push(tag)

      crDescriptor.spec.tags.push({
        version: tag,
        tarball: DOCKER_PREFIX + this.image,
        integrity: this.digests.get(tag),
        shasum: this.digests.get(tag)
      })
    }

    // Adding components labels
    for (const [key, mapping] of Object.entries(LABELS_MAPPING)) {
      if (this.yamlDescriptor.components[key as SupportedComponents]?.length) {
        crDescriptor.metadata.labels[mapping] = 'true'
      }
    }

    return crDescriptor
  }
}
