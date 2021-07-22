const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const BlogModel = require('../models/blog')
const UserModel = require('../models/user')
const helper = require('../tests/test_helper')

const api = supertest(app) // mongoose connection was moved to app.js
const saltRounds = 10
let infoFromToken = []

beforeAll(async () => {
  await UserModel.deleteMany({})
  for (const user of helper.initialUsers) {
    const { username, name, password } = user
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const newUser = new UserModel({
      username: username,
      name: name,
      passwordHash,
    })
    await newUser.save()
    const result = await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    infoFromToken = [
      { token: result.body.token, username: result.body.username },
      ...infoFromToken,
    ]
  }
})

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

describe('POST authorized /api/blogs/', () => {
  test('successfully creates a new blog', async () => {
    const chosenInfo = infoFromToken[1]
    const loginUser = await UserModel.findOne({ username: chosenInfo.username })

    const newBlog = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map((blog) => blog.title)
    expect(titles).toContain(newBlog.title)

    const users = blogsAtEnd.map((blog) =>
      blog.user === undefined ? blog.user : blog.user.toString()
    )
    expect(users).toContain(newBlog.user.toString())
  })
  test('has 0 as default likes', async () => {
    const chosenInfo = infoFromToken[1]
    const loginUser = await UserModel.findOne({ username: chosenInfo.username })

    const newBlog = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      user: loginUser._id,
    }

    const res = await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)
    expect(res.body.likes).toBe(0)
  })

  test('has both title and url', async () => {
    const chosenInfo = infoFromToken[1]
    const loginUser = await UserModel.findOne({ username: chosenInfo.username })

    const urlMissingBlog = {
      author: 'Yoemi Park',
      title: 'In order to live',
      likes: 1000,
      user: loginUser._id,
    }

    await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(urlMissingBlog)
      .expect(400)

    const titleMissingBlog = {
      author: 'Yoemi Park',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(titleMissingBlog)
      .expect(400)
  })
})

describe('DELETE authorized /api/blogs/:id', () => {
  test('succeeds with status code 204 if id is valid and token matches', async () => {
    const chosenInfo = infoFromToken[1]
    const loginUser = await UserModel.findOne({ username: chosenInfo.username })

    const newBlog = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    const result = await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToDelete = result.body
    const blogsAtStart = await helper.blogsInDB()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

    const titles = blogsAtEnd.map((blog) => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status code 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingBlogId()
    const chosenInfo = infoFromToken[1]
    await api
      .delete(`/api/blogs/${validNonExistingId}`)
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .expect(404)
  })

  test('fails with status code 403 if token does not match, 401 if no token', async () => {
    const chosenInfo = infoFromToken[1]
    const notChosenInfo = infoFromToken[2]
    const invalidToken = 'NotAValidToken'
    const loginUser = await UserModel.findOne({ username: chosenInfo.username })

    const newBlog = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    const result = await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(newBlog) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToDelete = result.body
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', 'Bearer ' + notChosenInfo.token)
      .expect(403)
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', 'Bearer ' + invalidToken)
      .expect(403)

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401)
  })
})

describe('UPDATE authorized /api/blogs/:id', () => {
  test('succeeds with status code 200 if id is valid and token matches', async () => {
    const chosenInfo = infoFromToken[1]
    const notChosenInfo = infoFromToken[2]
    const invalidToken = 'NotAValidToken'

    const loginUser = await UserModel.findOne({ username: chosenInfo.username })
    const blogToPost = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    const result = await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(blogToPost) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToUpdate = result.body
    const newBlog = { ...blogToUpdate, title: blogToUpdate.title + ' part 2' }

    const blogsAtStart = await helper.blogsInDB()

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(newBlog)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    const titles = blogsAtEnd.map((blog) => blog.title)
    expect(titles).toContain(newBlog.title)
    expect(titles).not.toContain(blogToUpdate.title)

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + notChosenInfo.token)
      .send(newBlog)
      .expect(403)

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + invalidToken)
      .send(newBlog)
      .expect(403)

    await api.put(`/api/blogs/${blogToUpdate.id}`).send(newBlog).expect(401)
  })
  test('fails with status code 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingBlogId()
    const chosenInfo = infoFromToken[1]
    await api
      .put(`/api/blogs/${validNonExistingId}`)
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send({})
      .expect(404)
  })

  test('add 1 like to a blog requires a token but not necessarily matched', async () => {
    const chosenInfo = infoFromToken[1]
    const notChosenInfo = infoFromToken[2]

    const loginUser = await UserModel.findOne({ username: chosenInfo.username })
    const blogToPost = {
      author: 'Kim Yoemi',
      title: 'In order to live',
      url: 'http://urlOfTheBook.com',
      likes: 1000,
      user: loginUser._id,
    }

    const postResult = await api
      .post('/api/blogs/')
      .set('Authorization', 'Bearer ' + chosenInfo.token)
      .send(blogToPost) // receive JSON
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToUpdate = postResult.body
    const newBlog = { ...blogToUpdate, likes: blogToUpdate.likes + 1 }

    const blogsAtStart = await helper.blogsInDB()

    const putResult = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + notChosenInfo.token)
      .send(newBlog)
      .expect(200)

    const updatedBlog = putResult.body
    expect(updatedBlog.likes).toBe(blogToUpdate.likes + 1)
    const blogsAtEnd = await helper.blogsInDB()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
  })
})

afterAll(async () => await mongoose.connection.close())
