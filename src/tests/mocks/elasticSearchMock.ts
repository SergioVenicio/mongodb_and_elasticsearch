import { Client } from "@elastic/elasticsearch";
import ElasticSearch, { ISortField, UpdateParams } from "../../infra/elastic";
import { Post } from "../../interfaces/Post";
import ESMock  from '@elastic/elasticsearch-mock'

class ElasticSearchMock<T> extends ElasticSearch<T> {
  public mock
  private indexes: {
    [index: string]: any[]
  }

  constructor() {
    const mock = new ESMock()
    const esClient = new Client({
      node: 'http://localhost:9200',
      Connection: mock.getConnection()
    })
    super(esClient)
    this.mock = mock
    this.indexes = {}
  }

  async update({ index, id, doc }: UpdateParams): Promise<T> {
    if (!this.indexes[index]) {
      this.indexes[index] = [doc]
      return {
        ...doc
      }
    }

    this.indexes[index].push(doc)
    return {
      ...doc
    }
  }

  async get(index: string, id: string): Promise<T> {
    const items = this.indexes[index] || []
    const item =  items.find(item => {
      return item.id  === id
    })
    return item
  }

  async scan(index: string, sort: ISortField[], from: number, size: number): Promise<T[]> {
    const items = (this.indexes[index] || [])
    return this.makeChunk(items, from, size) as T[]
  }

  private makeChunk(items: T[], from: number, size: number) {
    let newItems = []
    let i = 0;
    for(const item of items) {
      if (i < from ) {
        i++
        continue
      }
      else if (newItems.length < size) {
        i++
        newItems.push(item)
        continue
      }

      break
    }

    return newItems
  }
}
export default ElasticSearchMock