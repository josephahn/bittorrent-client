var bencode = require('bencode');
var fs = require('fs');
var crypto = require('crypto');
var qs = require('querystring');
var request = require('request');

function decode(fileName) {
  var information = bencode.decode(fs.readFileSync(fileName));
  return {
    announce: information.announce,
    announceList: information['announce-list'],
    info: information.info
  };
}

// return first http tracker
function findTracker(info) {
  if (info.announce.toString('utf8').search(/^http/) === 0) {
    return info.announce.toString('utf8');
  }
  var list = info['announceList'];
  if (list) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (item[0].toString('utf8').search(/^http/) === 0) {
        return item[0].toString('utf8');
      }
    }
  }
}

function getRequestParams(info) {

  var sha1Hash = sha1(bencode.encode(info)).toString('hex');
  var urlEncodedHash = urlEncodeHex(sha1Hash);

  var params = {
    info_hash: urlEncodedHash,
    peer_id: encodeURI(makePeerId()),
    port: 6881,
    uploaded: 0,
    downloaded: 0,
    left: decode('test.torrent').info.length,
    compact: 1,
    event: 'started'
  };
  return params;
}

function sha1(data) {
  return crypto.createHash('sha1').update(data).digest();
}

function makePeerId() {
  var currentDate = (new Date()).valueOf().toString();
  var randomNum = Math.random().toString();
  return sha1(currentDate + randomNum);
}

function urlEncodeHex(str) {
  var result = '';
  for (var i = 0; i < str.length; i++) {
    if (i % 2 === 0) {
      result = result + '%' + str[i];
    } else {
      result += str[i];
    }
  }
  return result;
}



var decodedInfo = decode('test.torrent');
var info = decodedInfo.info;
var trackerUrl = findTracker(decodedInfo);

// var url = trackerUrl + '?' + qs.stringify(getRequestParams(info));
var url = trackerUrl +
                       // '?info_hash=' + '%9a%dc%97T%22%0c%b9%cd%7d%3c4%8d%0b%bf%ae%7b%2c%e8%fc%84' +
                       '?info_hash=' + getRequestParams(info).info_hash +
                       '&peer_id=' + '-UM1860-A%8e%8b%06%a02%1e%40%25%5b%e0P' +
                       // '&peer_id=' + encodeURI(makePeerId()) +
                       '&port=' + '6881' +
                       '&uploaded=0' + 
                       '&downloaded=0' +
                       '&left=' + decode('test.torrent').info.length +
                       '&compact=1' +
                       '&event=' + 'started';


request(url, function (error, response, body) {
  console.log(' # # # # # # # # # # # # # # # # # # # # # # # # REQUEST')
  console.log(' >>>>> URL');
  console.log(url);
  console.log('>>> ERROR:');
  console.log(error);
  console.log('>>> RESPONSE:');
  console.log(response.statusCode);
  console.log('>>> BODY:');
  console.log(body);
});
