import amqplib from "amqplib"

class RabbitMQ {
  private server_url: string
  constructor() {
    this.server_url = process.env.RABBITMQ_URL as string
  }

  async connect(): Promise<amqplib.Connection> {
    return await amqplib.connect(this.server_url);
  }

  async channel() {
    const conn = await this.connect()
    return await conn.createChannel()
  }
}

export default RabbitMQ