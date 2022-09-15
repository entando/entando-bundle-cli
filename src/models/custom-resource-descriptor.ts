export type CustomResourceTag = {
  version: string
  shasum?: string
  integrity?: string
  tarball: string
}

export const CUSTOM_RESOURCE_COMPONENT_LABELS = [
  'plugin',
  'widget',
  'asset',
  'category',
  'contentTemplate',
  'contentType',
  'content',
  'fragment',
  'group',
  'label',
  'language',
  'page',
  'pageTemplate',
  'resource'
] as const

export type CustomResourceComponentLabels =
  typeof CUSTOM_RESOURCE_COMPONENT_LABELS[number]

export type CustomResourceDescriptor = {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    labels: {
      [key in CustomResourceComponentLabels]?: 'true' | 'false'
    } & {
      'bundle-type': string
    }
  }
  spec: {
    details: {
      name: string
      description?: string
      'dist-tags': {
        latest: string
      }
      versions: string[]
      thumbnail?: string
    }
    tags: CustomResourceTag[]
  }
}
