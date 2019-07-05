exports.get404 = (req, res, next) => { //happens if no routes user went to exists 
  res.status(404).render('404', { 
    pageTitle: 'Page Not Found', 
    path: '/404',
    isAuthenticated: req.session.isLoggedin  
  });
};

exports.get500 = (req,res,next)=>{ //server side errors
  res.status(500).render('500',{
    pageTitle: 'Server Issue',
    path: '/500',
    isAuthenticated: req.session.isLoggedin 
  })
}
