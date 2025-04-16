import express from "express";
import User from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import validationSignupData from "../utils/validationSignupData.js"; // Import validation logic

const authRouter = express.Router();
authRouter.use(express.json());
authRouter.use(cookieParser());

authRouter.post("/register", async (req, res) => {
    try {
        // Validate the signup data
        validationSignupData(req);

        // Check if files are provided
        if (!req.files || !req.files.avatar || !req.files.resume) {
            return res.status(400).json({
                success: false,
                message: "Avatar and Resume are required",
            });
        }

        const { avatar, resume } = req.files;

        // Upload avatar to Cloudinary
        const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(
            avatar.tempFilePath,
            { folder: "AVATAR" }
        );

        if (!cloudinaryResponseForAvatar || cloudinaryResponseForAvatar.error) {
            throw new Error("Failed to upload avatar to Cloudinary");
        }

        // Upload resume to Cloudinary
        const cloudinaryResponseForResume = await cloudinary.uploader.upload(
            resume.tempFilePath,
            { folder: "RESUME" }
        );

        if (!cloudinaryResponseForResume || cloudinaryResponseForResume.error) {
            throw new Error("Failed to upload resume to Cloudinary");
        }

        // Extract user data from the request body
        const {
            firstName,
            lastName,
            emailId,
            password,
            gender,
            phone,
            aboutMe,
            portfolio,
            githubUrl,
            linkedInUrl,
        } = req.body;

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            firstName,
            lastName,
            email: emailId, // Ensure the field matches your schema
            password: passwordHash,
            gender,
            phone,
            aboutMe,
            portfolio,
            githubUrl,
            linkedInUrl,
            avatar: {
                public_id: cloudinaryResponseForAvatar.public_id,
                url: cloudinaryResponseForAvatar.secure_url,
            },
            resume: {
                public_id: cloudinaryResponseForResume.public_id,
                url: cloudinaryResponseForResume.secure_url,
            },
        });

        // Save the user to the database
        await user.save();

        // Generate a token for the new user
        const token = await user.getJWT();

        // Set the token in a cookie
        res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

        // Return user data in the response
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(400).json({
            success: false,
            message: "Error saving the user: " + error.message,
        });
    }
});

export default authRouter;