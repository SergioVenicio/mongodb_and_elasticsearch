import { BaseLogger } from "pino";
import { MongoMemoryServer } from 'mongodb-memory-server'
import { ObjectId} from 'mongodb'

import { Post } from "../../interfaces/Post";
import PostRepository from "../../repositories/post/post.repository";
import ElasticSearchMock from "../mocks/elasticSearchMock";
import { connect } from "mongoose";

let esClient: ElasticSearchMock<Post>
let repository: PostRepository;


describe('PostRepository test case', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27027
      }
    })
    const mongoURL = await mongod.getUri()
    await connect(mongoURL)
  })
  beforeEach(async () => {
    const pinoMock = {
      info: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      warn: jest.fn()
    } as unknown as BaseLogger
    esClient = new ElasticSearchMock<Post>()
    repository = new PostRepository({
      esClient,
      logger: pinoMock, 
    })
  })

  afterAll(async () => {
    esClient.mock.clearAll()
  })

  test('should be able to scan all registers', async () => {
    await repository.save({
      'id':  new ObjectId().toString(),
      'title': 'a test',
      'content': 'a test',
      'slug': 'a test'
    } as Post)
    await repository.save({
      'id':  new ObjectId().toString(),
      'title': 'b test2',
      'content': 'b test2',
      'slug': 'b test2'
    } as Post)
    var foundedRegisters = await repository.find([], 100, 1)
    expect(foundedRegisters.length).toBe(2)
    expect(foundedRegisters[0].title).toBe('a test')

    var foundedRegisters = await repository.find([], 1, 1)
    expect(foundedRegisters.length).toBe(1)
    expect(foundedRegisters[0].title).toBe('a test')

    var foundedRegisters = await repository.find([], 1, 2)
    expect(foundedRegisters.length).toBe(1)
    expect(foundedRegisters[0].title).toBe('b test2')
  })

  test('should be able to save a new post', async () => {
    const post = await repository.save({
      'id':  new ObjectId().toString(),
      'title': 'test',
      'content': 'test',
      'slug': 'test'
    } as Post)

    expect(post.content == 'test')
    expect(post.createdAt).not.toBeUndefined()

    const founded = await repository.findById(post.id)
    expect(founded?.id).toEqual(post.id)
    expect(founded?.createdAt).toEqual(post.createdAt)
  })
})