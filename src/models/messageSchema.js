const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderName: {
        type: String,
        minLength: [2, "Sender name must be at least 2 characters long"],
    },
    subject: {
        type: String,
        minLength: [2, "Subject must be at least 2 characters long"],
    },
    message: {
        type: String,

        minLength: [2, "Message must be at least 2 characters long"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message; // Export the model for use in other files