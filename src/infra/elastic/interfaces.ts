import { FieldSort } from "@elastic/elasticsearch/lib/api/types"

interface UpdateParams {
  index: string,
  id: string,
  doc: any
}

interface ISortField {
  [field: string]: FieldSort
}

interface ElasticSearchInterface<T> {
  update(params: UpdateParams): Promise<T>
  get(index: string, id: string): Promise<T>
  scan(idnex: string, sort: ISortField[], from: number, size: number): Promise<T[]>
}

export {
  UpdateParams,
  ISortField,
  ElasticSearchInterface
}