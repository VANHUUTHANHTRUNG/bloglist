const jwt = require('jsonwebtoken')
const UserModel = require('../models/user')
const logger = require('./logger')

const errorHandler = (error, res, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'atted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'invalid token',
    })
  } else if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'token expired',
    })
  }

  next(error)
}

const tokenExtractor = async (req, _res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer '))
    req.token = authorization.substring(7)
  next()
}

const userExtractor = async (req, res, next) => {
  if (!req.token) return res.status(401).json({ error: 'token missing' })
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    if (!decodedToken.id)
      return res.status(401).json({ error: 'token not verified' })
    req.user = await UserModel.findById(decodedToken.id).select('-passwordHash')
  } catch {
    return res.status(403).json({ error: 'token invalid' })
  }
  next()
}

module.exports = {
  errorHandler,
  tokenExtractor,
  userExtractor,
}
