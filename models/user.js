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




