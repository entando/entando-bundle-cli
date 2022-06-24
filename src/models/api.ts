export type RequestFilter = {
  attribute: string
  operator: string
  value: string
}

export type PagedMetadata = {
  page: number
  pageSize: number
  lastPage: number
  totalItems: number
  sort: string
  direction: string
  filters: RequestFilter[]
}

export type PagedResponseBody<T> = {
  payload: T[]
  metadata: PagedMetadata
}
