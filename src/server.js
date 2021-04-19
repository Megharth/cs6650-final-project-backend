const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = new express();
app.use(bodyParser.json());
app.use(cors());

const salt = 10;

const serverInit = async(port, userInstance, db) => {
    

    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });
    
    app.post('/login', async (req, res) => {
        const {email, password} = req.body;
        const [user] = await db.findUsers({email});
        if(user) {
            const match = await bcrypt.compare(password, user.password);
            if(match)
                res.json({message: `Success`, status: 200});
            else
                res.json({message: 'Invalid credentials', status: 401});
        } else {
            res.json({
                message: `Cannot find user with email ${email}. Please register to use the services`, 
                status: 404
            });
        }
    });
    
    app.post('/register', async (req, res) => {
        const {email, password} = req.body;
        const hash = await bcrypt.hash(password, salt);
        const [user] = await db.findUsers({email});
        if(user) {
            res.json({message: `User with email ${email} already registered`, status: 403});
        } else {
            await db.insertUser({email, password: hash, name: null})
            res.json({message: `Registered new user ${email}`, status: 200});
        }
    });

    app.get('/users', async(req, res) => {
        const onlineUsers = new Set(userInstance.getUsers());
        const result = await db.findUsers();
        const processedData = result.map(user => ({
            ...user,
            online: onlineUsers.has(user.email)
        }));
        res.json({users: processedData});
    });

    app.get('/user/:email', async (req, res) => {
        const {email} = req.params;
        const [user] = await db.findUsers({email});
        if(user) {
            if(user.name) {
                res.json({name: user.name, message: 'Success', status: 200});
            } else {
                res.json({name: null, message: 'Success', status: 200});
            }
        } else 
            res.json({message: `could not find user with ${email}`, status: 404});      
    });

    app.post('/updateName', async (req, res) => {
        const {email, name} = req.body;
        const [user] = await db.findUser(email);
        if(user) {
            await db.updateUser(email, {$set: {name}});
            res.json({message: `Successfully updated the name`, status: 200});
        } else {
            res.json({message: `could not find user with ${email}`, status: 404});
        }
    });

    app.get('/chats/:email', async(req, res) => {
        const {email} = req.params;
        const messages = await db.getMessages(email);
        const [user] = await db.findUsers({email});

        const onlineUsers = new Set(userInstance.getUsers());
        const chatList = user.chats.map(user => ({...user, online: onlineUsers.has(user.email)}));

        res.json({chatList, messages, status: 200});
    });

    app.post('/createRoom', async(req, res) => {
        const {email, name, user} = req.body;
        // const response = await db.insertRoom({email, name});
        // if(response === 0){
            
        // }
        // else
        //     res.json({message: 'Please try again', status: 500});

        const [userObj] = await db.findUsers({email: user});
        if(userObj["chats"])
            userObj["chats"].push({name, email, room: true});
        else
            userObj["chats"] = [{name, email, room: true}];

        await db.updateUser(user, {$set: {chats: userObj.chats}}, {$upsert: true});
        
        res.json({message: 'success', status: 200});
    });

    app.post('/addToChat', async(req, res) => {
        const {sender, receiver} = req.body;
        const [user1, user2] = await db.findUsers({email: {$in: [sender, receiver]}});

        if(user1["chats"])
            user1["chats"].push({name: user2.name, email: user2.email, room: user2.room});
        else
            user1["chats"] = [{name: user2.name, email: user2.email, room: user2.room}];
        
        if(user2["chats"])
            user2["chats"].push({name: user1.name, email: user1.email, room: user1.room});
        else
            user2["chats"] = [{name: user1.name, email: user1.email, room: user1.room}];

        await db.updateUser(sender, {$set: {chats: user1.chats}}, {$upsert: true});
        await db.updateUser(receiver, {$set: {chats: user2.chats}}, {$upsert: true});

        res.json({message: 'success', status: 200});
    })
}

module.exports = {serverInit};
