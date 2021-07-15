const express = require('express')
const BlogModel = require('../models/blog')
const logger = require('../utils/logger')
const blogRouter = express.Router()

blogRouter.get('/', async (req, res) => res.json(await BlogModel.find({})))

blogRouter.post('/', (req, res) => {
  const body = req.body
  const newBlog = new BlogModel({
    author: body.author,
    title: body.title,
    url: body.url,
    likes: body.likes,
  })
  newBlog
    .save()
    .then((result) => res.status(201).json(result))
    .catch((error) => {
      logger.error(error)
      res.status(400).end()
    })
})

module.exports = blogRouter
