class RedisUserStore {
    constructor(redisClient) {
        this.redisClient = redisClient;
        // this.users = new Set();
    }

    addUser = (user) => {
        this.redisClient.multi()
            .hset('users', user, 'connected')
            .exec();
        // this.users.add(user);
    }

    removeUser = (user) => {
        this.redisClient.multi()
            .hdel('users', user)
        // this.users.delete(user);
    }

    getUsers = async () => {
        // return Array.from(this.users);
        const users = await this.redisClient.hgetall('users');
        return Object.keys(users);
    }
}

module.exports = RedisUserStore;