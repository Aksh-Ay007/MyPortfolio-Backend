const mongoose = require("mongoose");

const timeLineSchema=new mongoose.Schema({

    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    timeLine:{
        from:{
            type:String,
            required:true
        },
        to:{
            type:String,
            required:true
        }
    }
})


const TimeLine=mongoose.model("TimeLine",timeLineSchema)
module.exports=TimeLine