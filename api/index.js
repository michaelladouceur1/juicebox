const express = require('express')
const apiRouter = express.Router()

const jwt = require('jsonwebtoken')
const {getUserById} = require('../db')
const {JWT_SECRET} = process.env

apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer '
    const auth = req.headers['Authorization'];

    if (!auth) {
        next(); // don't set req.user, no token was passed in
    } else if (auth.startsWith(prefix)) {
        // recover the token
        const token = auth.slice(prefix.length);
        try {
            // recover the data
            const { id } = jwt.verify(data, JWT_SECRET);

            if(id) {
                req.user = await getUserById(id)
                next()
            }
        } catch ({name, message}) {
            // there are a few types of errors here
            next({name, message})
        }
    } else {
        next({
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${prefix}`
        })
    }
})

apiRouter.use((req, res, next) => {
    if(req.user) {
        console.log('User is set: ', req.user)
    }
    next()
})

const usersRouter = require('./users')
const postsRouter = require('./posts')
const tagsRouter = require('./tags')

apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/tags', tagsRouter)

apiRouter.use((error, req, res, next) => {
    res.send(error)
})

module.exports = apiRouter