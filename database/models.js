const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReplySchema = new Schema({
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now }
});

const ThreadSchema = new Schema({
    board: { type: String, required: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    replies: { type: [ReplySchema], default: [] },
    replycount: { type: Number, default: 0 }
});

const Reply = mongoose.model('Reply', ReplySchema);
const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = { Thread, Reply };