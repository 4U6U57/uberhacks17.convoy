var express = require('express');
var Uber = require('node-uber');
var twilio = require('twilio');
var router = express.Router();
var geocode = require('./geocodeAddress.js');
var randomWords = require('random-words');

router.get('/api/login', function(request, response) {
    var url = uber.getAuthorizeUrl(['history', 'profile', 'request',
        'places'
    ]);
    response.redirect(url);
});

router.get('/api/callback', function(request, response) {
    var curNumber = numbers[request.query.phone];
    curNumber.uber.authorization({
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
            requestUber(curNumber, access_token, refresh_token);
            response.send("OK");
        }
    });
});

var requestUber = function(curNumber, type, access_token, refresh_token) {
    var currentConvery = convoys[curNumber.convoyId];

}

// Data structures
var numbers = {};
var convoys = {};

// Constructors for data structure items
function number(digits) {
    this.state = "new_user";
    this.convoyId = null;
    this.uber = new Uber({
        client_id: '***REMOVED***',
        client_secret: '***REMOVED***',
        server_token: '***REMOVED***',
        redirect_uri: 'https://087af77a.ngrok.io/api/callback' +
            '?phone=' + encodeURIComponent(digits),
        name: 'Convoy',
        language: 'en_US', // optional, defaults to en_US
        sandbox: true // optional, defaults to false
    });
    this.url = this.uber.getAuthorizeUrl(['request']);

}

function convoy(commander) {
    this.commander = commander;
    this.open = true;
    this.members = [];
    this.cars = {};
    this.src = {};
    this.dest = {};
}

function car(captain) {
    this.captain = captain;
    this.riders = [];
    this.type = null;
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
    var digits = req.body.From;
    var msg = req.body.Body;
    //var digits = "911";
    //var msg = "convoy to SF State from Uber HQ";
    console.log("GET " + digits + " " + msg);
    if (numbers[digits] == null) numbers[digits] = new number(digits);
    var user = numbers[digits];
    loop: while (true) {
        console.log("user.state: " + user.state);
        switch (user.state) {
            case "new_user":
                switch (stringGetWord(msg, 0)) {
                    case "convoy":
                        user.state = "convoy_init";
                        break;
                    case "join":
                        user.state = "convoy_join";
                        break;
                    default:
                        reply(res, "Command not recognized");
                        break loop;
                }
                break;
            case "convoy_init":
                var parsed = parseConvoy(msg.toLowerCase().split(" "));
                if (parsed.start != null && parsed.end != null) {
                    if (user.convoyId == null) {
                        console.log("creating new convoy");
                        var id;
                        do {
                            id = randomWords();
                            console.log("trying " + id);
                        } while (convoys[id] != null);
                        console.log("created convoy " + id);
                        convoys[id] = new convoy(digits);
                        var group = convoys[id];
                        group.commander = digits;
                        group.members.push(digits);
                        user.state = "convoy_wait";
                        user.convoyId = id;
                        geocode.geocodeAddress(parsed.start, (
                            errorMessage, results) => {
                            if (errorMessage) {
                                console.log(errorMessage);
                                convoys[user.convoyId] = null;
                                numbers[digits] = null;
                            } else {
                                var group = convoys[user.convoyId];
                                group.src = results;
                                geocode.geocodeAddress(parsed.end,
                                    (errorMessage, results) => {
                                        if (errorMessage) {
                                            console.log(errorMessage);
                                            convoys[user.convoyId] = null;
                                            numbers[digits] = null;
                                        } else {
                                            group.dest = results;
                                            reply(res,
                                                "Created convoy from " +
                                                group.src.address +
                                                " to " +
                                                group.dest.address +
                                                ". Tell your friends to send us 'join " +
                                                user.convoyId +
                                                "', and send 'done' to start."
                                            );
                                        }
                                    }
                                );
                            }
                        });
                    }
                } else {
                    reply(res,
                        "Invalid convoy syntax. Use 'convoy from SOURCE to DEST'");
                }
                break loop;
            case "convoy_join":
                var id = stringGetWord(msg, 1);
                console.log("requested to join " + id);
                var group = convoys[id];
                if (group == null) {
                    reply(res, "'" + id + "' is not a valid convoy. :(");
                    user.state = "new_user";
                } else if (!group.open) {
                    reply(res, "'" + id + "' is no longer open. ;_;");
                    user.state = "new_user";
                } else {
                    group.members.push(digits);
                    user.convoyId = id;
                    user.state = "user_wait";
                    send(group.commander, digits + " has joined your convoy.");
                    reply(res, "You've joined " + group.commander +
                        "'s convoy! Get ready to go from " + group.src.address +
                        " to " +
                        group.dest.address + ".");
                }
                break loop;
            case "user_wait":
                reply(res, "user_wait not yet configured");
                break loop;
            case "convoy_wait":
                var group = convoys[user.convoyId];
                switch (msg.toLowerCase()) {
                    case 'done':
                        group.open = false;
                        user.state = "uber";
                        reply(res, "Closing convoy. There are " + group.members.length +
                            " members: " + group.members);
                        break;
                    case 'kill':
                        group.open = false;
                        numbers[digits] = new number();
                        break;
                    default:
                        reply(res, "Tell others to msg '" + user.convoyId +
                            "' to join. Msg 'done' to close the convoy. Msg 'kill' to cancel.");
                        break;
                }
                break loop;
            case "uber":
                reply(res, "uber not yet configured");
                break loop;
            default:
                reply(res, "Congrats! You broke Convoy. Have a cookie.");
                break loop;
        }
    }
});

