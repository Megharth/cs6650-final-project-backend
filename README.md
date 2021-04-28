## Instructions for testing

https://docs.google.com/document/d/1MKWj9ST-vIQMSCrEq82BOAPZ__wjefZb0AVgSfJ429c/edit

# Setting up the backend

## Packages

    npm install

## MongoDB and .env file
We use mongoDB for persistent data storage. The database stores data on users,
chat rooms, and messages.

To setup MongoDB, create an account and download.

Create a .env file in the project directory with the following:

    DB_URL=mongodb+srv://admin:admin@cluster0.bxmbg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

We have already prepopulated the database with the users. You can use email and password in the users.json file to login as that user.
If you choose to register a new user instead, then first set the name of the user from the accounts menu on bottom-left corner and then
start chatting!

## Redis
We use redis for replicated data management.

You must have a Linux machine (for windows, you can use a Windows Linux Subsystem).

Start the Linux machine and run the following:

    sudo apt-get redis-server

Make sure the installation was successful. You should see "redis-cli version-number".

    redis-cli -v

Restart the server to ensure everything is working smoothly.

    sudo service redis-server restart

## Running the backend

    npm run cluster

5 terminals, each running a server instance, should start up.
