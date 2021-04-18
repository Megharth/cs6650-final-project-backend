const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = new express();
app.use(bodyParser.json());
app.use(cors());

const salt = 10;

let users;
let db;

const serverInit = async(port, userInstance) => {
    const client = new MongoClient(process.env.DB_URL);
    client.connect(() => { 
        console.log('connected to DB'); 
        db = client.db('cs6650');
        users = db.collection('users');
    });

    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });
    
    app.post('/login', async (req, res) => {
        const {email, password} = req.body;
        const [user] = await users.find({email}).toArray();
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
        const [user] = await users.find({email}).toArray();
        if(user) {
            res.json({message: `User with email ${email} already registered`, status: 403});
        } else {
            users.insertOne({email, password: hash, name: null});
            res.json({message: `Registered new user ${email}`, status: 200});
        }
    });

    app.get('/users', async(req, res) => {
        const onlineUsers = new Set(userInstance.getUsers());
        const result = await users.find().toArray();
        const processedData = result.map(user => ({
            ...user,
            online: onlineUsers.has(user.email)
        }));
        res.json({users: processedData});
    });

    app.get('/user/:email', async (req, res) => {
        const {email} = req.params;
        const [user] = await users.find({email}).toArray(); 
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
        const [user] = await users.find({email}).toArray(); 
        if(user) {
            await users.updateOne({email}, {$set: {name}});
            res.json({message: `Successfully updated the name`, status: 200});
        } else {
            res.json({message: `could not find user with ${email}`, status: 404});
        }
    });
}

module.exports = {serverInit};
