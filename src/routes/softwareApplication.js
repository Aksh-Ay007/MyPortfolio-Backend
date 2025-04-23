const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');


const{userAuth}=require('../middlewares/auth')
const SoftwareApplication = require('../models/softwareApplicationSchema.js');
const SoftwareApplicationRouter = express.Router();
const cookieParser = require('cookie-parser');

SoftwareApplicationRouter.use(express.json());
SoftwareApplicationRouter.use(cookieParser());


SoftwareApplicationRouter.post('/addSoftwareApplication', userAuth, async (req, res) => {
    try {
        // Check if files and name are provided
        if (!req.files || !req.files.svg) {
            return res.status(400).json({
                success: false,
                message: "SVG file is required",
            });
        }

        const { svg } = req.files;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        // Upload SVG to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(svg.tempFilePath, {
            folder: "PORTFOLIO_SOFTWARE_APPLICATION",
        });

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            throw new Error("Failed to upload SVG to Cloudinary");
        }

        // Create a new software application document
        const softwareApplication = new SoftwareApplication({
            name,
            svg: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            },
        });

        // Save the document to the database
        await softwareApplication.save();

        res.status(201).json({
            success: true,
            message: "Software application created successfully",
            softwareApplication,
        });
    } catch (error) {
        console.error("Error creating software application:", error);
        res.status(500).json({
            success: false,
            message: "Error creating software application: " + error.message,
        });
    }
});

SoftwareApplicationRouter.get('/getSoftwareApplications', userAuth, async (req, res) => {
    try {
        // Fetch all software applications from the database
        const softwareApplications = await SoftwareApplication.find({});

        res.status(200).json({
            success: true,
            softwareApplications,
        });
    } catch (error) {
        console.error("Error fetching software applications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching software applications: " + error.message,
        });
    }
});
SoftwareApplicationRouter.delete('/deleteSoftwareApplication/:id', userAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the software application by ID and delete it
        const softwareApplication = await SoftwareApplication.findByIdAndDelete(id);

        if (!softwareApplication) {
            return res.status(404).json({
                success: false,
                message: "Software application not found",
            });
        }

        // Delete the SVG from Cloudinary
        await cloudinary.uploader.destroy(softwareApplication.svg.public_id);

        res.status(200).json({
            success: true,
            message: "Software application deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting software application:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting software application: " + error.message,
        });
    }
});


module.exports = SoftwareApplicationRouter;

