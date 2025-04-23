
const express = require("express");
const Skill = require("../models/skillSchema");
const cookieParser = require("cookie-parser");
const { userAuth } = require("../middlewares/auth");
const cloudinary = require("../config/cloudinary");

const SkillRouter = express.Router();
SkillRouter.use(express.json());
SkillRouter.use(cookieParser());


SkillRouter.post("/addSkill", userAuth, async (req, res) => {
    try {
        // Check if files and title are provided
        if (!req.files || !req.files.svg) {
            return res.status(400).json({
                success: false,
                message: "SVG file is required",
            });
        }

        const { svg } = req.files;
        const { title, proficiency } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        if (!proficiency) {
            return res.status(400).json({
                success: false,
                message: "Proficiency is required",
            });
        }

        // Upload SVG to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(svg.tempFilePath, {
            folder: "PORTFOLIO_SKILL",
        });

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            throw new Error("Failed to upload SVG to Cloudinary");
        }

        // Create a new skill document
        const skill = new Skill({
            title,
            proficiency,
            svg: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            },
        });

        // Save the document to the database
        await skill.save();

        res.status(201).json({
            success: true,
            message: "Skill created successfully",
            skill,
        });
    } catch (error) {
        console.error("Error creating skill:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

SkillRouter.get("/getAllSkills", userAuth, async (req, res) => {

    try {
        // Fetch all skills from the database
        const skills = await Skill.find({});

        res.status(200).json({
            success: true,
            skills,
        });
    } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
})

SkillRouter.delete("/deleteSkill/:id", userAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the skill by ID and delete it
        const skill = await Skill.findByIdAndDelete(id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        // Delete the SVG from Cloudinary
        await cloudinary.uploader.destroy(skill.svg.public_id);

        res.status(200).json({
            success: true,
            message: "Skill deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

SkillRouter.put("/updateSkill/:id", userAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, proficiency } = req.body;

        // Check if files and title are provided
        if (!req.files || !req.files.svg) {
            return res.status(400).json({
                success: false,
                message: "SVG file is required",
            });
        }

        const { svg } = req.files;

        // Upload SVG to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(svg.tempFilePath, {
            folder: "PORTFOLIO_SKILL",
        });

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            throw new Error("Failed to upload SVG to Cloudinary");
        }

        // Find the skill by ID and update it
        const skill = await Skill.findByIdAndUpdate(
            id,
            {
                title,
                proficiency,
                svg: {
                    public_id: cloudinaryResponse.public_id,
                    url: cloudinaryResponse.secure_url,
                },
            },
            { new: true }
        );

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Skill updated successfully",
            skill,
        });
    } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
})

module.exports = SkillRouter;