const path = require('path');

const express = require('express');

const {check} = require('express-validator/check'); 

const adminController = require('../controllers/admin');

//import is-auth middleware, and put it before controller (left-most) 
const isAuth = require('../middleware/is-auth'); 

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts); 

// /admin/add-product => POST
router.post('/add-product', 
    [   
        check('title')
        .isString()
        .isLength({min: 3})
        .trim(), //sanitization, remove excess white space 

        check('price')
        .isFloat(),

        check('description')
        .isLength({min: 5, max: 400})
        .trim()
    ],
    isAuth, 
    adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
    [   
        check('title')
        .isString() 
        .isLength({min: 3})
        .trim(), //sanitization, remove excess white space 

        check('price')
        .isFloat(),

        check('description')
        .isLength({min: 5, max: 400})
        .trim()
    ],
    isAuth, 
    adminController.postEditProduct);

//see ep347 for explanation on this http request and code changes! 
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router; 
