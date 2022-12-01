import express, { Request, Response } from "express"

import pino from 'pino'

import PostRepository from "../repositories/post/post.repository"
import PostController from "../controllers/post/post.controller"
import RabbitMQ from "../infra/rabbitmq"
import ElasticSearch from "../infra/elastic"
import { Client } from "@elastic/elasticsearch"
import { Post } from "../interfaces/Post"

const postRouter = express.Router()

const logger = pino({
  name: "PostRepository"
})
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
const postRepository = new PostRepository({
  logger,
  esClient
})

const rabbitmq = new RabbitMQ()
const controller = new PostController(rabbitmq, postRepository)

postRouter.post("/", async(req: Request, res: Response) => {
  controller.create(req, res)
})
postRouter.get("/",  async(req: Request, res: Response) => {
  controller.get(req, res)
})
postRouter.get("/:id", async(req: Request, res: Response) => {
  controller.getById(req, res)
})
postRouter.put("/:id", async(req: Request, res: Response) => {
  controller.update(req, res)
})

export default postRouter