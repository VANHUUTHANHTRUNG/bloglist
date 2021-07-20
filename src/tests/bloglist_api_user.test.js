const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const BlogModel = require('../models/blog')
const UserModel = require('../models/user')
const helper = require('../tests/test_helper')

const api = supertest(app)
const saltRounds = 10

beforeEach(async () => {
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

describe('POST /api/users/', () => {
  test('succeeds with fresh username', async () => {
    const usersAtStart = await helper.usersInDB()

    const newUser = {
      username: 'random username',
      name: 'random name',
      password: 'random password',
    }
    await api
      .post('/api/users/')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((user) => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('fails (status code + message) if username already taken', async () => {
    const usersAtStart = await helper.usersInDB()

    const newUser = {
      username: 'root',
      name: 'random name',
      password: 'random password',
    }

    const result = await api
      .post('/api/users/')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(result.body.message).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('fails (status code + message) if username/password is too short', async () => {
    const usersAtStart = await helper.usersInDB()
    const shortNameUser = {
      username: 'aa',
      name: 'random name',
      password: 'random password',
    }
    const resultShortName = await api
      .post('/api/users/')
      .send(shortNameUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(resultShortName.body.message).toContain(
      'is shorter than the minimum allowed length'
    )

    const shortPasswordUser = {
      username: 'random username',
      name: 'random name',
      password: 'ra',
    }
    const resultShortPassword = await api
      .post('/api/users/')
      .send(shortPasswordUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(resultShortPassword.body.message).toContain(
      'is shorter than the minimum allowed length'
    )

    const usersAtEnd = await helper.usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(async () => await mongoose.connection.close())
