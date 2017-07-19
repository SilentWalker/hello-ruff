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
    printLCD(9, 1, ' Online', function (err) {
      if (err) {
        console.log(err);
        return;
      }
    });
  })
  client.on('close', function () {
    console.log('client disconnected!');
    isConnected = false;
    if(!offlinePrinted){
      offlinePrinted = true;
      printLCD(9, 1, 'Offline', function (err) {
        if (err) {
          console.log(err);
          return;
        }
      });
    }
  })
  client.on('error', function (err) {
    console.log(err);
    isConnected = false;
  })
  client.on('message', function (topic, message) {
    message = message.toString();
    console.log('topic : ' + topic + ', message : ' + message);
    switch (message) {
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
    }
  })
  $('#lcd').turnOn(function (err, rs) {
    getEnv(client);
    setInterval(function () {
      getEnv(client);
    }, 30 * 1000)
  })
  $('#irr').on('data', function (data) {
    infraredSignal = data;
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
    printLCD(0, 0, 'Temp ' + temp.toString(), function (err) {
      if (err) {
        console.log(err);
        return;
      } else {
        if (Number(temp) > 28) {
          printLCD(11, 0, '>.<', function (err) {
            if (err) {
              console.log(err);
            }
          })
        }else if(Number(temp) > 16){
          printLCD(11, 0, '0w0', function (err) {
            if (err) {
              console.log(err);
            }
          })
        }else{
          printLCD(11, 0, '-.-', function (err) {
            if (err) {
              console.log(err);
            }
          })
        }
      }
    });
  })
  $('#dht').getRelativeHumidity(function (err, humi) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Humidity is ' + humi);
    if (isConnected) client.publish('humi', humi.toString());
    printLCD(0, 1, 'Humi ' + humi.toString(), function (err) {
      if (err) {
        console.log(err);
        return;
      }
    });
  })
}

function printLCD(x, y, text, cb) {
  $('#lcd').setCursor(x, y, function (err, rs) {
    if (err) {
      console.log(err)
      cb(err)
    } else {
      $('#lcd').print(text, function (err, rs) {
        if (err) {
          console.log(err)
          cb(err);
        } else {
          cb(null)
        }
      })
    }
  })
}
