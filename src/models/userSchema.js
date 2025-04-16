const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt= require('jsonwebtoken');

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
        minLength: [2, "First name must be at least 2 characters long"],
        trim:true
    },
    lastName: {
        type: String,
        required: true,
        minLength: [2, "Last name must be at least 2 characters long"],
        trim:true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
              throw new Error('Invalid email address: ' + value);
            }
          },
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "Password must be at least 6 characters long"],
        select: false, // Do not include password in queries by default
    },
    gender: {
        type: String,
        enum: {
          values: ['male', 'female', 'others'],
          message: `{VALUE} is not a valid gender type`
        },
        set: value => value.toLowerCase(), // Convert to lowercase
        default: 'others' // Provide a default value
      },
    phone: {
        type: String,
        required: true,
        minLength: [10, "Phone number must be at least 10 characters long"],
    },
    aboutMe: {
        type: String,
        required: true,
        minLength: [4, "About me must be at least 4 characters long"],
    },
    avatar:{
        public_id:{
            type: String,
            required: true,
        },
        url:{
            type: String,
            required: true,
        }
    },
    resume:{
        public_id:{
            type: String,
            required: true,
        },
        url:{
            type: String,
            required: true,
        }
    },
    portfolio:{
       type: String,
       required: [true, "Portfolio link is required"],
    },
    githubUrl:String,
    linkedInUrl:String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    

})

// Existing methods remain the same
userSchema.methods.getJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
    return token;
  }

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPasswordValidate = await bcrypt.compare(passwordInputByUser, passwordHash);
    return isPasswordValidate;
  }
  


const User= mongoose.model("User", userSchema);
module.exports=User; // Export the model for use in other files