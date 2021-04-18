const fetch = require('node-fetch')
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');

require('dotenv').config();

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

const init = async () => {
    let collection;
    let db;
    const client = new MongoClient(process.env.DB_URL, {useUnifiedTopology: true});
    await client.connect();
    console.log('connected to DB'); 
    db = client.db('cs6650');
    collection = db.collection('users');

    const result = await fetch('https://randomuser.me/api/?page=1&results=100&seed=abc');
    const data = await result.json();
    const users = data.results.map(user => ({
        name: `${user.name.first} ${user.name.last}`,
        email: user.email,
        password: user.login.password
    }));

    const dbUsers = [];
    await asyncForEach(data.results, async (user) => {
        const hash = await bcrypt.hash(user.login.password, 10);
        dbUsers.push({
            name: `${user.name.first} ${user.name.last}`,
            email: user.email,
            password: hash
        });
    })

    fs.writeFileSync('users.json', JSON.stringify(users));
    await collection.insertMany(dbUsers);

    client.close();
}

init();