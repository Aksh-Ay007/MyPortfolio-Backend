const validator=require('validator')
const { Error } = require('mongoose')


const validationSignupData = (req) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName) {
        throw new Error("First name and last name are required");
    } else if (firstName.length < 2 || firstName.length > 50) {
        throw new Error("First name should be between 2 to 50 characters");
    } else if (lastName.length < 2 || lastName.length > 50) {
        throw new Error("Last name should be between 2 to 50 characters");
    } else if (!validator.isEmail(email)) {
        throw new Error("Email is not valid");
    } else if (
        !validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
    ) {
        throw new Error(
            "Password should be strong (min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol)"
        );
    }
};



const validationProfileEditData = (req) => {
    const { firstName, lastName, gender, phone, aboutMe, portfolio, githubUrl, linkedInUrl } = req.body;

    // Validate first name
    if (firstName && (firstName.length < 2 || firstName.length > 50)) {
        throw new Error("First name should be between 2 to 50 characters");
    }

    // Validate last name
    if (lastName && (lastName.length < 2 || lastName.length > 50)) {
        throw new Error("Last name should be between 2 to 50 characters");
    }

    // Validate gender
    if (gender && !['male', 'female', 'others'].includes(gender.toLowerCase())) {
        throw new Error("Gender must be 'male', 'female', or 'others'");
    }

    // Validate phone
    if (phone && (!validator.isMobilePhone(phone, 'any') || phone.length < 10)) {
        throw new Error("Phone number is not valid");
    }

    // Validate aboutMe
    if (aboutMe && aboutMe.length < 5) {
        throw new Error("About Me should be at least 5 characters long");
    }

    // Validate portfolio URL
    if (portfolio && !validator.isURL(portfolio)) {
        throw new Error("Portfolio URL is not valid");
    }

    // Validate GitHub URL
    if (githubUrl && !validator.isURL(githubUrl)) {
        throw new Error("GitHub URL is not valid");
    }

    // Validate LinkedIn URL
    if (linkedInUrl && !validator.isURL(linkedInUrl)) {
        throw new Error("LinkedIn URL is not valid");
    }
};

module.exports= {validationSignupData,validationProfileEditData}