module.exports = function(RED) {
  function zbLightNode(config) {
    RED.nodes.createNode(this, config);
    this.mac = config.mac;
    this.bulbtype = config.bulbtype;

    var endpoint = 0x00;
    if (this.bulbtype.toLowerCase() == "ge") {
      endpoint = 0x01;
    } else if (this.bulbtype.toLowerCase() == "cree") {
      endpoint = 0x0A;
    } else if (this.bulbtype.toLowerCase() == "hue") {
      endpoint = 0x0B;
    }

    var xbeeapi = require('xbee-api');
    var xbee = new xbeeapi.XBeeAPI();
    var node = this;

    this.on('input', function(msg) {

      var outputCluster = 0x0000;
      var lightPayload = 0;

      if (msg.payload.toString().toLowerCase() == "on") {
        lightPayload = [ 0x01, 0x00, 0x01, 0x00, 0x10];
        outputCluster = 0x0006;
      } else if (msg.payload.toString().toLowerCase() == "off") {
        lightPayload = [ 0x01, 0x00, 0x00, 0x00, 0x10];
        outputCluster = 0x0006;
      } else if (msg.payload.toString().toLowerCase() == "toggle") {
        lightPayload = [0x01, 0x00, 0x02, 0x00, 0x10];
        outputCluster = 0x0006;
      } else if ((msg.payload >= 0) && (msg.payload <= 255)) {
        lightPayload = [0x01, 0x00, 0x04, msg.payload, 0x00, 0x00, 0x00, 0x10];
        outputCluster = 0x0008;
      }

      var frame_obj = {
        type: 0x11,
        id: 0x01,
        destination64: this.mac,
        destination16: "fffe",
        sourceEndpoint: 0xE8,
        destinationEndpoint: endpoint,
        clusterId: outputCluster,
        profileId: 0x0104,
        broadcastRadius: 0x00,
        options: 0x00,
        data: lightPayload
      }
      msg.payload = xbee.buildFrame(frame_obj);
      node.log(frame_obj);
      node.send(msg);
    });
  }
  RED.nodes.registerType("zblight", zbLightNode);
}
