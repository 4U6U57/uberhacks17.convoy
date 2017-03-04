var express = require('express');
var Uber = require('node-uber');
var twilio = require('twilio');
var router = express.Router();
var geocode = require('./geocodeAddress.js');
var randomWords = require('random-words');

router.get('/api/login', function(request, response) {
    var url = uber.getAuthorizeUrl(['profile', 'request']);
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
            console.log(access_token);
            console.log(refresh_token);
            var group = convoys[curNumber.convoyId];
            group.unconfirmed--;
            if (group.unconfirmed == 0) {
                console.log("CALL ZEEEE UBERZZ");
                requestUbers(convoys[curNumber.convoyId], access_token,
                    refresh_token);
            }
            response.send("OK");
        }
    });
});

router.post('/api/status', function(req, res) {
    console.log(req.body);
    var status = req.body.meta.status;
    var uuid = req.body.meta.user_id;
    var captain = null;
    for (number in numbers)
        if (numbers[number].uuid === uuid)
            captain = number;
    if (captain !== null) {
        var group = convoys[numbers[captain].convoyId];
        var car = null;
        for (psy of group.cars)
            if (psy.captain === captain)
                car = psy;
        var count = 1;
        for (rider of car.riders) count++;
        for (rider of car.riders)
            switch (req.body.meta.status) {
                case "accepted":
                    send(rider, "You are riding with " + number[captain].name);
                    break;
                case "arriving":
                    send(rider, "Your Uber is here.");
                    break;
                case "in_progress":
                    spend(rider, "You owe " + number[captain].name + " $" + (car.cost / count) + ".");
                    break;
                case "completed":
                    numbers[rider] = null;
                    break;
            }
        if (req.body.meta.status == "completed") numbers[captain] = null;
    }
    res.send("OK");
});

var requestUbers = function(convoy, access_token, refresh_token) {
    for (car of convoy.cars) {
        console.log("LOOPING CARS");
        console.log(car);
        console.log(numbers[car.captain]);
        var number = numbers[car.captain];
        number.uber.requests.getCurrent(function(err, res) {
            if (err) {
                console.log("===========NO CURRENT=========");
                console.log(err);
            } else {
                console.log("===========CURRENT=========");
                console.log(res);
            }
        });
        number.uber.user.getProfile(function(err, res) {
            if (err) {
                console.log("===========ERROR PROFILES=========");
                console.log(err);
            } else {
                console.log("===========SUCCESS PROFILES=========");
                console.log(res.uuid);
                number.name = res.first_name + " " + res.last_name;
                number.uuid = res.uuid;
                var options = {
                    "product_id": car.type,
                    "start_latitude": convoy.src.lat,
                    "start_longitude": convoy.src.lng,
                    "end_latitude": convoy.dest.lat,
                    "end_longitude": convoy.dest.lng
                };
                number.uber.requests.getEstimates(options, function(err, res) {
                    if (err) {
                        console.log("===========ERROR EST=========");
                        console.log(err);
                    } else {
                        console.log("===========SUCCESS EST=========");
                        car.cost = res.price.high_estimate;
                        console.log(car.cost);

                    }
                });
                number.uber.requests.create(options, function(err, res) {
                    if (err) {
                        console.log("===========ERROR CALL=========");
                        console.log(err);
                    } else {
                        console.log("===========SUCCESS CALL=========");
                        car.uber = res;
                        console.log(res);
                    }
                });
            }
        });
    }
}

var startAuth = function(convoy) {
    for (car of convoy.cars) {
        var number = numbers[car.captain];
        var message =
            "Congrats, you are the captain of your car! Please login here to confirm the ride: " +
            number.url;
        send(number.digits, message);
    }

}

// Data structures
var numbers = {};
var convoys = {};

