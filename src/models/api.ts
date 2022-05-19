export enum ApiType {
  Internal = 'internal',
  External = 'external'
}

export interface ApiClaim {
  name: string,
  type: ApiType,
  serviceId: string,
  bundleId?: string
}
