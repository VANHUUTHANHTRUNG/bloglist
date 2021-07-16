const express = require('express')
const BlogModel = require('../models/blog')
const logger = require('../utils/logger')
const blogRouter = express.Router()

blogRouter.get('/', async (req, res) => {
  const blogs = await BlogModel.find({})
  res.json(blogs.map((blog) => blog.toJSON()))
})

blogRouter.get('/:id', async (req, res) => {
  const blog = await BlogModel.findById(req.params.id)
  if (blog) return res.json(blog)
  return res.status(404).end()
})

blogRouter.post('/', async (req, res) => {
  const body = await req.body
  const newBlog = new BlogModel({
    author: body.author,
    title: body.title,
    url: body.url,
    likes: body.likes !== undefined ? body.likes : 0,
  })
  try {
    const result = await newBlog.save()
    return res.status(201).json(result)
  } catch {
    return res.status(400).end()
  }
})

blogRouter.delete('/:id', async (req, res) => {
  const deletedBlog = await BlogModel.findByIdAndRemove(req.params.id)
  if (deletedBlog) return res.status(204).end()
  return res.status(404).end()
})

blogRouter.put('/:id', async (req, res) => {
  const body = req.body
  const newBlog = { ...req.body }
  const updatedBlog = await BlogModel.findByIdAndUpdate(
    req.params.id,
    newBlog,
    { new: true }
  )
  if (updatedBlog) {
    return res.status(200).end()
  }
  return res.status(404).end()
})

module.exports = blogRouter
