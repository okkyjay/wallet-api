const jwt = require('jsonwebtoken');
function auth(req, res, next) {
  let publicURLS = [
    {url: '/api/auth/'}
  ]
  let isPublic = false;

  let result = {
    message: 'Please login to continue',
    status: false,
    data: {}
  }

  for(var i = 0; i < publicURLS.length; i++) {
    const {url} = publicURLS[i];
    if(req.url.includes(url)){
      isPublic = true;
      break;
    }
  }

  if(isPublic) {
    next();
    return;
  }

  const token = req.header('x-auth-token');
  if(!token) {
    return res.status(401).json(result);
  }

  try {
    let code = jwt.verify(token, 'secret-pass');
    req.loggedInUserEmail = code.email;
    next();
  } catch (exception) {
    res.status(403).json(result);
    return;
  }
}
module.exports = auth;
