const crypto = require('crypto'); 

const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport');

const {validationResult} = require('express-validator') 

const User = require('../models/user')

//configure transporter with sendGrid API key 
const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: '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'
    }
}));


exports.getLogin = (req, res, next)=>{
    let message = req.flash('error');
    if(message.length>0){
        message = message[0] 
    } else{
        message=null; 
    }

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login Page',
        errorMessage: message,
        validationErrors: [],
        oldInput:{
            email:'',
            password:''
        }
        // isAuthenticated: false
    }) 
} 

//authentication
exports.postLogin=(req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req); 
    if(!errors.isEmpty()){

        return res.status(422)
        .render('auth/login',{
            path: '/login',
            pageTitle: 'Login Page',
            // isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInput:{
                email: email,
                password: password
            }  
        })
    }

    User.findOne({email: email})  
    .then(user=>{
        if(!user){
            req.flash('error','Invalid email or password'); 
            return res.redirect('/login'); 
        }
        bcrypt.compare(password, user.password)
        .then(doMatch=>{   //doMatch is a boolean value, True if there is match, vice versa
            if(doMatch){
                //set session
                req.session.isLoggedin = true;
                req.session.user = user; 

                //make sure session is saved before we continue 
                return req.session.save((err)=>{
                    console.log(err); 
                    res.redirect('/'); 
                }); 
            }
            req.flash('error','Invalid email or password'); 
            res.redirect('/login'); //if there is no match 
        })
        .catch(err=>{
            console.log(err);
            res.redirect('/login'); 
        })
    })
    .catch(err=>{
        const error = new Error(err);
        error.httpStatusCode = 500; 
        return next(error); 
    });
}

exports.postLogout=(req,res,next)=>{
    req.session.destroy((err)=>{
        res.redirect('/');
        console.log(err); 
    }); 
}

exports.getSignup = (req,res,next)=>{

    let message = req.flash('error');
    if(message.length>0){
        message = message[0] //req.flash('error') returns array with message in it! 
    } else{
        message=null; 
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: false,
        errorMessage: message,
        oldInput:{
            email: '',
            password:'',
            confirmPassword:''
        },
        validationErrors: []
    })
}

//validation already done when this middleware is reached 
exports.postSignup = (req,res,next)=>{

    const email = req.body.email; 
    const password = req.body.password;
    const errors = validationResult(req); 
    if(!errors.isEmpty()){
        let message = errors.array(); 
        //422 is error status code  
        return res.status(422)
        .render('auth/signup', { //render sign up page again
            path: '/signup',
            pageTitle: 'Signup',
            isAuthenticated: false,
            errorMessage: message[0].msg,
            oldInput: { //keep/display users input in fields for good user experience 
                email: email, 
                password: password, 
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array() //full error array returned to rendered file 
        })
    } 


    bcrypt
        .hash(password, 12)
        .then(hashedPassword=>{
            
            const user = new User({
                email: email,
                password: hashedPassword, 
                cart: {items: []}
            })
            return user.save(); 

        })
        .then(result=>{
            //redirect to login page, after email is sent  
            res.redirect('/login');  


            //after sign up is complete, send confirmation email! 
            return transporter.sendMail({
                to: email,
                from: 'shop@node-complete.com',
                subject: 'Signup succeeded',
                html:'<h1>You successfully signed up!</h1>' 
            })
        })
        .catch(err=>{
            //if send mail function dont work, error will be logged out here 
            const error = new Error(err);
            error.httpStatusCode = 500; 
            return next(error); 
        })
}; 

exports.getReset=(req,res,next)=>{

    //get error messages if any 
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message=null; 
    }

    res.render('auth/password-reset',{
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
}

exports.postResetPassword = (req, res, next) => {
    const email = req.body.email;
   crypto.randomBytes(32, (err, buffer) => {
       if (err) {
            console.log(err);
           throw new Error('Something'); 
       }
       const token = buffer.toString("hex");
       User.findOne({ email:email })
           .then(user => {
               if (!user) {
                   req.flash('error','No account with that email found.');
                   return res.redirect('/reset');
               }
               user.resetToken = token;
               user.resetTokenExpiration = Date.now() + 1000 * 60 * 60;  
               return user.save();
           }) 
           .then(result => {
               if(result){
                    res.redirect('/');
                    transporter.sendMail({
                        to: email,
                        from: 'shop@node.com',
                        subject: 'Password reset',
                        html: `
                            <p>You requested a password reset</p>
                            <p>Click this <a href="http://localhost:3000/new-password/${token}">link</a> to set a new password.</p>
                            `
                    })
               }
           })
           .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500; 
                return next(error); 
           });   
   });
};
        
exports.getNewPassword = (req,res,next)=>{
    //first check if there is a user for that token and if token expiration date is greater than now
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration:{$gt: Date.now()}})
    .then(user=>{  
        if(!user){
            req.flash('error', 'Invalid Token')
            return res.redirect('/login'); 
        }
        //get error messages if any 
        let message = req.flash('error');
        if(message.length>0){
            message = message[0];
        }else{
            message=null; 
        } 

        res.render('auth/new-password',{
            path: '/new-password', 
            pageTitle: 'Update Password',
            errorMessage: message, 
            passwordToken: token, 
            userId: user._id //include user id so it can be submitted thru post and we can use that to change new password 
        }) 
    })
    .catch(err=>{
        console.log('token not found'); 
        const error = new Error(err);
        error.httpStatusCode = 500; 
        return next(error);  
    })
}

exports.postNewPassword = (req, res, next)=>{
    const newPassword = req.body.password;
    const userId = req.body.userId; 
    const passwordToken = req.body.passwordToken;
    let resetUser; //user that is reseting password 

    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration:{$gt: Date.now()}, //Greater than Date.now()
        _id: userId
    })
    .then(user=>{
        resetUser = user; 
        return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword=>{
        //update password for user 
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined; 
        resetUser.resetTokenExpiration = undefined; 
        return resetUser.save(); 
    })
    .then(result=>{
        //after all goes well, redirect to login 
        res.redirect('/login'); 
    })
    .catch(err=>{
        const error = new Error(err);
        error.httpStatusCode = 500; 
        return next(error);  
    })


}