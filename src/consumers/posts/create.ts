import dotenv from 'dotenv'
dotenv.config()

import amqplib from "amqplib"

import pino from 'pino'

import RabbitMQ from "../../infra/rabbitmq"
import { Post } from '../../interfaces/Post'
import IRepository from '../../repositories/IRepository'
import PostRepository from '../../repositories/post/post.repository'
import mongoose from 'mongoose'
import { Client } from '@elastic/elasticsearch'
import ElasticSearch from '../../infra/elastic'


const exchange = process.env.POST_EXCHANGE as string
const queue = process.env.POST_CREATE_QUEUE as string


class CreatePostConsumer {
  private logger: pino.BaseLogger
  private repository: IRepository<Post>

  constructor(
    repository: IRepository<Post>
  ) {
    this.repository = repository
    this.logger = pino({
      name: "CreatePostConsumer"
    })
  }

  async consume(msg: amqplib.Message|null) {
    if (!msg) {
      return
    }

    
    const post = JSON.parse(msg.content.toString())
    this.logger.info('Message received', post)
    await this.repository.save(post as Post)
  }
}

async function main () {
  const rabbitmq = new RabbitMQ()
  const chan = await rabbitmq.channel()
  await chan.assertExchange(exchange, 'topic', { durable: true })
  await chan.assertQueue(queue, {
      durable: true,
      exclusive: false
  })
  await chan.bindQueue(queue, exchange, 'CREATE')
  const user = process.env.ES_USER as string
  const pwd = process.env.ES_PWD as string
  const esCLient = new Client({
    node: process.env.ES_SERVER,
    auth: {
      username: user,
      password: pwd,
    }
  })
  const esClient = new ElasticSearch<Post>(esCLient)

  const mongoURL = process.env.MONGO_URL as string
  mongoose.connect(mongoURL)
  const repository = new PostRepository({
    esClient,
    logger: pino()
  })
  const consumer = new CreatePostConsumer(repository)

  chan.consume(queue, async (msg) => {
    mongoose.connect(process.env.MONGO_URL as string)
    consumer.consume(msg)
    chan.ack(msg as amqplib.Message)
  }, { noAck: false})
}


main()