const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        trim: true // Trim whitespace
    },
    lastName: {
        type: String,
        trim: true // Add trim for last name as well
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address: " + value);
            }
        },
    },
    password: {
        type: String,
        required: true,
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
        minLength: 10,
    },
    aboutMe: {
        type: String,
        minLength: 5,
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
            required: true,
        },
    },
    resume: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
            required: true,
        },
    },
    portfolio: {
        type: String,
    },
    githubUrl: {
        type: String,
        default: "",
    },
    linkedInUrl: {
        type: String,
        default: "",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

// Generate JWT
userSchema.methods.getJWT = async function () {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in the environment variables");
    }
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    return token;
};

// Validate Password
userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPasswordValidate = await bcrypt.compare(passwordInputByUser, passwordHash);
    return isPasswordValidate;
};

const User = mongoose.model("User", userSchema);
module.exports = User;