// Copyright 2016 Justin Richards <ratmandu@gmail.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

module.exports = function(RED) {
  function zbLightNode(config) {
    RED.nodes.createNode(this, config);
    this.bulbtype = config.bulbtype;
    this.topic = config.topic;
    
    var endpoint = 0x00;
    if (this.bulbtype.toLowerCase() == "ge") {
      endpoint = 0x01;
    } else if (this.bulbtype.toLowerCase() == "cree") {
      endpoint = 0x0A;
    } else if (this.bulbtype.toLowerCase() == "hue") {
      endpoint = 0x0B;
    } else if (this.bulbtype.toLowerCase() == "lightify") {
      endpoint = 0x03;
    }

    var xbeeapi = require('xbee-api');
    var xbee = new xbeeapi.XBeeAPI();
    var node = this;

    this.on('input', function(msg) {

      var outputCluster = 0x0000;
      var lightPayload = 0;
      
      // Make sure the topic isn't undefined.
      if (typeof msg.topic != "undefined") {
        // If the topic is empty...
        if (msg.topic !== "") {
          // Use topic from message.
          this.topic = msg.topic;
        }
      }
      
      // Make sure the bulb type isn't undefined.
      if (typeof msg.bulbtype != "undefined") {
        // If the bulb type is empty...
        if (msg.bulbtype !== "") {
          // Get the bulb type from the message.
          this.bulbtype = msg.bulbtype;
        }
      }
      
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
        lightPayload = [0x01, 0x00, 0x04, msg.payload, 0x10, 0x00, 0x10];
        outputCluster = 0x0008;
      } else if ((msg.payload >= 2700) && (msg.payload <= 6500)) {
        var temp = (1000000/msg.payload);
        var tmpArray = new Uint16Array(1);
        tmpArray[0] = temp;
        tmpArray = new Uint8Array(tmpArray.buffer);
        lightPayload = [0x01, 0x00, 0x0A, tmpArray[0], tmpArray[1], 0x10, 0x00, 0x10];
        outputCluster = 0x0300;
      } else if (msg.payload.toString().includes(",")) {
        var values = msg.payload.split(",");
        var hue = parseInt(values[0]);
        var sat = parseInt(values[1]);
        lightPayload = [0x01, 0x00, 0x06, hue, sat, 0x10, 0x00, 0x10];
        outputCluster = 0x0300;
      }

      var frame_obj = {
        type: 0x11,
        id: 0x01,
        destination64: this.topic,
        destination16: "fffe",
        sourceEndpoint: 0xE8,
        destinationEndpoint: endpoint,
        clusterId: outputCluster,
        profileId: 0x0104,
        broadcastRadius: 0x00,
        options: 0x00,
        data: lightPayload
      };
      msg.payload = xbee.buildFrame(frame_obj);
      node.send(msg);
    });
  }
  RED.nodes.registerType("zblight", zbLightNode);
}
