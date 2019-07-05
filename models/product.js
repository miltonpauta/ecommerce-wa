const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price:{
    type: Number,
    required: true,
  },
  description:{
    type: String,
    required: true
  },
  imageUrl: {
    type: String, 
    required: true
  },
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  } 
}); 

module.exports = mongoose.model('Product', productSchema); 





































// const mongodb = require('mongodb'); 
// const getDb = require('../util/database').getDb; //gets access to database so we can interact w it 

// const ObjectId = mongodb.ObjectId; 

// class Product {
//   constructor(title, price, description, imageUrl, id, userId){ 
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id): null; //do we create mongo id or no? 
//     this.userId = userId; 
//   }

//   save(){
    
//     const db = getDb();
//     let dbOp; //database operation

//     //if id is set (not Null), update product 
//     if(this._id){
//       dbOp = db.collection('products') 
//       .updateOne({_id:this._id}, {$set: this});       
//     }else{
//       dbOp = db.collection('products').insertOne(this); 
//     }

//     //collection = what collection we wanna work w
//     //return the collection so we can use it in render files 
//     return dbOp 
//       .then(result=>{
//       console.log(result); 
//       })
//       .catch(err=>console.log(err)); 
//   }

//   static fetchAll(){
//     const db = getDb();
//     return db.collection('products').find().toArray()
//     .then(products=>{
//       return products; //return array of products 
//     })
//     .catch(err=>console.log(err)); 
//     // .find() returns a cursor/handle to navigate thru all shit (FOR SIZE PURPOSES), not promises
//   }

//   static findById(prodId){
//     const db = getDb();
//     return db.collection('products').find({_id: new mongodb.ObjectId(prodId)}) //returns cursor, just do next()
//     .next()
//     .then(product=>{
//       return product; 
//     })
//     .catch(err=> console.log(err)); 
//   }

//   static deleteById(prodId){
//     const db = getDb();
//     return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)})
//     .then(result=>{
//       console.log('deleted') 
//     }) 
//     .catch(err=> console.log(err)); 
//   }
// }

// module.exports = Product; 
