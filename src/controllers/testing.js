const router = require('express').Router()

const BlogModel = require('../models/blog')
const UserModel = require('../models/user')

router.post('/reset', async (_req, res) => {
  console.log('deleting')
  await BlogModel.deleteMany({})
  await UserModel.deleteMany({})
  res.status(204).end()
})

module.exports = router
