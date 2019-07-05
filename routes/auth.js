const express = require('express');
const { check } = require('express-validator/check'); //use check package from this module, pull out check function frm this 

const authController = require('../controllers/auth'); 

const User = require('../models/user')

const router = express.Router(); 


router.get('/login', authController.getLogin); 

router.post('/login',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter valid email')
        .normalizeEmail(),


        check('password','Please enter a password with only numbers and text and at least 5 characters.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim()
        // .withMessage('Please enter a password with only numbers and text and at least 5 characters.')
    ], 
    authController.postLogin     
);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup', 
    [
        check('email') 
        .isEmail()
        .withMessage('Please enter valid email')
        .custom((value, {req})=>{ 
            return User.findOne({email: value})
            .then(userDoc=>{
                if(userDoc){
                    //throw error inside a promise, gets treated as an error
                    return Promise.reject('Email exists already, please pick a different one')
                }
            })
        })
        .normalizeEmail(), 

        check('password')
        .trim()
        .isLength({min: 5})
        .isAlphanumeric()
        .withMessage('Please enter a password with only numbers and text and at least 5 characters.'),

        check('confirmPassword')
        .trim()
        .custom((value, {req})=>{
            if(value !== req.body.password){
                throw new Error('Passwords have to match!')
            }
            return true; 
        })
    ],
    authController.postSignup   
); 

router.get('/reset', authController.getReset); 

router.post('/reset', authController.postResetPassword);

router.get('/new-password/:token', authController.getNewPassword);  

router.post('/new-password',authController.postNewPassword);

module.exports = router;  