var express = require('express');
var Uber = require('node-uber');
var twilio = require('twilio');
var router = express.Router();
var uber = new Uber({
    client_id: '***REMOVED***',
    client_secret: '***REMOVED***',
    server_token: '***REMOVED***',
    redirect_uri: 'https://087af77a.ngrok.io/api/callback',
    name: 'Convoy',
    language: 'en_US', // optional, defaults to en_US
    sandbox: true // optional, defaults to false
});

router.get('/api/login', function(request, response) {
    var url = uber.getAuthorizeUrl(['history', 'profile', 'request', 'places']);
    response.redirect(url);
});

router.get('/api/callback', function(request, response) {
    uber.authorization({
        authorization_code: request.query.code
    }, function(err, access_token, refresh_token) {
        if (err) {
            console.error(err);
        } else {
            // store the user id and associated access token 
            // redirect the user back to your actual app 
            //response.redirect('/web/index.html');
            console.log(access_token);
            console.log(refresh_token);
            requestUber(access_token, refresh_token);
            response.redirect("google.com");
        }
    });
});

var requestUber = function(access_token, refresh_token) {
	console.log("Reqeust");
    /*uber.user.getProfile(function(err, res) {
        if (err) console.log(err);
        else console.log(res);
    });*/
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

router.post('/receive', function(req, res) {
    console.log(req.body);
    var twiml = new twilio.TwimlResponse();
    twiml.message('The Robots are coming! Head for the hills!');
    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
});

router.get('/send', function(req, res, next) {
    var accountSid = '***REMOVED***'; // Your Account SID from www.twilio.com/console
    var authToken = '***REMOVED***'; // Your Auth Token from www.twilio.com/console

    var twilio = require('twilio');
    var client = new twilio.RestClient(accountSid, authToken);

    client.messages.create({
        body: 'Hello from Node',
        to: '+***REMOVED***', // Text this number
        from: '+15042266869 ' // From a valid Twilio number
    }, function(err, message) {
        console.log(message.sid);
    });
});

module.exports = router;