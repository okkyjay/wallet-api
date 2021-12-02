const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const TransactionModel = require('../models/transaction.model')


function validateAmount(amount) {
    if (parseFloat(amount) || parseInt(amount)){
        return amount
    }
    return false
}
function validateEmail(email){
    if (!(typeof email === 'string' && email.match(/^[a-zA-Z0-9_.-]{2,32}@[a-zA-Z]{2,32}\.[a-zA-Z]{2,8}/gi))) {
        return false
    }
    return true
}
let result = {
    message: 'please ensure fields are not empty',
    status: false,
    data: {}
}
function userExist (email){
    User.findOne({email:email})
        .then(user => {
            if (user) {
                return true;
            }
            return false;
        });
}

function findUser (email){
    User.findOne({email})
        .then(user => {
            if (user) {
               return user;
            }
            return false;
        });
}

// create a new user/wallet.
router.route("/auth/register").post((req, res) => {

    const { email,companyName,password } = req.body;
    if (!email && !companyName && !password){
      res.status(403).json(result)
        return
    }
     if (validateEmail(email) === false){
         result.message = 'Please enter a valid email'
       res.status(403).json(result)
       return;
     }
     if (userExist(email) === true){
         result.message = 'Email already exist'
       res.status(403).json(result)
       return;
     }
    let user = new User({
        email,
        companyName,
        password: bcrypt.hashSync(password, 10),
        amount: 0,
    });

    user
      .save()
      .then(user => {
        jwt.sign({
          email: email
        }, 'secret-pass', (err, token) => {
          if(err) throw err;
          result.status = true;
          result.data = {
              token: token,
          }
          result.message = ''
          res.send(result);
          return
        });
      })
      .catch(err => {
        console.log(err);
        res.status(403).json(result);
        return
      });
  })
