import express from "express"

import postRouter from "./post.router"

const mainRouter = express.Router()

mainRouter.use("/post", postRouter)

export default mainRouter