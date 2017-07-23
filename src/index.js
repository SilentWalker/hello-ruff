'use strict';
var mqtt = require('mqtt');
var isConnected = false;
var _clientId = 'ruff01';
var infraredSignal = null;
var offlinePrinted = false;
var privateConfig = require('./config.js')
$.ready(function (error) {
  if (error) {
    console.log(error);
    return;
  }
  var client = mqtt.connect(privateConfig.serverUrl, {
    username: privateConfig.username,
    password: new Buffer(privateConfig.password),
    clientId: _clientId,
    keepalive: 30,
    port: 2345
  });
  client.on('connect', function () {
    console.log('connect to mqtt server success!');
    isConnected = true;
    client.subscribe(_clientId, { qos: 2 }, function (err, rs) {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log(rs);
      }
    })
    offlinePrinted = false;
    printLCD(85, 1, ' Online', true);
  })
  client.on('close', function () {
    console.log('client disconnected!');
    isConnected = false;
    if(!offlinePrinted){
      offlinePrinted = true;
      printLCD(85, 1, 'Offline', true);
    }
  })
  client.on('error', function (err) {
    console.log(err);
    isConnected = false;
  })
  client.on('message', function (topic, message) {
    message = message.toString();
    console.log('topic : ' + topic + ', message : ' + message);
    message = message.split('|');
    switch (message[0]) {
      case 'sendIS':
        if (infraredSignal) {
          $('#irt').send(infraredSignal, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('infraredSignal sent');
            }
          })
        } else {
          console.log('infraredSignal not record yet');
        }
      break;
      case 'lcdMsg':
        printLCD(Number(message[1]), Number(message[2]), message[3].toString(), true);
      break;
      case 'ledMsg':
        lightUp(message[1], message[2], message[3]);
      break;
      case 'soundEnable' : 
        $('#sound').enable();
      break;
      case 'soundDisable' : 
        $('#sound').disable();
      break;
    }
  })
  getEnv(client);
  setInterval(function () {
    getEnv(client);
  }, 30 * 1000)
  $('#irr').on('data', function (data) {
    infraredSignal = data;
  })
  $('#sound').on('sound', function (){
    console.log('sound detected')
    client.publish('sound');
  })
});

function getEnv(client) {
  $('#dht').getTemperature(function (err, temp) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Temperature is ' + temp)
    if (isConnected) client.publish('temp', temp.toString());
    printLCD(0, 0, 'Temp : ' + temp.toString(), true);
    if (Number(temp) > 28) {
      printLCD(110, 0, '>.<', true)
    }else if(Number(temp) > 16){
      printLCD(110, 0, '0w0', true)
    }else{
      printLCD(110, 0, '-.-', true)
    }

  })
  $('#dht').getRelativeHumidity(function (err, humi) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Humidity is ' + humi);
    if (isConnected) client.publish('humi', humi.toString());
    printLCD(0, 1, 'Humi : ' + humi.toString(), true);
  })
}

function printLCD(x, y, text, isLittleChar) {
  try{
    $('#lcd').print(x, y, text, isLittleChar);
  }catch(err){
    console.log(err);
  }
}

function lightUp(r,g,b){
  try{
    $('#led').setRGB([r,g,b]);
  }catch(err){
    console.log(err);
  }
  
}

