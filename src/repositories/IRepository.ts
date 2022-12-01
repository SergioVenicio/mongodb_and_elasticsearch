import { ISortField } from "../infra/elastic"

interface IRepository<T> {
  save(entity: T): Promise<T>
  update(entity: T): Promise<void>
  findById(id: string): Promise<T|undefined>
  find(sort: ISortField[], per_page: number, page: number): Promise<T[]>
}

export default IRepository