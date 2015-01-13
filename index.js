var bencode = require('bencode');
var fs = require('fs');

function decode(fileName) {
  var information = bencode.decode(fs.readFileSync(fileName), 'utf8');
  return {
    announceList: information['announce-list'],
    info: information.info
  };
}

// return first http tracker
function findTracker(list) {
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (item[0].search(/^http/) === 0) {
      return item[0];
    }
  }
}

console.log(decode('./test.torrent'));
