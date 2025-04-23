const express = require("express");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { validationProfileEditData } = require("../utils/validation");
const { userAuth } = require("../middlewares/auth");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary');
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const profileRouter = express.Router();
profileRouter.use(express.json());
profileRouter.use(cookieParser());

// Profile View Route
profileRouter.get('/profileView', userAuth, async (req, res) => {
    try {
        const cookies = req.cookies;
        const { token } = cookies;

        if (!token) {
            return res.status(401).send('Please login to access the data');
        }

        const decodeObj = await jwt.verify(token, process.env.JWT_SECRET);
        const { _id } = decodeObj;

        const user = await User.findById(_id).select('-password -__v -createdAt -updatedAt');

        if (!user) {
            throw new Error('User not found');
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Profile Edit Route
profileRouter.put('/profileEdit', userAuth, async (req, res) => {
    try {
        // Ensure req.body is not empty
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body is empty or invalid",
            });
        }

        const { firstName, lastName, phone, aboutMe, portfolio, githubUrl, linkedInUrl } = req.body;
        const userId = req.user._id; // Get the user ID from the authenticated user

        // Validate the input data
        validationProfileEditData(req);

        const updatedData = {
            firstName,
            lastName,
            phone,
            aboutMe,
            portfolio,
            githubUrl,
            linkedInUrl,
        };

        // Handle avatar update if provided
        if (req.files && req.files.avatar) {
            const avatar = req.files.avatar;

            // Find the user to get the current avatar's public_id
            const user = await User.findById(userId);
            if (user.avatar && user.avatar.public_id) {
                // Delete the old avatar from Cloudinary
                await cloudinary.uploader.destroy(user.avatar.public_id);
            }

            // Upload the new avatar to Cloudinary
            const newAvatar = await cloudinary.uploader.upload(avatar.tempFilePath, {
                folder: "PORTFOLIO AVATAR",
            });

            updatedData.avatar = {
                public_id: newAvatar.public_id,
                url: newAvatar.secure_url,
            };
        }

        // Handle resume update if provided
        if (req.files && req.files.resume) {
            const resume = req.files.resume;

            // Find the user to get the current resume's public_id
            const user = await User.findById(userId);
            if (user.resume && user.resume.public_id) {
                // Delete the old resume from Cloudinary
                await cloudinary.uploader.destroy(user.resume.public_id);
            }

            // Upload the new resume to Cloudinary
            const newResume = await cloudinary.uploader.upload(resume.tempFilePath, {
                folder: "PORTFOLIO RESUME",
            });

            updatedData.resume = {
                public_id: newResume.public_id,
                url: newResume.secure_url,
            };
        }

        // Update the user's profile in the database
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
            new: true,
            runValidators: true,
        }).select('-password -__v -createdAt -updatedAt');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error during profile update:", error);
        res.status(400).json({
            success: false,
            message: "Error updating profile: " + error.message,
        });
    }
});

profileRouter.put('/updatePassword', userAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.user._id; // Get the user ID from the authenticated user

        // Validate the input data
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password, new password, and confirmation are required",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match",
            });
        }

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // Hash the new password and update it in the database
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error during password update:", error);
        res.status(400).json({
            success: false,
            message: "Error updating password: " + error.message,
        });
    }
});
profileRouter.post('/forgotPassword', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate the input data
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash the reset token and set it in the user's document
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
        await user.save({ validateBeforeSave: false });

        // Create the reset password URL
        const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

        // Email message
        const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetPasswordUrl}\n\nIf you did not request this, please ignore this email.`;

        // Send the email
        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset Request",
                message,
            });

            res.status(200).json({
                success: true,
                message: `Password reset email sent to ${user.email}`,
            });
        } catch (error) {
            // Reset the token fields if email sending fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: "Error sending email: " + error.message,
            });
        }
    } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).json({
            success: false,
            message: "Error generating password reset token: " + error.message,
        });
    }
});

profileRouter.post('/resetPassword/:token', async (req, res) => {
    try {
        const { token } = req.params; // Get the token from the URL
        const { newPassword, confirmNewPassword } = req.body; // Get the new password from the request body

        // Validate the input data
        if (!newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation are required",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match",
            });
        }

        // Hash the token from the URL
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find the user by the hashed token and ensure the token is not expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }, // Ensure the token is not expired
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset password token is invalid or has expired",
            });
        }

        // Hash the new password and update it in the database
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        // Clear the reset token and expiry
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password: " + error.message,
        });
    }
});     

module.exports = profileRouter;