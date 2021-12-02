const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = Schema({
    wallet_email:{type:String,required:true},
    amount:{type:String,required:true},
    transactionType:{type:String,required:true},
    transactionMethod:{type:String,required:true},
},{
    timestamps:true,
});

const Transaction = mongoose.model("transaction",transactionSchema)
module.exports = Transaction;
