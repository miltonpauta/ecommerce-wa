const fs = require('fs'); 
const path = require('path'); 

const PDFDocument = require('pdfkit'); 
const stripe = require('stripe')(process.env.STRIPE_KEY)

const Product = require('../models/product');
const Order = require('../models/order') 
const User = require('../models/user') 

const ITEMS_PER_PAGE = 2; 

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1; 
  let totalItems; 

  Product.find()
  .countDocuments()
  .then(numberOfProducts=>{
    totalItems = numberOfProducts; 
    return Product.find()
    .skip((page-1) * ITEMS_PER_PAGE) 
    .limit(ITEMS_PER_PAGE)           
  })
  .then(products=>{ 
    res.render('shop/product-list',{
      prods: products, 
      pageTitle: 'Products',
      path: '/products',
      currentPage: page,
      totalProducts: totalItems,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1, 
      prevPage: page -1,
      lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
    }); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  });  
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)  
    .then(product=>{ 
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title, 
        path: '/products'
      }); 
    })
    .catch(err=>{
      const error = new Error(err);
      error.httpStatusCode = 500; 
      return next(error); 
    }); 
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1; 
  let totalItems; 

  Product.find()
  .countDocuments()
  .then(numberOfProducts=>{
    totalItems = numberOfProducts; 
    return Product.find()
    .skip((page-1) * ITEMS_PER_PAGE) //pagination
    .limit(ITEMS_PER_PAGE)           //this too
  })
  .then(products=>{ 
    res.render('shop/index',{
      prods: products, 
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      totalProducts: totalItems,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1, //if current pg is 2, next is 3 
      prevPage: page -1,
      lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
    }); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  });
};

exports.getCart = (req, res, next) => { 
  req.user
  .populate('cart.items.productId') 
  .execPopulate() 
  .then(user=>{ 
    const products = user.cart.items; 
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products
    }); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  })
};

exports.postCart = (req, res, next) => {
  
  const prodId = req.body.productId;
  Product.findById(prodId).then(product=>{
    return req.user.addToCart(product);     
  }) 
  .then(result=>{
    res.redirect('/cart'); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  })
};

// delete a product from cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId; 

  console.log(prodId); 
  req.user.removeFromCart(prodId)  
  .then(result=>{
    res.redirect('/cart'); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  })
};


exports.postOrder = (req,res,next)=>{ 
  const token = req.body.stripeToken; //token holds validated credit card data

  let totalSum = 0; 

  //get all products from cart 
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user=>{
    //get total order sum to charge 
    user.cart.items.forEach(p=>{
      totalSum += p.quantity * p.productId.price //remember totalsum is in cents 
    }) 

    const products = user.cart.items.map(i=>{
      return {quantity: i.quantity, product: {...i.productId._doc} } 
    }); 
    const order = new Order({
      user: {
          email: req.user.email, 
          userId: req.user
      },
      products: products
    })
    return order.save(); 
  }) 
  .then(result=>{
    
    const charge = stripe.charges.create({
      amount: totalSum * 100, 
      currency: 'usd',
      description: 'Your Order',
      source: token,
      metadata: {order_id: result._id.toString()} //make order if of this charge be same as created order id
    }); 

    //clear cart
    return req.user.clearCart(); 
  }) 
  .then(()=>{
    res.redirect('/orders'); 
  })
  .catch(err=> {
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  }); 
}; 


exports.getOrders = (req, res, next) => {
  
  Order.find({'user.userId': req.user._id})
  .then(orders =>{ //array of all orders for the user is now here in .then() section 
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders
    }); 
  }) 
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  }); 
};

exports.getCheckout = (req, res, next) => {
  req.user
  .populate('cart.items.productId') //populate field w product detail data
  .execPopulate() 
  .then(user=>{ 
    const products = user.cart.items; 

    let totalPrice = 0; 
    products.forEach(p=>{
      totalPrice += p.quantity * p.productId.price; 
    })
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: products,
      totalPrice: totalPrice
    }); 
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500; 
    return next(error); 
  })
};

exports.getInvoice = (req,res,next)=>{
  const orderId = req.params.orderId; 

  //see if order belongs only to current session user! (only owner can see it)
  Order.findById(orderId)
  .then(order=>{
    if(!order){
      return next(new Error('No order found!'))
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized')); 
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    //create path to the invoice 
    const invoicePath = path.join('data', 'invoices', invoiceName) 

    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath)); //gets stored on server (invoice path) AND shown to clients
    pdfDoc.pipe(res); 

    pdfDoc.fontSize(26).text('Invoice',{
      underline: true
    });

    pdfDoc.text('---------------------------');
    let totalPrice = 0; 
    order.products.forEach(prod=>{
      totalPrice += prod.quantity * prod.product.price; 
      pdfDoc.fontSize(14).text(
        prod.product.title + 
        '-' + 
        prod.quantity + 
        'x' + 
        '$' + 
        prod.product.price
      ); 
    })
    pdfDoc.text('-----------------'); 
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice); 
    pdfDoc.end(); 
  })
  .catch(err=>next(err)); 
}
