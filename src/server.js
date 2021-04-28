const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

require('dotenv').config();

const app = new express();
app.use(bodyParser.json());
app.use(cors());

const salt = 10;

const serverInit = async(port, userInstance, db, peers, ts) => {
    let promiseVal = -1;

    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });
    
    app.post('/handshake', (req, res) => {
        const {port} = req.body;
        const url = `http://localhost:${port}`;
        console.log(`handhsake successfull with peer ${url}`);
        ts.options.peers = [...ts.options.peers, url];
        res.json({message: 'success', status:200});
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
        // console.log(userInstance.getUsers());
        const onlineUsers = new Set(await userInstance.getUsers());
        const users = await db.findUsers();
        const rooms = await db.findRooms();

        const userData = users.map(({email, name, room}) => ({
            email,
            name,
            room,
            online: onlineUsers.has(email)
        }));

        const roomData = rooms.map(room => ({
            ...room,
            online: false
        }));

        res.json({users: [...userData, ...roomData]});
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
        const [user] = await db.findUsers(email);
        if(user) {
            await db.updateUser(email, {$set: {name}});
            res.json({message: `Successfully updated the name`, status: 200});
        } else {
            res.json({message: `could not find user with ${email}`, status: 404});
        }
    });

    app.get('/chats/:email', async(req, res) => {
        const {email} = req.params;
        const [user] = await db.findUsers({email});

        if(user.chats) {
            const onlineUsers = new Set(await userInstance.getUsers());
            const chatList = user.chats.map(user => ({...user, online: onlineUsers.has(user.email)}));
            const rooms = user.chats.filter(chat => chat.room).map(room => room.email);
            const messages = await db.getMessages(email, rooms);

            res.json({chatList, messages, status: 200});
        } else {
            res.json({chatList: [], messages: [], status: 200});
        }
    });

    app.post('/createRoom', async(req, res) => {
        const {email, name, user} = req.body;
        
        await db.insertRoom({email, name, room: true});

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
    });

    app.post('/addRoom', async(req, res) => {
        const {room, email} = req.body;
        const [user] = await db.findUsers({email});
        if(user.chats) {
            const {chats} = user;
            chats.push(room);
            await db.updateUser(email, {$set: {chats}});

        } else {
            const chats = [room];
            await db.updateUser(email, {$set: {chats}}, {$upsert: true});
        }

        const messages = await db.getMessages(room.email, [room.email]);

        res.json({message: 'success', messages, status: 200});
    });

    // app.post('/propose', (req, res) => {
    //     const {pid, port} = req.body;
    //     if(parseInt(pid) > promiseVal) {
    //         promiseVal = pid;
    //         console.log(`preparing for the pid ${pid} from ${port}`);            
    //         res.json({message: 'prepare', status: 200});
    //     } else {
    //         console.log(`cannot promise for ${pid} as already promised for ${promiseVal}`);
    //     }   
    // });

    // app.post('/accept', (req, res) => {
    //     const {pid, port} = req.body;
    //     if(parseInt(pid) === promiseVal) {
    //         console.log(`Accepting for the pid ${pid} from ${port}`);            
    //         res.json({message: 'accept', data: logs.getLastLog(), status: 200});
    //     } else {
    //         console.log(`cannot accept for ${pid} as already promised for ${promiseVal}`);
    //     }   
    // });

    // app.post('/learn', (req, res) => {
    //     const {pid, data, port} = req.body;
    //     if(parseInt(pid) === promiseVal) {
    //         console.log(`learning from ${port}`, data);
    //         res.json({message: 'success', status:200});
    //     } else {
    //         console.log(`cannot learn for ${pid} as already promised for ${promiseVal}`);
    //     }
    // });

    peers.forEach(peer => {
        fetch(peer + '/handshake', {
            method: 'POST',
            body: JSON.stringify({port}),
            headers: {
                'Content-Type': 'Application/json'
            }
        });
    })
}

module.exports = {serverInit};
