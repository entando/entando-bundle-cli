export type CmBundle = {
  bundleId: string
  bundleName: string
  componentTypes: string[]
  installed: boolean
  publicationUrl: string
}

export type Plugin = {
  bundleId: string
  pluginId: string
  pluginName: string
  pluginCode: string
  ingressPath: string
  roles: string[]
}
