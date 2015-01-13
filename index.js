var bencode = require('bencode');
var fs = require('fs');

var info;
var announceList;
var tracker;


function decode(fileName) {
  fs.readFile(fileName, function(err, data) {
    if (err) {
      console.log('Error reading file ' + fileName);
    }
    var information = bencode.decode(data, 'utf8');
    announceList = information['announce-list'];
    info = information.info;
    console.log(findTracker(announceList));
  });
}

// return first http tracker
function findTracker(list) {
  for (var i = 0; i < list.length; i++) {
    var tracker = list[i];
    if (tracker[0].search(/^http/) === 0) {
      return tracker[0];
    }
  }
}

decode('./test.torrent');
