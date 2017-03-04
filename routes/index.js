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
var getOptCode = function(msg) {
	var optCode;

	switch(msg){
		case "convoy" || "to":
			optCode 1;
			break;
		case "from":
			optCode: 2;
			break;
		case "yes":
			optCode: 3;
			break;
		case "no":
			optCode: 4;
			break;
		case "done":
			optCode: 5;
			break;
		default: {
			optCode: -1;
			break;
		}
	}

	return optCode;
};


var parseConvoy = function(tokenizeResponse) {
	var destination = "";
	var starting = "";
	var trigger = -1;

	for(var i = 0; i < tokenizeResponse.length; i++){

	  if(tokenizeResponse[i] === "from"){
	    i++;
	    trigger = 1;
	  } else if(tokenizeResponse[i] === "to"){
	    i++;
	    trigger = 0;
	  }
	  if(trigger === 0){
	    destination += tokenizeResponse[i] + " ";
	  } else if(trigger === 1){
	    starting += tokenizeResponse[i] + " ";;
	  }
	}

	var convoy = {
		start: starting,
		end: destination
	}

	if(trigger === -1){
		console.log("Could not find 'from' or 'convoy to'");
	} else{
		return convoy;
	}

};



// Get first word helper

module.exports = router;
