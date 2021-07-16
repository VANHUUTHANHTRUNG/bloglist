const mongoose = require('mongoose')
const BlogModel = require('./src/models/blog')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()

const jsonDir = __dirname + '/blogs.json'
const initialBlogs = JSON.parse(fs.readFileSync(jsonDir, 'utf-8'))

async function loadBlogs() {
  try {
    await BlogModel.insertMany(initialBlogs)
    console.log('Done inserting')
  } catch (error) {
    console.log(error)
  }

  mongoose.connection.close()
  process.exit()
}

loadBlogs()
