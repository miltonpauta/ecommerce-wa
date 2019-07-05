// this code will NOT run on the server but on the client 
//hence, PUBLIC folder 
//THIS IS AN ASYNCHRONOUS REQUEST! 

const deleteProduct = btn =>{
    //extract values from inputs! 
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf').value;

    // <article> element we want to delete
    const productElement = btn.closest('article'); 

    //send http delete request to server, which deletes product on db, image on server storage, etc! 
    fetch('/admin/product/' + prodId,{
        method: 'DELETE',
        headers: {
            //csrf tokens can also be passed thru headers and query params!
            'csrf-token': csrf
        }
    })
    .then(result=>{
        return result.json(); 
    })
    .then(data=>{
        //now, delete it on DOM (on the view page!)
        console.log(data); 
        productElement.parentNode.removeChild(productElement); //this code/functions work on browser 
    })
    .catch(err=>{
        console.log(result)
    })
}

//this approach updates page when deleting product instead of reloading with POST requests 