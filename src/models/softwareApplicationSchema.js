const mongoose = require("mongoose");

const softwareApplicationSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
    svg:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    }
})


const SoftwareApplication=mongoose.model("SoftwareApplication",softwareApplicationSchema)
module.exports=SoftwareApplication
