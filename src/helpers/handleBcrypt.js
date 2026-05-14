require('dotenv').config();
const bcrypt = require('bcrypt');

const salt_rounds = parseInt(process.env.SALT_ROUNDS);
const salt = bcrypt.genSaltSync(salt_rounds);

const encrypt = async (password) => {
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

const compare = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}

module.exports = {encrypt, compare}