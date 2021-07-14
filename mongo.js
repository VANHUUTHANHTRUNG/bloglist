const mongoose = require('mongoose')
const BlogModel = require('./src/models/blog')
const fs = require('fs')
const jsonDir = __dirname + '/blogs.json'
const initialBlogs = JSON.parse(fs.readFileSync(jsonDir, 'utf-8'))

if (process.argv.length < 3) {
  console.log(
    'Please provide the password as an argument: node mongo.js <password>'
  )
  process.exit(1)
}

const password = process.argv[2]
const url = `mongodb+srv://fullstack:${password}@cluster0.j4ecd.mongodb.net/bloglist?retryWrites=true&w=majority`

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

async function loadBlogs() {
  try {
    await BlogModel.insertMany(initialBlogs)
    console.log('Done inserting')
    process.exit()
  } catch (error) {
    console.log(error)
    process.exit()
  }
}

loadBlogs()
