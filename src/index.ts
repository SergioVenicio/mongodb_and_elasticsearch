import dotenv from 'dotenv'
dotenv.config()

import express from "express"
import mongoose from 'mongoose';

const pino = require('express-pino-logger')();

require('express-async-errors')

import mainRouter from "./routes/main.router"


const app = express()
app.use(express.json())
app.use(pino)
app.use(mainRouter)

app.listen(3333, () => {
  mongoose.connect(process.env.MONGO_URL as string)
  console.log(":3333")
})