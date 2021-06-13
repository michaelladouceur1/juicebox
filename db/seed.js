const {client, getAllUsers, createUser, updateUser, createPost, getUserById, getAllPosts, createTags, addTagsToPost} = require('./index')
const chalk = require('chalk')

async function testDB() {
    try {
        let rows = await getAllUsers()
        console.log(chalk.blue('getAllUsers Response: '), rows)
        let update = await updateUser(2, {username: 'lauren', password: 'who-knows'})
        console.log(chalk.blue('updateUser Response: ', update.id, update.username))
        let allPosts = await getAllPosts()
        console.log(chalk.blue('getAllPosts Response: '), allPosts)
        let userPost = await getUserById(2)
        console.log(chalk.blue('getUserById Response: '), userPost)
    } catch (error) {
        console.error(error)
    }
}

async function dropTables() {
    try {
        await client.query(`
            DROP TABLE IF EXISTS post_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS posts;
            DROP TABLE IF EXISTS users;
        `)
    } catch (error) {
        throw error
    }
}

async function createTables() {
    try {
        console.log(chalk.magenta('\tCreating users table...\n'))
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username varchar(255) UNIQUE NOT NULL,
                password varchar(255) NOT NULL,
                name varchar(255) NOT NULL,
                location varchar(255) NOT NULL,
                active BOOLEAN DEFAULT true
            );
        `)

        console.log(chalk.magenta('\tCreating posts table...\n'))
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                "authorId" INTEGER REFERENCES users(id) NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                active BOOLEAN DEFAULT true
            )
        `)

        console.log(chalk.magenta('\tCreating tags table...\n'))
        await client.query(`
            CREATE TABLE tags (
                id SERIAL PRIMARY KEY,
                name varchar(255) UNIQUE NOT NULL
            )
        `)

        console.log(chalk.magenta('\tCreating post_tags table...\n'))
        await client.query(`
            CREATE TABLE post_tags (
                "postId" INTEGER REFERENCES posts(id),
                "tagId" INTEGER REFERENCES tags(id),
                CONSTRAINT id UNIQUE ("postId", "tagId")
            )
        `)
    } catch (error) {
        console.error(error)
    }
}

async function populateUserDB() {
    try {
        let users = [
            {username: 'michael', password: 'testpass', name: 'michael', location: 'Downers Grove'},
            {username: 'travis', password: '123456', name: 'travis', location: 'Cali'},
            {username: 'cameron', password: 'fuboi', name: 'cameron', location: 'Georgia'},
            {username: 'rachel', password: 'not-a-password', name: 'rachel', location: 'NYC'},
        ]
        await Promise.all(
            users.map((user) => {
                return createUser(user)
        }))
    } catch (error) {
        console.error(error)
    }
}

async function populatePostDB() {
    try {
        const [michael, lauren, cameron, rachel] = await getAllUsers();
        let posts = [
            {authorId: lauren.id, title: 'Hello There', content: 'This is something that Obi says'},
            {authorId: michael.id, title: 'Bye There', content: 'This is something that Obi says'},
            {authorId: rachel.id, title: 'Aloha', content: 'This is something that Obi says'},
        ]
        await Promise.all(
            posts.map((post) => {
                return createPost(post)
            })
        )
    } catch (error) {
        throw error
    }
}

async function populateTagDB() {
    try {
        const [veggies, healthy, snack, dessert] = await createTags(['#veggies', '#healthy', '#snack', '#dessert'])
        
        const [post1, post2, post3] = await getAllPosts()

        await addTagsToPost(post1.id, [veggies, snack])
        await addTagsToPost(post2.id, [healthy, snack, veggies])
        await addTagsToPost(post3.id, [dessert, healthy])
    } catch (error) {
        throw error
    }
}

async function rebuildDB() {
    try {
        console.log(chalk.yellow('Connecting to DB...\n'))
        client.connect()
        console.log(chalk.yellow('Dropping tables...\n'))
        await dropTables()
        console.log(chalk.yellow('Creating tables...\n'))
        await createTables()
        console.log(chalk.yellow('Tables created successfully...\n'))
        console.log(chalk.yellow('Populating User DB...\n'))
        await populateUserDB()
        console.log(chalk.yellow('User DB populated...\n'))
        console.log(chalk.yellow('Populating Post DB...\n'))
        await populatePostDB()
        console.log(chalk.yellow('Post DB populated...\n'))
        console.log(chalk.yellow('Populating Tag DB...\n'))
        await populateTagDB()
        console.log(chalk.yellow('Tag DB populated...\n'))
        await testDB()
    } catch (error) {
        console.error(error)
    } finally {
        console.log(chalk.red('\nClosing connection...\n'))
        client.end()
    }
}

rebuildDB()