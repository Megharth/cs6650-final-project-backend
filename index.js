const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = new express();
app.use(bodyParser.json());
app.use(cors());

const port = 8000;

let users;
let db;

const init = async() => {
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
            if(user.password === password)
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
        const [user] = await users.find({email}).toArray();
        if(user) {
            res.json({message: `User with email ${email} already registered`, status: 403});
        } else {
            users.insertOne({email, password});
            res.json({message: `Registered new user ${email}`, status: 200});
        }
    });
}

init();
