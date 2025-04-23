const express = require('express');
const router = express.Router();

const {userAuth} = require('../middlewares/auth')
const TimeLine = require('../models/timeLineSchema.js');


const timeLineRouter = express.Router();
const cookieParser = require('cookie-parser');


timeLineRouter.use(express.json());
timeLineRouter.use(cookieParser());



timeLineRouter.post('/create', userAuth, async (req, res) => {

    const { title, description, from, to } = req.body;
    try {
        if (!title || !description || !from || !to) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        const newTimeLine = await new TimeLine({
            title,
            description,
            timeLine: {
                from,
                to
            }
        });

        await newTimeLine.save();

        res.status(201).json({
            success: true,
            message: "TimeLine created successfully",
        });
    } catch (error) {
        console.error("Error creating TimeLine:", error);
        res.status(500).json({
            success: false,
            message: "Error creating TimeLine: " + error.message,
        });
    }
})

timeLineRouter.get('/getAllTimeLines', userAuth, async (req, res) => {
    try {
        const timeLines = await TimeLine.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            timeLines: timeLines,
        });
    } catch (error) {
        console.error("Error fetching TimeLines:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching TimeLines: " + error.message,
        });
    }
})

timeLineRouter.delete('/delete/:id', userAuth, async (req, res) => {

    try {
        const { id } = req.params;
        const timeLine = await TimeLine.findByIdAndDelete(id);
        if (!timeLine) {
            return res.status(404).json({
                success: false,
                message: "TimeLine not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "TimeLine deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting TimeLine:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting TimeLine: " + error.message,
        });
    }
})

module.exports = timeLineRouter;