const request = require('request');
var geocodeAddress = (address, callback) => {
  var encodedAddress = encodeURIComponent(address);
  request({
    //325%20buckingham%20way%20san%20francisco
    url: 'http://maps.googleapis.com/maps/api/geocode/json?address=' + encodedAddress,
    json: true
  }, (error, response, body) => {
    // console.log(JSON.stringify(body, undefined, 2));
    if (error){
      callback('Unable to connect to google servers..')
    } else if (body.status === 'ZERO_RESULTS') {
      callback('Unable to find that address.');
    } else if(body.status === 'OK'){
      callback(undefined, {
        address: body.results[0].formatted_address,
        lat: body.results[0].geometry.location.lat,
        lng: body.results[0].geometry.location.lng
      });
    }
  });
};
module.exports.geocodeAddress = geocodeAddress;