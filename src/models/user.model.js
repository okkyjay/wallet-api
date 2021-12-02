const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = Schema({
    email:{type:String,required:true,unique:true,},
    companyName:{type:String,required:true},
    password:{type:String,required:true},
    amount:{type:String},
},{
    timestamps:true,
});

const User = mongoose.model("user",userSchema)
module.exports = User;
