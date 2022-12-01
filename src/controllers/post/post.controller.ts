import slugify from "slugify"

import { Request, Response } from "express"

import IRepository from "../../repositories/IRepository"
import { Post, PostDTO } from "../../interfaces/Post"
import RabbitMQ from "../../infra/rabbitmq"
import { ISortField } from "../../infra/elastic"

interface Errors {
    [key: string]: string
}

class PostController {
    private rabbitmq: RabbitMQ
    private repository: IRepository<Post>
    private exchange: string = process.env.POST_EXCHANGE as string
    private queues = {
        'create': process.env.POST_CREATE_QUEUE as string,
        'update': process.env.POST_UPDATE_QUEUE as string
    }

    constructor(
        rabbitmq: RabbitMQ,
        repository: IRepository<Post>
    ) {
        this.rabbitmq = rabbitmq
        this.repository = repository
    }

    async create(req: Request, res: Response) {
        const {title, content} = req.body
        const errors: Errors = {}
        if (!title) {
            errors.title = 'Title is required!'
        }
        if (!content) {
            errors.content = 'Content is required!'
        }

        if (errors.title || errors.content) {
            res.status(400).json(errors)
            return
        }

        const postDTO = {
            title,
            content,
            slug: slugify(title),
            createdAt: new Date()
        } as PostDTO
        await this.request_creation(postDTO)
        res.status(201).json()
    }

    async sendRequest(post: PostDTO, queue: string, routingKey: string) {
        const chan = await this.rabbitmq.channel()

        await chan.assertExchange(this.exchange, 'topic', { durable: true })
        await chan.assertQueue(queue, {
            durable: true,
            exclusive: false
        })
        await chan.bindQueue(queue, this.exchange, routingKey)

        const msg = JSON.stringify({...post})
        await chan.sendToQueue(queue, Buffer.from(msg))
    }

    async request_creation(post: PostDTO): Promise<void> {
        const queue = this.queues['create']
        await this.sendRequest(post, queue, 'POST.CREATE')
    }

    async request_update(post: PostDTO): Promise<void> {
        const queue = this.queues['update']
        await this.sendRequest(post, queue, 'POST.UPDATE')
    }

    async get(req: Request, res: Response) {
        let page = (req.query.page|| 1) as number
        const per_page = (req.query.per_page || 100) as number

        const sort = [
            {'createdAt': 'desc'} as ISortField
        ]

        if (page < 1)  {
            page = 1
        }
        res.json(
            await this.repository.find(sort, per_page, page)
        )
    }

    async getById(req: Request, res: Response) {
        const id = req.params.id
        const post = await this.repository.findById(id)
        if (post === undefined) {
            return res.status(404).json()
        }

        res.json(post)
    }

    async update(req: Request, res: Response) {
        const id = req.params.id
        const post = await this.repository.findById(id)
        if (post === undefined) {
            return res.status(404).json()
        }

        const {title, content} = req.body
        const errors: Errors = {}
        if (!title) {
            errors.title = 'Title is required!'
        }
        if (!content) {
            errors.content = 'Content is required!'
        }

        if (errors.title || errors.content) {
            res.status(400).json(errors)
            return
        }
        
        await this.request_update({
            ...post,
            id,
            content,
            title,
            updatedAt: new Date()
        } as PostDTO)
        res.status(204).send()
    }
}

export default PostController