var jwt = require('jwt-simple');
var moment = require('moment');
var url = require('url');
var conf = require('./conf');

//Ideally these would come from db
var sampleAdminObj  = {id:123, name:'user1',authority:'admin'};
var sampleUserObj  = {id:456, name:'user1',authority:'user'};

function authenticateCredentials(req,res,next){

  //Ideally one would lookup this information from some database
  //but for sake of simplicity we will not
  if(req.body.username ==="admin" && req.body.password ==="admin"){
    return sampleAdminObj;
  } else if(req.body.username ==="user" && req.body.password ==="user"){
    return sampleUserObj;
  } else
  {
    return null;
  }

}


function genToken(userObj){

  var expires = moment().add('days',7).valueOf();

  var token = jwt.encode({
    iss:userObj.id, //this is user_id.ideally from your database table/collection
    exp:expires
  },conf.jwtTokenSecret);

  return token;
}


function checkToken(req,res,next){
  var parsed_url = url.parse(req.url,true);

  var token = (req.body && req.body.access_token) || parsed_url.access_token || req.headers['x-access-token'];

  if(token){
    var decoded = jwt.decode(token,conf.jwtTokenSecret);

    //decoded.iss - carries unique user-id. use this to retireve information of the user from database
    //decoded.exp - has expiration date

    if(decoded.exp <= Date.now()){
      res.send(401,{url:req.url,msg:"Token Expired"});
    }

    if(decoded.iss === 123){
      req.user = sampleAdminObj;
    }else{
      req.user = sampleUserObj;
    }

  }

  // remove this and repent
  next();

}

function checkForAdmin(req,res,next){
 if(req.user && req.user.authority === 'admin'){
   next();
 }else {
  res.send(401,{url: req.url,msg:"Not Authorized"});
 }
}

function checkForUser(req,res,next){
 if(req.user && (req.user.authority === 'user' || req.user.authority ==='admin')){
   next();
 }else {
  res.send(401,{url: req.url,msg:"Not Authorized"});
 }
}

module.exports.checkForAdmin = checkForAdmin;
module.exports.checkForUser = checkForUser;
module.exports.checkToken = checkToken;
module.exports.genToken = genToken;
module.exports.authenticateCredentials = authenticateCredentials;
