const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

class DB {
    constructor() {
        this.client = new MongoClient(process.env.DB_URL, {useUnifiedTopology: true});
        this.client.connect(() => { 
            console.log('connected to DB'); 
            this.db = this.client.db('cs6650');
            this.users = this.db.collection('users');
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

}

module.exports = DB;