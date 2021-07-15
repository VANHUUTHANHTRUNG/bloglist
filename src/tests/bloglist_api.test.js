const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const BlogModel = require('../models/blog')
const initialBlogs = require('../utils/initialBlogs')

const api = supertest(app) // mongoose connection was moved to app.js

beforeEach = async () => {
  await BlogModel.deleteMany({})
  for (const blog of initialBlogs) {
    const newBlog = new BlogModel(blog)
    await newBlog.save()
  }
}

describe('Test GET on /api/blogs/', () => {
  test('Correct number of blogs', async () => {
    const res = await api.get('/api/blogs')
    expect(res.body).toHaveLength(initialBlogs.length)
  })
  test('JSON format', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })
  test('a specific blog is within the returned blogs', async () => {
    const res = await api.get('/api/blogs')
    const titles = res.body.map((blog) => blog.title)
    expect(titles).toContain('First class tests')
  })
})

afterAll(() => mongoose.connection.close())
