const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI)
    } catch(error) {
        console.error('Failed to connect to Mongoose/MongoDB: ', error);
        process.exit(1);
    }
};

module.exports = connectDB;
