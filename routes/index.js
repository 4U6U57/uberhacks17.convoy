var express = require('express');
var router = express.Router();

// Data structures
var numbers = {};
var convoys = {};

// Constructors for data structure items
function number() {
	this.state = "start";
	this.convoyId = null;
}
function convoy(commander) {
	this.commander = commander;
	this.members = [];
	this.cars = {};
	this.src = "";
	this.dest = "";
}
function car(captain) {
	this.captain = captain;
	this.riders = [];
	this.uber = null;
}

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'Express'
	});
});

router.post('/receive', function(req, res) {
	console.log(req.body);
	var twilio = require('twilio');
	var twiml = new twilio.TwimlResponse();
	twiml.message('The Robots are coming! Head for the hills!');
	res.writeHead(200, {
		'Content-Type': 'text/xml'
	});
	res.end(twiml.toString());
});

router.get('/send', function(req, res, next) {
	// Your Account SID from www.twilio.com/console
	var accountSid = '***REMOVED***';
	// Your Auth Token from www.twilio.com/console
	var authToken = '***REMOVED***';

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

router.post('/convoy', function(req, res) {
	var phone = req.body.From;
	var msg = req.body.Body;
	if(! numbers[phone]) numbers[phone] = new number();
	var user = numbers[phone];
	switch(user.state) {
		case "start":
			break;
		default:
			break;
	}
});

// Put abstracted functions here
var getConvoySrc = function(convoy) {};
var getConvoyDest = function(convoy) {};

// Put helper functions here
var getOptCode = function(msg) {};

module.exports = router;
