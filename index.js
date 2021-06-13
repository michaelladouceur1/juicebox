// SERVER
const PORT = 3000;
const express = require('express');
const server = express();

const bodyParser = express.json()
server.use(bodyParser)

const morgan = require('morgan')
server.use(morgan('dev'))

const apiRouter = require('./api')
server.use('/api', apiRouter)

server.use((req, res, next) => {
    console.log('-----BODY LOGGER START-----')
    console.log(req.body)
    console.log('------BODY LOGGER END------')

    next()
})










const {client} = require('./db')
client.connect()

server.listen(PORT, () => {
  console.log('The server is up on port', PORT)
});