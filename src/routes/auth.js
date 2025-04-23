const express = require("express");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { validationSignupData } = require("../utils/validation");
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const { userAuth } = require("../middlewares/auth");
const jwt = require("jsonwebtoken");

const authRouter = express.Router();
authRouter.use(express.json());
authRouter.use(cookieParser());

// Register route
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
      email,
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
      email,
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
    res.cookie("token", token, { 
      expires: new Date(Date.now() + 900000)
    });

    // Return user data in the response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
        success: false,
        message: 'Error saving the user: ' + error.message
      });
  }
});

// Login route
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email and explicitly include the password field
    const user = await User.findOne({ email:email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValidate = await user.validatePassword(password);

   
    if (isPasswordValidate) {
        const token = await user.getJWT();
     
  
        res.cookie('token', token, { expires: new Date(Date.now() + 900000) });
        res.status(201).json({
            success: true,
            message: 'User login successfully',
            data: user
          });
      } else {
        throw new Error('Password is not correct');
      }
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});




// Logout route
authRouter.post('/logout', async (req, res) => {
  res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

module.exports = authRouter;