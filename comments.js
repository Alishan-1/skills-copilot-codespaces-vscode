// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Create data structure to hold comments
const commentsByPostId = {};

// Create endpoint to handle post requests
app.post('/posts/:id/comments', async (req, res) => {
    // Get the id from the url
    const postId = req.params.id;

    // Get the comments from the request body
    const { content } = req.body;

    // Get the comments for the post id
    const comments = commentsByPostId[postId] || [];

    // Create new comment
    const comment = {
        id: Math.random().toString(36).substr(2, 7),
        content,
        status: 'pending'
    };

    // Add new comment to comments array
    comments.push(comment);

    // Update comments for the post id
    commentsByPostId[postId] = comments;

    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentCreated',
        data: {
            ...comment,
            postId
        }
    });

    // Send response
    res.status(201).send(comments);
});

// Create endpoint to handle get requests
app.get('/posts/:id/comments', (req, res) => {
    // Get the id from the url
    const postId = req.params.id;

    // Get the comments for the post id
    const comments = commentsByPostId[postId] || [];

    // Send response
    res.send(comments);
});

// Create endpoint to handle post requests
app.post('/events', async (req, res) => {
    // Get the event from the request body
    const { type, data } = req.body;

    // Check if event type is equal to comment moderated
    if (type === 'CommentModerated') {
        // Get the comment for the post id
        const { postId, id, status, content } = data;

        // Get the comments for the post id
        const comments = commentsByPostId[postId];

        // Get comment by id
        const comment = comments.find(comment => {
            return comment.id === id;
        });

        // Update comment status
        comment.status = status;

        // Send event to event bus
        await
