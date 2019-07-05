const path = require('path');
const fs = require('fs'); //used w logging 
const https = require('https'); //we're gonna use https server 

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer'); 
const mongoose = require('mongoose')
const session = require('express-session'); 
const MongoDBStore = require('connect-mongodb-session')(session); 
const csrf = require('csurf');  
const flash = require('connect-flash'); 
const helmet = require('helmet'); //add aditional http headers for secrurity! 
const compression = require('compression'); //decrease size of response body and hence speed of web app
const morgan = require('morgan') //logging middleware, gives detailed logging info about incoming requests

const errorController = require('./controllers/error');
const User = require('./models/user'); 

const app = express();
//get env variables from .env file! 
require('dotenv').config({path: __dirname + '/.env'})
const store = new MongoDBStore({
    uri: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-doc4o.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`,
    collection: 'sessions'
}); 
const csrfProtection = csrf(); 

const fileStorage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, 'images');
    },
    filename: (req,file,cb)=>{
        cb(null, new Date().toISOString() + '-' +file.originalname)
    }
});

const fileFilter = (req, file, cb)=>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype==='image/jpeg')
    {
        cb(null, true) 
    } 
    else{
        cb(null, false) 
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth'); 

//all logging data will write to access.log, create the path to it first
const accessLogStream = fs.createWriteStream(
    path.join(__dirname,'access.log'), 
    {flags: 'a'}
);

app.use(helmet()); 
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream})); //write to it , logging data should not display in terminal 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image')); 

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.use( 
    session({ 
        secret: 'my secret', 
        resave: false, 
        saveUninitialized: false, 
        store: store
    })
); 

app.use(flash()); 

app.use((req,res,next)=>{

    if(!req.session.user){
        return next(); 
    }
    User.findById(req.session.user._id)
    .then(user=>{
        if(!user){
            return next(); 
        }
        req.user = user;  
        next(); 
    })
    .catch(err=>{
        next(new Error(err)); //goes to next error middleware
    })
}); 

app.use((req,res,next)=>{
    if(req.url === '/create-order'){
        next(); 
    }
    else{
        csrfProtection(req,res,next) 
    }
})

app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.session.isLoggedin; 
    res.locals.csrfToken = req["csrfToken"] ? req.csrfToken() : ""; 

    next();  
})

app.use('/admin', adminRoutes);
app.use(shopRoutes); 
app.use(authRoutes); 

app.get('/500', errorController.get500);  
app.use(errorController.get404); 

app.use((error, req, res, next)=>{ 
    console.log(error)
    res.redirect('/500'); 
}) 

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-doc4o.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`) 
.then(result=>{
    app.listen(process.env.PORT || 3000);  
}) 
.catch(err=>{
    console.log(err); 
}) 



