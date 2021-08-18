const express = require('express')
const jwt = require('jsonwebtoken')

const {getAllUsers, getUserByUsername} = require('../db')
const {JWT_SECRET} = process.env

const usersRouter = express.Router()

usersRouter.use((req, res, next) => {
    console.log('A request is being made to /users')

    next()
})

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers()

    res.send({
        users
    })
})

usersRouter.post('/login', async (req, res, next) => {
    const {username, password} = req.body

    if(!username || !password) {
        next({
            name: 'MissingCredentialsError',
            message: 'Please supply both a username and password'
        })
    }

    try {
        const user = await getUserByUsername(username)

        if(user && user.password == password) {
            console.log(user)
            const token = jwt.sign({id: user.id}, JWT_SECRET)
            res.send(token)
        } else {
            next({
                name: 'IncorrectCredentialsError',
                message: 'Username or password is incorrect'
            })
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
})

module.exports = usersRouter