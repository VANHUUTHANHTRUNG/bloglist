const express = require('express')
const BlogModel = require('../models/blog')

const blogRouter = express.Router()

blogRouter.get('/', (req, res) =>
  BlogModel.find({}).then((blogs) => res.json(blogs))
)

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
      console.log(error)
      res.status(400).end()
    })
})

module.exports = blogRouter
