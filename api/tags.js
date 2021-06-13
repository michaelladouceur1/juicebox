const express = require('express')

const {getAllTags} = require('../db')

const tagsRouter = express.Router()

tagsRouter.use((req, res, next) => {
    console.log('A request is being made to /tags') 

    next()
})

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags()

    res.send({
        tags
    })
})

module.exports = tagsRouter