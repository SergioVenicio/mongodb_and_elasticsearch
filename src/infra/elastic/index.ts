import { Client } from "@elastic/elasticsearch"
import { Post } from "../../interfaces/Post"
import { ElasticSearchInterface, ISortField, UpdateParams } from "./interfaces"


interface EsResult {
  _source: any
}

class ElasticSearch<T> implements ElasticSearchInterface<T> {
  private esClient: Client

  constructor(esClient: Client) {
    this.esClient = esClient
  }

  async get(index: string, id: string): Promise<T> {
    const result = await this.esClient.get({index, id}) as EsResult
    return result._source as T
  }

  async scan(index: string, sort: ISortField[], from: number, size: number): Promise<T[]> {
    const result = await this.esClient.search({
      index,
      from,
      size,
      sort
    })
    const posts = result.hits.hits.map(document => {
      const result = {
          ...(document as EsResult)._source
      }
      return result as T
    })
    return posts
  }

  async update({index, id, doc}: UpdateParams): Promise<T> {
    await this.esClient.update({
      index,
      id,
      doc,
      doc_as_upsert: true
    })
    return {
      ...doc
    } as T
  }
}

export default ElasticSearch

export {
  UpdateParams,
  ISortField
}