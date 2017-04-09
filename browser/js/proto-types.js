// Load in our dependencies
var protobuf = require('protobufjs');

// Register and export our Protobuf types
var indexProto = protobuf.loadSync(__dirname + '/index.proto');
