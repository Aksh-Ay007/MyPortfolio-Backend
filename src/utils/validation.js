import validator from "validator";
const { Error } = require('mongoose')


const validationSignupData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !lastName) {
        throw new Error("First name and last name are required");
    } else if (firstName.length < 2 || firstName.length > 50) {
        throw new Error("First name should be between 2 to 50 characters");
    } else if (lastName.length < 2 || lastName.length > 50) {
        throw new Error("Last name should be between 2 to 50 characters");
    } else if (!validator.isEmail(emailId)) {
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

export default validationSignupData;