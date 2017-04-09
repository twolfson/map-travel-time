// Load in our dependencies
var fs = require('fs');
var protobuf = require('protobufjs');

// Register and export our Protobuf types
// https://github.com/dcodeIO/protobuf.js/blob/6.7.3/examples/custom-get-set.js#L7-L12
var indexProtoStr = fs.readFileSync(__dirname + '/index.proto', 'utf8');
var indexProto = protobuf.parse(indexProtoStr, {keepCase: true});
module.exports = indexProto.root;
