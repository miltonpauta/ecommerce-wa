const fs = require('fs');

const deleteFile = (filePath)=>{
    //deletes item at so and so path 
    fs.unlink(filePath, (err)=>{
        if(err){
            throw (err);
        }
    })
}

exports.deleteFile = deleteFile; 