// Constructors for data structure items
function number(digits) {
    this.state = "new_user";
    this.convoyId = null;
    this.digits = digits;
    this.uber = new Uber({
        client_id: '***REMOVED***',
        client_secret: '***REMOVED***',
        server_token: '***REMOVED***',
        redirect_uri: "https://b4c5b20e.ngrok.io/api/callback" +
            '?phone=' + encodeURIComponent(digits),
        name: 'Convoy',
        language: 'en_US', // optional, defaults to en_US
        sandbox: true // optional, defaults to false
    });
    this.uuid = null;
    this.name = "";
    this.url = this.uber.getAuthorizeUrl(['profile', 'request']);
    console.log(this.url);

}

function convoy(commander) {
    this.commander = commander;
    this.open = true;
    this.members = [];
    this.cars = [];
    this.src = {};
    this.dest = {};
    this.unconfirmed = 0;
}

function car(captain) {
    this.captain = captain;
    this.riders = [];
    this.type = null;
    this.uber = null;
    this.cost = 0;
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
        from: '+***REMOVED***' // From a valid Twilio number
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
                switch (stringGetWord(msg, 0).toLowerCase()) {
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
                        //user.state = "uber";
                        send(digits, "Starting convoy. There are " + group.members.length +
                            " members: " + group.members);
                        prepTrip(group);
                        break loop;
                    case 'kill':
                        group.open = false;
                        numbers[digits] = new number();
                        break loop;
                    default:
                        reply(res, "Tell others to msg '" + user.convoyId +
                            "' to join. Msg 'done' to close the convoy. Msg 'kill' to cancel."
                        );
                        break loop;
                }
                break;
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
    console.log("reply: " + msg);
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
    console.log("send: " + msg);

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
        return 6;
    } else if (car === "X") {
        return 4;
    }
    return -1;

}

var prepTrip = function(convoy) {
    var riderCount = convoy.members.length;

    var combination = cheapestCombination(riderCount);
    var numCars = combination.xlReserves + combination.xReserves;
    var numXL = combination.xlReserves;
    var numX = combination.xReserves;
    var riderIndex = 0;
    var carIndex = 0;
    var xlCode = "821415d8-3bd5-4e27-9604-194e4359a449";
    var xCode = "a1111c8c-c720-46c3-8534-2fcdd730040d";
    var captainList = selectCaptains(convoy, numCars);


    var captainIterator = 0;

    for (var i = 0; i < combination.xlReserves; i++) {
        var curcar = new car(captainList[captainIterator]);
        captainIterator++;
        curcar.type = xlCode;
        convoy.cars.push(curcar);
    }

    for (var i = 0; i < combination.xReserves; i++) {
        var curcar = new car(captainList[captainIterator]);
        captainIterator++;
        curcar.type = xCode;
        convoy.cars.push(curcar);

    }

    for (riderIndex = 0; riderIndex < riderCount && (numCars != 0); riderIndex++) {
        curcar = convoy.cars[carIndex];

        if (curcar.type === xlCode) {
            for (var j = 0; j < carCapacity("XL"); j++) {
                if (convoy.members[riderIndex] != undefined) {
                    curcar.riders.push(convoy.members[riderIndex]);
                }
                riderIndex++;
            }
            carIndex++;
        } else if (curcar.type === xCode) {
            for (var j = 0; j < carCapacity("X"); j++) {
                if (convoy.members[riderIndex] != undefined) {
                    curcar.riders.push(convoy.members[riderIndex]);
                }
                riderIndex++;
            }
            carIndex++;
        } else {
            console.log("SKIPPING IF STATEMENT");
        }
    }

    console.log(curcar);

    convoy.unconfirmed = captainList.length;
    startAuth(convoy);
}

var selectCaptains = function(convoy, numCars) {
    var currentMembers = convoy.members;
    var randomValue = -1;
    var captains = [];

    for (var i = 0; i < numCars; i++) {
        randomValue = Math.floor(Math.random() * currentMembers.length);
        console.log("RANDOM");
        console.log(randomValue);

        captains.push(currentMembers[randomValue]);
        currentMembers[randomValue] = undefined;
    }

    return captains;
}

function getRandomArbitrary(max) {
    return Math.random() * max;
}


module.exports = router;
