var bencode = require('bencode');
var fs = require('fs');
var crypto = require('crypto');
var qs = require('querystring');
var request = require('request');
var net = require('net');

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

  var sha1Hash = sha1(bencode.encode(info));
  // var urlEncodedHash = urlEncodeHex(sha1Hash);

  var params = {
    info_hash: sha1Hash,
    peer_id: encodeURI(makePeerId()),
    port: 6881,
    uploaded: 0,
    downloaded: 0,
    left: decode('linux.torrent').info.length,
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

function getPeers(info) {
  var decoded = bencode.decode(info);
  var peersBuf = decoded.peers;
  var peersLen = peersBuf.length;
  var peersArr = [];
  for (var i = 0; i < peersLen; i += 6) {
    var ip = [peersBuf.readUInt8(i), peersBuf.readUInt8(i + 1), peersBuf.readUInt8(i + 2), peersBuf.readUInt8(i + 3)].join('.');
    var port = peersBuf.readUInt16BE(i + 4);
    peersArr.push({ip: ip, port: port});
  }
  return peersArr;
}

function connectPeers(info) {
  var peersArr = getPeers(info);
  var peer = peersArr[0];
  var client = net.connect({
    port: peer.port, host: peer.ip
  }, function() {
    console.log('connected to server!');
    var pstrlen = new Buffer([19]);
    var pstr = new Buffer('BitTorrent protocol');
    var reserved = new Buffer([0, 0, 0, 0, 0, 0, 0, 0]);
    var info_hash = getRequestParams(info).info_hash;
    var peer_id = makePeerId();
    var handShake = Buffer.concat([pstrlen, pstr, reserved, info_hash, peer_id]);
    console.log(handShake);
    client.write(handShake);
  });
  client.on('error', function(error) {
    console.log('ERROR');
    console.log(error);
  });
  client.on('timeout', function() {
    console.log('timeout');
  });
  client.on('data', function(data) {
    console.log(data.toString());
    client.end();
  });
  client.on('end', function() {
    console.log('disconnected from server');
  });
}

var decodedInfo = decode('linux.torrent');
var info = decodedInfo.info;
var trackerUrl = findTracker(decodedInfo);

// var url = trackerUrl + '?' + qs.stringify(getRequestParams(info));
var url = trackerUrl +
                       // '?info_hash=' + '%9a%dc%97T%22%0c%b9%cd%7d%3c4%8d%0b%bf%ae%7b%2c%e8%fc%84' +
                       '?info_hash=' + urlEncodeHex(getRequestParams(info).info_hash.toString('hex')) +
                       '&peer_id=' + '-UM1860-A%8e%8b%06%a02%1e%40%25%5b%e0P' +
                       // '&peer_id=' + encodeURI(makePeerId()) +
                       '&port=' + '6881' +
                       '&uploaded=0' + 
                       '&downloaded=1' +
                       // '&left=99' +
                       '&left=' + decode('linux.torrent').info.length +
                       '&compact=1' +
                       '&no_peer_id=1' +
                       '&event=' + 'started';

request({
  url: url,
  encoding: null
  }, function (error, response, body) {
  // console.log(' # # # # # # # # # # # # # # # # # # # # # # # # REQUEST')
  // console.log(' >>>>> URL');
  // console.log(url);
  // console.log('>>> ERROR:');
  // console.log(error);
  // console.log('>>> RESPONSE:');
  // console.log(response.statusCode);
  // console.log('>>> BODY:');
  // console.log(bencode.decode(body));
  connectPeers(body);
});
