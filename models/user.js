const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    // blow two fields are not required, only when user requests a reset 
    resetToken: String,
    resetTokenExpiration: Date,
    
    cart:{
        items: [
            {
                productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true}, 
                quantity: {type: Number, required: true}
            }
        ]
    }
})

userSchema.methods.addToCart = function(product){ 
    //see if cart contains certain item already 

    //findIndex happens to elements in items array, tryna find out if item exists
    const cartProductIndex = this.cart.items.findIndex(cp=>{
        return cp.productId.toString() === product._id.toString(); //-1 returns if not exists 
    });          
    let newQuantity =1; 
    //retrieve cart items 
    const updatedCartItems = [...this.cart.items]; 

    //if item exists in cart already 
    if(cartProductIndex >=0){
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity; 
    } else{
        updatedCartItems.push({
            productId: product._id, 
            quantity: newQuantity
        }); 
    }

    const updatedCart = {
        items: updatedCartItems //items is array oj objects 
    }; 

    this.cart = updatedCart; 
    return this.save()
    
}; 

userSchema.methods.clearCart=function(){
    this.cart = {items: []}
    return this.save(); 
}

userSchema.methods.removeFromCart= function(productId){ 
    const updatedCartItems = this.cart.items.filter(item=>{
        return item.productId.toString() !== productId.toString();
    }) 
    console.log(updatedCartItems); 
    this.cart.items = updatedCartItems; 
    return this.save(); 
}
module.exports = mongoose.model('User', userSchema); 





























// const mongodb = require('mongodb'); //to create mongoId object 
// const getDb = require('../util/database').getDb;

// const Product = require('./product')  

// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, id){
//         this.name = username;
//         this.email=email; 
//         this.cart = cart; // { items: [] }
//         this._id = id; 
//     }

//     save(){
//         const db =getDb();
        
//         return db.collection('users').insertOne(this); 
//     }

//     addToCart(product){
//         //see if cart contains certain item already 

//         //findIndex happens to elements in items array, tryna find out if item exists
//         const cartProductIndex = this.cart.items.findIndex(cp=>{
//             return cp.productId.toString() === product._id.toString(); //-1 returns if not exists 
//         });          
//         let newQuantity =1; 
//         //retrieve cart items 
//         const updatedCartItems = [...this.cart.items]; 
//         console.log('updated cart items', updatedCartItems ,'end of shit'); 

//         //if item exists in cart already 
//         if(cartProductIndex >=0){
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity; 
//         } else{
//             updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQuantity}); 
//         }

//         const updatedCart = {
//             items: updatedCartItems //items is array oj objects 
//         }; 

//         const db = getDb();
//         return db.collection('users').updateOne(
//             {_id: new ObjectId(this._id)},
//             { $set: {cart:updatedCart} }
//         ); 
//     }

//     getCart(){
//         const db = getDb();
//         //get all product ids asscoaited with this cart, Products that exist ofcourse! 
//         const productIds = this.cart.items.map(i=>{
//             Product.findById(i.productId).then(result=>{
//                 if(!result){
//                     this.deleteItemFromCart(i.productId); 
//                 }
//             }).catch(err=>console.log(err)); 
//             return i.productId;  
//         });
//         //find the product objects asscoiated with those Ids 
//         return db.collection('products').find({_id: {$in: productIds}}).toArray()
//         .then(products=>{ //array of products is found 

//             return products.map(p=>{ //transform them into array of objects (product, quantity) 
    
//                 return {
//                     ...p, 
//                     quantity: this.cart.items.find(i=>{ //find access to its quantity
//                         return i.productId.toString() === p._id.toString(); 
//                     }).quantity
//                 }; 
//             })
//         })
//     }


//     deleteItemFromCart(productId){
//         //make an array without deleted product
//         const updatedCartItems = this.cart.items.filter(item=>{
//             return item.productId.toString() !== productId.toString(); //returns false, gets rid of item
//         });

//         const db = getDb();
//         //update it onto database (user collection)
//         return db.collection('users').updateOne(
//             {_id: new ObjectId(this._id)},
//             {$set: { cart: {items: updatedCartItems}}}
//         )
//     }

//     addOrder(){
//         const db = getDb();
//         return this.getCart() 
//         .then(products=>{
//             const order ={
//                 items: products, //holds array of products with details of product 
//                 user: {
//                     _id : new ObjectId(this._id),
//                     name: this.name 
//                 }
//             }; 
//             return db.collection('orders').insertOne(order) 
//         })
//         .then(result=>{
//             //clear cart for this user object 
//             this.cart = {items: []};
//             //make sure there is no cart in the database too 
//             return db.collection('users').updateOne(
//                 {_id: new ObjectId(this._id)},
//                 { $set: { cart: { items: [] } } }
//             )
//         })
        
//     }

//     getOrders(){
//         const db = getDb(); 
//         //find all orders that has same user id as THIS user id 
//         return db.collection('orders').find({'user._id': new ObjectId(this._id)}).toArray(); 
//     }

//     static findById(userId){
//         const db =getDb();
//         return db.collection('users').find({_id: new mongodb.ObjectId(userId)})
//         .next()
//         .then(user=>{
//             return user; 
//         })
//         .catch(err=>console.log(err)); 
//     }
// }

// module.exports= User; 