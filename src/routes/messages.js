const express = require("express");
const cookieParser = require("cookie-parser");
const Message = require("../models/messageSchema"); // Import the Message model
const { userAuth } = require("../middlewares/auth"); // Import the userAuth middleware

const messageRouter = express.Router();

messageRouter.use(express.json());
messageRouter.use(cookieParser());

messageRouter.post('/send', async (req, res) => {
    try {
        console.log(req.body); // Debug log to check the request body

        const { senderName, subject, message } = req.body;

        // Validate input fields
        if (!senderName || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        // Create and save the new message
        const newMessage = new Message({
            senderName: senderName.trim(),
            subject: subject.trim(),
            message: message.trim(),
        });
        await newMessage.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            success: false,
            message: "Error saving the message: " + error.message,
        });
    }
});


messageRouter.get('/getAllMessages',userAuth, async (req, res) => {

    try {
        const messages = await Message.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            messages: messages,
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching messages: " + error.message,
        });
    }
})

messageRouter.delete('/deleteMessage/:id', userAuth,async (req, res) => {
    try {
        const { id } = req.params;

        // Find the message by ID
        const foundMessage = await Message.findById(id);

        if (!foundMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Delete the message
        await foundMessage.deleteOne();
        res.status(200).json({
            success: true,
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting message: " + error.message,
        });
    }
});

module.exports = messageRouter;