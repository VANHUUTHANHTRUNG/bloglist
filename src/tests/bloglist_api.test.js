const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const BlogModel = require('../models/blog')
const helper = require('../tests/test_helper')

const api = supertest(app) // mongoose connection was moved to app.js

beforeEach(async () => {
  await BlogModel.deleteMany({})
  await BlogModel.insertMany(helper.initialBlogs)
})

describe('GET /api/blogs/', () => {
  test('returns correct number of blogs', async () => {
    const res = await api.get('/api/blogs')
    expect(res.body).toHaveLength(helper.initialBlogs.length)
  })

  test('has JSON format', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('has a specific blog is within the returned blogs', async () => {
    const res = await api.get('/api/blogs')
    const titles = res.body.map((blog) => blog.title)
    expect(titles).toContain('First class tests')
  })

  test('has id transformed, toJSON() worked', async () => {
    const res = await api.get('/api/blogs')
    const blog = res.body[0]

    expect(blog.id).toBeDefined()
    expect(typeof blog.id).toBe('string')

    expect(blog._id).toBeUndefined()
    expect(blog.__v).toBeUndefined()
  })
})

describe('GET /api/blogs/:id', () => {
  test('returns correct blog from given id', async () => {
    const resAllBlock = await api.get('/api/blogs/')
    const blogToView = resAllBlock.body[0]
    const res = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const processedBlogToView = JSON.parse(JSON.stringify(blogToView))
    expect(res.body).toEqual(processedBlogToView)
  })

  test('fails with status code 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingBlogId()
    await api.get(`/api/blogs/${validNonExistingId}`).expect(404)
  })
})

describe('POST /api/blogs/', () => {
  test('successfully creates a new blog', async () => {
    const newBlog = new BlogModel({
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
    }).toJSON()

    await api
      .post('/api/blogs/')
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const currentBlogs = await helper.blogsInDB()
    expect(currentBlogs).toHaveLength(helper.initialBlogs.length + 1)

    const titles = currentBlogs.map((blog) => blog.title)
    expect(titles).toContain(newBlog.title)
  })
  test('has 0 as default likes', async () => {
    const newBlog = new BlogModel({
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
    }).toJSON()

    const res = await api
      .post('/api/blogs/')
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)
    expect(res.body.likes).toBe(0)
  })

  test('has both title and url', async () => {
    const urlMissingBlog = {
      author: 'Yoemi Park',
      title: 'In order to live',
      likes: 1000,
    }

    await api.post('/api/blogs/').send(urlMissingBlog).expect(400)

    const titleMissingBlog = {
      author: 'Yoemi Park',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
    }

    await api.post('/api/blogs/').send(titleMissingBlog).expect(400)
  })
})

describe('DELETE /api/blogs/:id', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDB()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((blog) => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status code 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingBlogId()
    await api.delete(`/api/blogs/${validNonExistingId}`).expect(404)
  })
})

describe('UPDATE /api/blogs/:id', () => {
  test('succeeds with status code 200 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDB()
    const blogToUpdate = blogsAtStart[0]
    const newBlog = { ...blogToUpdate, title: blogToUpdate.title + ' part 2' }
    await api.put(`/api/blogs/${blogToUpdate.id}`).send(newBlog).expect(200)

    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map((blog) => blog.title)
    expect(titles).toContain(newBlog.title)
    expect(titles).not.toContain(blogToUpdate.title)
  })
  test('fails with status code 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingBlogId()
    await api.put(`/api/blogs/${validNonExistingId}`).send({}).expect(404)
  })
})

afterAll(async () => await mongoose.connection.close())
