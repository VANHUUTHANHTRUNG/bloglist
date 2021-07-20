const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const BlogModel = require('../models/blog')
const UserModel = require('../models/user')
const helper = require('../tests/test_helper')

const api = supertest(app) // mongoose connection was moved to app.js
const saltRounds = 10

beforeEach(async () => {
  await BlogModel.deleteMany({})
  await BlogModel.insertMany(helper.initialBlogs)

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
  }
})

describe('Logins - generates token', () => {
  test(' with a user from initial users', async () => {
    const loginUser = helper.initialUsers[0]
    const result = await api
      .post('/api/login')
      .send(loginUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })
})

afterAll(async () => mongoose.connection.close())
