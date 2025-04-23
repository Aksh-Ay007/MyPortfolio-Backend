const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
    },
    proficiency: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"], // Define allowed values
    },
    svg: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
});

const Skill = mongoose.model("Skill", skillSchema);
module.exports = Skill;