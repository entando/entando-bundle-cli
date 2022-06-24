export enum RequestFilterOperator {
  Like = 'like',
  Equal = 'eq',
  NotEqual = 'not',
  Greater = 'gt',
  Lower = 'lower'
}

export type RequestFilter = {
  attribute: string
  operator: RequestFilterOperator
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
