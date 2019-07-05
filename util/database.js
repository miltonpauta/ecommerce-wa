const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient; 

let _db; 

//connecting and storing connection to database (this will keep on running)
const mongoConnect = (callback)=>{
    MongoClient.connect('mongodb+srv://miltonpauta:Mpauta2030@cluster0-doc4o.mongodb.net/shop?retryWrites=true&w=majority', {useNewUrlParser: true}) 
    .then(client=> {     
        console.log('Connected'); 
        _db = client.db(); //stores access to database 
        callback();  
    })
    .catch(err=> {
        console.log(err); 
        throw err; 
    }); 
}

//return access to that database
const getDb=()=>{
    if(_db){
        return _db;
    }
    throw 'No database found!'; 
}

exports.mongoConnect = mongoConnect; 
exports.getDb = getDb; 