export type CustomResourceTag = {
  version: string
  shasum?: string
  integrity?: string
  tarball: string
}

export type CustomResourceDescriptor = {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    labels: {
      plugin: boolean
      widget: boolean
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
