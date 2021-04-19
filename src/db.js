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
            this.rooms = this.db.collection('rooms');
        });
    }

    findUsers = async (users = null) => {
        const results = users ? await this.users.find(users).toArray() : await this.users.find().toArray();
        return results;
    }

    insertUser = async (user) => {
        await this.users.insertOne(user);
    }

    updateUser = async(email, update) => {
        await this.users.updateOne({email}, update);
    }

    insertMessage = async(message) => {
        await this.messages.insertOne(message);
    }

    getMessages = async(user) => {
        const response = await this.messages.find({$or: [{sender: user}, {receiver: user}]}).toArray();
        return response;
    }

    insertRoom = async(room) => {
        const result = await this.rooms.findOne({code: room.code});
        if(result)
            return -1;
        await this.rooms.insertOne(room);
        return 0;
    }

    findRooms = async() => {
        const result = await this.rooms.find().toArray();
        return result;
    }


}

module.exports = DB;