// Put abstracted functions here
var getConvoyStuff = function(convoy) {};

// Put helper functions here
var getOptCode = function(msg) {

    var optCode;

    switch (msg) {
        case "convoy", "to":
            optCode = 1;
            break;
        case "from":
            optCode = 2;
            break;
        case "yes":
            optCode = 3;
            break;
        case "no":
            optCode = 4;
            break;
        case "done":
            optCode = 5;
            break;
        default:
            {
                optCode = -1;
                break;
            }
    }

    return optCode;
};


var parseConvoy = function(tokenizeResponse) {
    var destination = "";
    var starting = "";
    var trigger = -1;

    for (var i = 0; i < tokenizeResponse.length; i++) {

        if (tokenizeResponse[i] === "from") {
            i++;
            trigger = 1;
        } else if (tokenizeResponse[i] === "to") {
            i++;
            trigger = 0;
        }
        if (trigger === 0) {
            destination += tokenizeResponse[i] + " ";
        } else if (trigger === 1) {
            starting += tokenizeResponse[i] + " ";;
        }
    }

    var convoy = {
        start: starting,
        end: destination
    }

    if (trigger === -1) {
        console.log("Could not find 'from' or 'convoy to'");
    } else {
        return convoy;
    }
};

var stringGetWord = function(str, i) {
    return str.split(" ")[i].toLowerCase();
};
var reply = function(res, msg) {
    var twilio = require('twilio');
    var twiml = new twilio.TwimlResponse();
    twiml.message(msg);
    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
}

var send = function(number, msg) {
    var accountSid = '***REMOVED***';
    var authToken = '***REMOVED***';

    var twilio = require('twilio');
    var client = new twilio.RestClient(accountSid, authToken);

    client.messages.create({
        body: msg,
        to: number, // Text this number
        from: '+15042266869' // From a valid Twilio number
    }, function(err, message) {
        console.log(message.sid);
    });

}

var cheapestCombination = function(numRiders) {

    var uberReservations = {
        xlReserves: 0,
        xReserves: 0
    };

    if (numRiders > carCapacity("X")) {
        while (numRiders > carCapacity("X")) {
            numRiders -= carCapacity("XL");
            uberReservations.xlReserves += 1;
        }
    } else {
        while (numRiders >= 0) {
            numRiders -= carCapacity("X");
            uberReservations.xReserves += 1;
        }
    }

    if (numRiders > carCapacity("X")) {
        numRiders -= carCapacity("XL");
        uberReservations.xlReserves += 1;
    } else if (numRiders >= 1) {
        numRiders -= carCapacity("X");
        uberReservations.xReserves += 1;
    }

    return uberReservations;
}

var carCapacity = function(car) {
    if (car === "XL") {
        return 7;
    } else if (car === "X") {
        return 4;
    }
    return -1;
}



module.exports = router;
