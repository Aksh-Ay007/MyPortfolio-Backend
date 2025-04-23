const express = require('express');
const { userAuth } = require('../middlewares/auth');
const Project = require('../models/projectSchema');
const cloudinary = require('../config/cloudinary');
const cookieParser = require('cookie-parser');


const ProjectRouter = express.Router();
ProjectRouter.use(express.json());
ProjectRouter.use(cookieParser());

ProjectRouter.post('/addProject', userAuth, async (req, res) => {
    try {
        // Check if files and title are provided
        if (!req.files || !req.files.projectBanner) {
            return res.status(400).json({
                success: false,
                message: "Project banner image is required",
            });
        }

        const { projectBanner } = req.files;
        const { title, description, technologies, liveLink, gitLink, stack, languages } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description is required",
            });
        }

        // Upload project banner to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(projectBanner.tempFilePath, {
            folder: "PORTFOLIO_PROJECT_BANNER",
        });

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            throw new Error("Failed to upload project banner to Cloudinary");
        }

        // Create a new project document
        const project = new Project({
            title,
            description,
            technologies,
            liveLink,
            gitLink,
            stack,
            languages,
            projectBanner: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            },
        });

        // Save the document to the database
        await project.save();

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});


ProjectRouter.get('/getAllProjects', async (req, res) => {
    try {
        const projects = await Project.find({});
        res.status(200).json({
            success: true,
            projects,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

ProjectRouter.get('/getProject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

ProjectRouter.delete('/deleteProject/:id', userAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the project by ID and delete it
        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Delete the project banner from Cloudinary
        await cloudinary.uploader.destroy(project.projectBanner.public_id);

        res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});


ProjectRouter.put('/updateProject/:id', userAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, technologies, liveLink, gitLink, stack, languages, deployed } = req.body;

        // Find the existing project
        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Validate and process the project banner if provided
        let updatedProjectBanner = existingProject.projectBanner;
        if (req.files && req.files.projectBanner) {
            const { projectBanner } = req.files;

            // Validate file size (e.g., max 5MB)
            if (projectBanner.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: "Project banner file is too large. Maximum 5MB allowed.",
                });
            }

            try {
                // Upload new project banner to Cloudinary
                const cloudinaryResponse = await cloudinary.uploader.upload(projectBanner.tempFilePath, {
                    folder: "PORTFOLIO_PROJECT_BANNER",
                    public_id: `project_${id}_banner`,
                    overwrite: true,
                    transformation: [
                        { width: 1200, height: 800, crop: "fill" },
                        { quality: "auto" },
                    ],
                });

                updatedProjectBanner = {
                    public_id: cloudinaryResponse.public_id,
                    url: cloudinaryResponse.secure_url,
                };
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload project banner",
                    error: uploadError.message,
                });
            }
        }

        // Ensure `technologies` and `languages` are arrays
        const newTechnologies = Array.isArray(technologies) ? technologies : [technologies].filter(Boolean);
        const newLanguages = Array.isArray(languages) ? languages : [languages].filter(Boolean);

        // Merge new and existing values for `technologies` and `languages`
        const updatedTechnologies = newTechnologies.length
            ? [...new Set([...(existingProject.technologies || []), ...newTechnologies])]
            : existingProject.technologies;

        const updatedLanguages = newLanguages.length
            ? [...new Set([...(existingProject.languages || []), ...newLanguages])]
            : existingProject.languages;

        // Update the project fields
        const updatedFields = {
            title: title || existingProject.title,
            description: description || existingProject.description,
            technologies: updatedTechnologies,
            liveLink: liveLink || existingProject.liveLink,
            gitLink: gitLink || existingProject.gitLink,
            stack: stack || existingProject.stack,
            languages: updatedLanguages,
            deployed: deployed !== undefined ? deployed : existingProject.deployed,
            projectBanner: updatedProjectBanner,
        };

        // Update the project in the database
        Object.keys(updatedFields).forEach((key) => {
            existingProject[key] = updatedFields[key];
        });

        await existingProject.save();

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            updatedProject: existingProject,
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

module.exports = ProjectRouter;