router.route("/auth/login").post((req, res) => {
    const { email, password } = req.body;
    if (!email  && !password){
      res.status(403).json(result)
        return;
    }
    if (!validateEmail(email)){
        result.message = 'Please enter a valid email'
      res.status(403).json(result)
      return;
    }

    User.findOne({email})
      .then(user => {
        if(!user) {
            result.message = 'User not found'
          res.status(403).json(result);
          return;
        } else if(!bcrypt.compareSync(password, user.password)) {
            result.message = 'User not found'
          res.status(403).json(result);
            return;
        }else if (user) {
            jwt.sign({
                email: user.email
            }, 'secret-pass', (err, token) => {
                if(err) throw err;
                result.status = true;
                result.data = {
                    token: token,
                }
                result.message = ''
                res.send(result);
                return;
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(200).json(result);
        return;
      });
  });
router.route("/wallet/balance").get((req, res) => {
    let email = req.loggedInUserEmail;
    if (email){
        User.findOne({email:email})
            .then(user => {
                if (user){
                   result.message = ''
                   result.status = true
                   result.data = {
                       balance: user.amount
                   }
                    res.status(200).json(result)
                    return
                }
            }).catch(e => {
            result.message = 'Please register/login to continue';
            res.status(403).json(result)
            return;
        })
    }else {
        result.message = 'Please register/login to continue';
        res.status(403).json(result)
        return;
    }
});
router.route("/wallet/mine").get((req, res) => {
    let email = req.loggedInUserEmail;
    if (email){
        User.findOne({email:email})
            .then(user => {
                if (user){
                    delete user.password
                    result.message = ''
                    result.status = true
                    result.data = user;
                    res.status(200).json(result)
                    return
                }
            }).catch(e => {
            result.message = 'Please register/login to continue';
            res.status(403).json(result)
            return;
        })
    }else {
        result.message = 'Please register/login to continue';
        res.status(403).json(result)
        return;
    }
});
router.route("/wallet/transfer").post((req, res) => {
    let email = req.loggedInUserEmail;
    let toEmail = req.body.toEmail;
    let amount = req.body.amount;
    if (email && toEmail && amount){
        let amount = validateAmount(req.body.amount);
        if (!amount){
            result.message = 'Invalid Amount'
            res.status(403).json(result)
            return
        }
        User.findOne({ email:email }).then((mainUser) => {
            User.findOne({ email:toEmail }).then((rUser) => {
                if (!rUser){
                    result.message = 'The user to receive the transfer does not exist'
                    res.status(403).json(result)
                    return ;
                }else {
                    let transactionFromUser = mainUser
                    if (transactionFromUser && transactionFromUser.email && parseFloat(transactionFromUser.amount) >= amount){

                        let transactionData = {
                            wallet_email:mainUser.email,
                            amount: amount,
                            transactionType: 'debit',
                            transactionMethod:'transfer'
                        }
                        createTransaction(transactionData);

                        //Update user balance
                        let currentBalanceAmount = mainUser.amount;
                        let newBalanceAmount = parseFloat(currentBalanceAmount) - amount;
                        User.findOneAndUpdate({_id:mainUser._id}, {$set: {amount:newBalanceAmount}}, {useFindAndModify: false},(err, emp)=>{
                            if (err){
                                return;
                            }else {

                                return;
                            }
                        })

                        transactionData.wallet_email = rUser.email
                        transactionData.transactionType = 'credit'

                        createTransaction(transactionData);
                        //Update to user balance

                         currentBalanceAmount = rUser.amount;
                        newBalanceAmount = parseFloat(currentBalanceAmount) + amount;
                        User.findOneAndUpdate({_id:rUser._id}, {$set: {amount:newBalanceAmount}}, {useFindAndModify: false},(err, emp)=>{
                            if (err){
                                return;
                            }else {

                                return;
                            }
                        })
                        result.message = "Successful"
                        result.status = true
                        result.data = {}
                        res.status(403).json(result)
                        return ;
                    }else {
                        result.message = "Insufficient Balance"
                        res.status(403).json(result)
                        return;
                    }
                }
            });
        });

    }else {
        res.status(403).json(result)
        return
    }
});
router.route("/wallet/update").put((req, res) => {
    let email = req.loggedInUserEmail;
    if (email){
        const { companyName} = req.body;
        if (companyName){
            User.findOne({ email:email }).then((user) => {
                if (user){
                    User.findOneAndUpdate({_id:user._id}, {$set: {companyName:companyName}}, {useFindAndModify: false},(err, emp)=>{
                        if (err){
                            return;
                        }else {

                            return;
                        }
                    })
                }else {
                    result.message = 'Login to continue'
                    res.status(403).json(result)
                    return
                }
            })
            result.message = 'Record Updated Successfully'
            res.status(200).json(result)
        }else {
            result.message = 'Provide the company name'
            res.status(403).json(result)
            return
        }
    }
    res.status(403).json(result)
    return
});
router.route("/wallet/deposit").post((req, res) => {
    let email = req.loggedInUserEmail;
    if (email){
        let { amount } = req.body;
        if (amount){
            amount = validateAmount(amount)
            if (!amount){
                result.message = 'Invalid Amount Provided'
                res.status(403).json(result)
                return
            }
        let user = User.findOne({ email:email }).then((user) => {
            if (user){
                let currentBalanceAmount = user.amount;
                let newBalanceAmount = parseFloat(currentBalanceAmount) + amount;
                let res = User.findOneAndUpdate({_id:user._id}, {$set: {amount:newBalanceAmount}}, {useFindAndModify: false},(err, emp)=>{
                    if (err){

                        return false;
                    }else {
                        let transactionData = {
                            wallet_email:user.email,
                            amount: amount,
                            transactionType: 'credit',
                            transactionMethod:'transfer'
                        }
                        createTransaction(transactionData)
                        return true;
                    }
                }).then((res) => {

                })

            }
        }).then((res) => {

        })
            result.message = 'Deposit made successfully'
            result.status = true
            res.status(200).json(result)
            return
        }else {
            result.message = 'Provide the amount you want to deposit'
            res.status(403).json(result)
            return
        }
    }
    res.status(403).json(result)
});

function createTransaction(data) {
   let t =  new TransactionModel(data)
    t.save().then()
    return
}
module.exports = router;
