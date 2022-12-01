import pino from 'pino'

import { ISortField } from "../../infra/elastic"
import { ElasticSearchInterface } from "../../infra/elastic/interfaces"

import { PostModel } from "../../infra/mongoose/models"

import { Post } from "../../interfaces/Post"
import IRepository from "../IRepository"


interface PostRepositoryParams {
  logger: pino.BaseLogger,
  esClient: ElasticSearchInterface<Post>,
}

class PostRepository implements IRepository<Post> {
  private esClient: ElasticSearchInterface<Post>
  private logger: pino.BaseLogger

  constructor(params: PostRepositoryParams) {
    this.esClient = params.esClient
    this.logger = params.logger
  }

  async save(postDTO: Post): Promise<Post> {
    this.logger.info(`[PostRepository][save] saving ${JSON.stringify(postDTO)}...`, )
    const post = new PostModel({
      ...postDTO 
    })

    await post.save()       
    await this.replicate(post as Post)

    this.logger.info('[PostRepository][save] Done!')
    return {
      id: post.id as string,
      title: post.title as string,
      content: post.content as string,
      slug: post.slug as string,
      createdAt: (post as Post)?.createdAt as Date,
      updatedAt: (post as Post)?.updatedAt as Date
    }
  }

  async findById(id: string): Promise<Post|undefined> {
    this.logger.info(`[PostRepository][findById] finding ${id}...`, )
    try {
      const post = await this.esClient.get('posts', id)
      this.logger.info(`[PostRepository][findById] ${id} founded with ${JSON.stringify(post)}`, )
      return post
    } catch (error) {
      this.logger.info(`[PostRepository][findById] ${id} not found!`, )
      return undefined      
    }
  }

  async update(entity: Post): Promise<void> {
      PostModel.updateOne({
        _id: entity.id,
      }, {
        ...entity
      })

      await this.replicate(entity)
  }

  async find(sort: ISortField[], per_page: number, page: number = 1): Promise<Post[]>{
    this.logger.info(`[PostRepository][find] scaning...`, )
    const posts = await this.esClient.scan(
      'posts', sort, page - 1, per_page
    )
    this.logger.info(`[PostRepository][find] founded ${posts.length} items...`, )
    return posts
  }

  async replicate(post: Post) {
    this.logger.info(`[PostRepository][replicate] replicating ${JSON.stringify(post)}...`, )
    this.esClient.update({
      index: 'posts',
      id: post.id,
      doc: post,
    })
    this.logger.info(`[PostRepository][replicate] Done!`, )
  }

  changeIdFields(document: any) {
    const newDocument = {
      ...document
    }
    newDocument.id = newDocument._id
    delete newDocument._id
    return newDocument
  }
}

export default PostRepository