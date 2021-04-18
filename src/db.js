const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

class DB {
    constructor() {
        this.client = new MongoClient(process.env.DB_URL, {useUnifiedTopology: true});
        this.client.connect(() => { 
            console.log('connected to DB'); 
            this.db = this.client.db('cs6650');
            this.users = this.db.collection('users');
            this.messages = this.db.collection('messages');
        });
    }

    findUsers = async (email = null) => {
        const results = email ? await this.users.find({email}).toArray() : await this.users.find().toArray();
        return results;
    }

    insertUser = async (user) => {
        await this.users.insertOne(user);
    }

    updateUser = async(user) => {
        await this.users.updateOne(user);
    }

    insertMessage = async(message) => {
        await this.messages.insertOne(message);
    }

    getMessages = async(user) => {
        const response = await this.messages.find({$or: [{sender: user}, {receiver: user}]}).toArray();
        return response;
    }

}

module.exports = DB;