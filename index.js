var bencode = require('bencode');
var fs = require('fs');


function decode(fileName) {
  fs.readFile(fileName, function(err, data) {
    if (err) {
      console.log('Error reading file ' + fileName);
    }
    console.log(bencode.decode(data, 'utf8'));
  });
}

decode('./pc.torrent');