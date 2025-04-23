
const mongoose = require('mongoose');
const { stack } = require('../routes/softwareApplication');

const projectSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    technologies: {
        type: [String],
    },
    liveLink: {
        type: String,
    },
    gitLink: {
        type: String,
    },
    stack:{
        type: String,
    },
    languages:{
        type: [String],
    },
    deployed:{
        type: Boolean,
        default: false,
    },
    projectBanner: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },

})


const Project = mongoose.model('Project', projectSchema);
module.exports = Project;