const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')

const blogRouter = require('./controllers/blog')
const logger = require('./utils/logger')
const config = require('./utils/config')

const app = express()
const url = config.MONGODB_URI

logger.info(`Connecting to ${url}`)

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))
app.use('/api/blogs', blogRouter)

module.exports = app
