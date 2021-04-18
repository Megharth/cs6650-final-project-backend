class User {
    constructor() {
        this.users = new Set();
    }

    addUser = (user) => {
        this.users.add(user);
    }

    removeUser = (user) => {
        this.users.delete(user);
    }

    getUsers = () => {
        return Array.from(this.users);
    }
}

module.exports = User;