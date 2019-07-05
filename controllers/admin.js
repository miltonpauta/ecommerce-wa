const Product = require('../models/product');
const {validationResult} = require('express-validator/check')

const fileHelper = require('../util/file'); 


exports.getAddProduct = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message = message[0] 
  } else{
    message=null; 
  } 

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: message,
    validationErrors: [] 
  });
};


exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false, 
      hasError: true,
      product: {
        title: title, 
        price: price,
        description: description
      }, 
      errorMessage: 'Attached file is not an image!',
      validationErrors: []
    });
  } 

  //path to imageUrl in our folder, images shouldnt be stored in db 
  const imageUrl = image.path; 

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false, //we are adding not editing
      hasError: true,
      product: {
        title: title, 
        price: price,
        description: description
      }, 
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    title: title, 
    price: price, 
    description: description,
    imageUrl: imageUrl,
    userId: req.user 
  }) 

  product.save()
  .then(result=>{ 
    // 
    console.log('created product'); 
    res.redirect('/admin/products'); 
  }) 
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); //will let express know to skip all other middleware (including 'catch all') and reach a error handling middleware 
  }) 
};


exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
  .then(product=>{
    if(!product){
      return res.redirect('/'); 
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    }); 
  }).catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error);  
  })
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  //validation error handling 
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product', 
      editing: true, //we are editing in this view, not adding
      hasError: true, 
      product: {
        title: updatedTitle, 
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      }, 
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
  .then(product=>{

   
    if(product.userId.toString() !== req.user._id.toString()){
      console.log('this item dont belong to u, u cant edit this!'); 
      return res.redirect('/'); 
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    //see if multer accepted image..then add pic path 
    if(image){
      fileHelper.deleteFile(product.imageUrl); //delete old pic
      product.imageUrl = image.path; //update w new pic 
    }
    product.description = updatedDesc;
    return product.save()
    .then(result=>{ 
      console.log('Updated Product...'); 
      res.redirect('/admin/products');     
    }) //this handles all successor promises from return save
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error);   
  })
};


exports.getProducts = (req, res, next) => {
  Product.find({userId:req.user._id})  
  // .populate('userId')
  .then(products=>{
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error);  
  }); 
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId; //non post routes dont have .body, we using .delete
  
  Product.findById(prodId)
  .then(product=>{
    if(!product){
      return next(new Error('Product not found. '))
    }

    //delete pic file from storage folder, deleteOne() below deletes its url from db 
    fileHelper.deleteFile(product.imageUrl); 

    return Product.deleteOne({_id: prodId, userId: req.user._id}) 
  })
  .then(result=>{
    res.status(200).json({
      message: 'Success!'
    })
  })
  .catch(err=>{
    res.status(500).json({
      message: 'deleting product failed'
    }); 
  })
};
