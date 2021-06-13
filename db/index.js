// DATABASE
const {Client} = require('pg')
const {user, pass} = require('../private')

// Add connection string to client
const client = new Client(`postgres://${user}:${pass}@localhost:5432/juicebox-dev`)


// USERS

async function getAllUsers() {
    const {rows} = await client.query(`
        SELECT id, username, name, location, active
        FROM users;
    `)
    return rows
}

async function getUserById(userId) {
    try {
        const {rows: [user]} = await client.query(`
            SELECT id, username, name, location, active
            FROM users
            WHERE id=${userId};
        `)
        console.log('------------',user)
        user['posts'] = await getPostsByUser(user.id)
        return user
    } catch (error) {
        throw error
    }
}

async function createUser({
    username, 
    password, 
    name, 
    location
}) {
    try {
        const {rows} = await client.query(`
            INSERT INTO users (username, password, name, location)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [username, password, name, location])
        return rows
    } catch (error) {
        throw error
    }
}

async function updateUser(id, fields={}) {
    const setString = Object.keys(fields).map((key,idx) => {
        return `"${key}"=$${idx+2}`
    }).join(', ')

    if(setString.length === 0) {
        return;
    }

    try {
        const {rows} = await client.query(`
            UPDATE users 
            SET ${setString}
            WHERE id = $1
            RETURNING *;
        `, [id, ...Object.values(fields)])
        return rows[0]
    } catch (error) {
        throw error
    }
}

// POSTS 

async function createPost({
    authorId, 
    title, 
    content
}) {
    try {
        const {rows} = await client.query(`
            INSERT INTO posts ("authorId", title, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [authorId, title, content])
        return rows
    } catch (error) {
        throw error
    }
}

// async function updatePost(id, {title, content, active}) {
//     try {
//         const {rows} = await client.query(`
//             UPDATE posts
//             SET "title"=$1, "content"=$2, "active"=$3
//             WHERE id = $4
//             RETURNING *;
//         `, [title, content, active, id])
//         return rows
//     } catch (error) {
//         throw error
//     }
// }

async function updatePost(postId, fields = {}) {
    const {tags} = fields 
    delete fields.tags

    const setString = Object.keys(fields).map((key, index) => {
        return `"${key}"=$${index+1}`
    }).join(', ')

    try {
        if(setString.length > 0) {
            await client.query(`
                UPDATE posts
                SET ${setString}
                WHERE id=${postId}
                RETURNING *;
            `, Object.values(fields))
        }

        if(tags === undefined) {
            return await getPostById(postId)
        }

        const tagList = await createTags(tags)
        const tagListIdString = tagList.map((tag) => {
            `${tag.id}`
        }).join(', ')

        await client.query(`
            DELETE FROM post_tags
            WHERE "tagId"
            NOT IN (${tagListIdString})
            AND "postId"=$1
        `, [postId])

        await addTagsToPost(postId, tagList)
        return await getPostById(postId)
        
    } catch (error) {
        throw error
    }
}

/** 
 * [ {id: integer, "authorId": integer, title: string, content: string, active: boolean}, ... ]
 */
async function getAllPosts() {
    try {
        const {rows} = await client.query(`
            SELECT * 
            FROM posts;
        `)
        return rows
    } catch (error) {
        throw error
    }
}

async function getPostById(postId) {
    try {
        const {rows: [post]} = await client.query(`
            SELECT *
            FROM posts
            WHERE id=$1
        `, [postId])
        
        const {rows: tags} = await client.query(`
            SELECT tags.*
            FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1
        `, [postId])

        const {rows: [author]} = await client.query(`
            SELECT id, username, name, location
            FROM users
            WHERE id=$1
        `, [post.authorId])

        post.tags = tags
        post.author = author

        delete post.authorId

        return post
    } catch (error) {
        throw error
    }
}

async function getPostsByUser(userId) {
    try {
        const {rows} = await client.query(`
            SELECT * 
            FROM posts
            WHERE "authorId"=${userId};
        `)
        return rows
    } catch (error) {
        throw error
    }
}

async function getPostByTagName(tagName) {
    try{
        const {rows: postIds} = await client.query(`
            SELECT posts.id
            FROM posts
            JOIN post_tags ON posts.id=post_tags."postId"
            JOIN tags ON post_tags."tagId"=tags.id
            WHERE tags.name=$1
        `, [tagName])

        return await Promise.all(postIds.map((post) => {
            getPostById(post.id)
        }))
    } catch (error) {
        throw error
    }
}

// TAGS

async function createTags(tags=[]) {
    if(tags.length === 0) {
        return;
    }

    let valString = tags.map((_,idx) => {
        return `($${idx+1})`
    }).join(', ')

    try {
        const {rows} = await client.query(`
            INSERT INTO tags(name)
            VALUES ${valString}
            ON CONFLICT (name) DO NOTHING
            RETURNING *;
        `, tags)
        return rows
    } catch (error) {
        throw error
    }
}

/** 
 * [ {id: integer, name: string}, ... ]
 */
async function getAllTags() {
    try {
        const {rows} = await client.query(`
            SELECT * 
            FROM tags;
        `)
        return rows
    } catch (error) {
        throw error
    }
}

// POST TAGS

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
            INSERT INTO post_tags("postId", "tagId")
            VALUES ($1, $2)
            ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId])
    } catch (error) {
        throw error
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(async (tag) => {
            return createPostTag(postId, tag.id)
        })
        await Promise.all(createPostTagPromises)
        return await getPostById(postId)
    } catch (error) {
        throw error
    }
}

module.exports = {
    client, 
    getAllUsers, 
    getUserById,
    createUser, 
    updateUser, 
    createPost, 
    updatePost, 
    getAllPosts, 
    getPostsByUser,
    createTags,
    getAllTags,
    createPostTag,
    addTagsToPost
}