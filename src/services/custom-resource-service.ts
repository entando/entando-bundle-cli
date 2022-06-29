import { CustomResourceDescriptor } from '../models/custom-resource-descriptor'
import { YamlBundleDescriptor } from '../models/yaml-bundle-descriptor'
import { BundleService } from './bundle-service'

const TARBALL_PREFIX = 'docker://'
const API_VERSION = 'entando.org/v1'
const KIND = 'EntandoDeBundle'

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
          plugin: 'false',
          widget: 'false',
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
        tarball: TARBALL_PREFIX + this.image,
        integrity: this.digests.get(tag),
        shasum: this.digests.get(tag)
      })
    }

    if (this.yamlDescriptor.components.plugins.length > 0) {
      crDescriptor.metadata.labels.plugin = 'true'
    }

    if (
      this.yamlDescriptor.components.widgets.length > 0 ||
      this.yamlDescriptor.components['app-builder'].length > 0
    ) {
      crDescriptor.metadata.labels.widget = 'true'
    }

    return crDescriptor
  }
}
