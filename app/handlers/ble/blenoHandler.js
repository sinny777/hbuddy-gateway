
var HBuddyService = require('../../handlers/ble/hbuddyService');
var primaryService = new HBuddyService();

exports.advertise = function(gatewayInfo) {
	
	var uuid = "C7841029FE7C48948532F97908EF1AE4";
	
	if(gatewayInfo && gatewayInfo.gatewayId){
//		uuid = gatewayInfo.gatewayId; 
	}	 
    
	  var util = require('util');
	  var bleno = require('bleno');

	  var BlenoPrimaryService = bleno.PrimaryService;
	  var BlenoCharacteristic = bleno.Characteristic;
	  var BlenoDescriptor = bleno.Descriptor;

	  console.log('bleno for gatewayInfo: ', gatewayInfo);

	  /*
	  var StaticReadOnlyCharacteristic = function() {
	    StaticReadOnlyCharacteristic.super_.call(this, {
	      uuid: uuid,
	      properties: ['read'],
	      value: new Buffer('value'),
	      descriptors: [
	        new BlenoDescriptor({
	          uuid: uuid,
	          value: 'hBuddy Gateway'
	        })
	      ]
	    });
	  };
	  util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

	  var DynamicReadOnlyCharacteristic = function() {
	    DynamicReadOnlyCharacteristic.super_.call(this, {
	      uuid: "9A0F8BE0F89C48FEB11706A2EC7C3792",
	      properties: ['read']
	    });
	  };

	  util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

	  DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
	    var result = this.RESULT_SUCCESS;
	    var data = new Buffer('dynamic value');

	    if (offset > data.length) {
	      result = this.RESULT_INVALID_OFFSET;
	      data = null;
	    } else {
	      data = data.slice(offset);
	    }

	    callback(result, data);
	  };

	  
	  var LongDynamicReadOnlyCharacteristic = function() {
	    LongDynamicReadOnlyCharacteristic.super_.call(this, {
	      uuid: uuid,
	      properties: ['read']
	    });
	  };

	  util.inherits(LongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

	  LongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
	    var result = this.RESULT_SUCCESS;
	    var data = new Buffer(512);

	    for (var i = 0; i < data.length; i++) {
	      data[i] = i % 256;
	    }

	    if (offset > data.length) {
	      result = this.RESULT_INVALID_OFFSET;
	      data = null;
	    } else {
	      data = data.slice(offset);
	    }

	    callback(result, data);
	  };
	  
	  var NotifyOnlyCharacteristic = function() {
	    NotifyOnlyCharacteristic.super_.call(this, {
	      uuid: uuid,
	      properties: ['notify']
	    });
	  };

	  util.inherits(NotifyOnlyCharacteristic, BlenoCharacteristic);

	  NotifyOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
	    console.log('NotifyOnlyCharacteristic subscribe');

	    this.counter = 0;
	    this.changeInterval = setInterval(function() {
	      var data = new Buffer(4);
	      data.writeUInt32LE(this.counter, 0);

	      console.log('NotifyOnlyCharacteristic update value: ' + this.counter);
	      updateValueCallback(data);
	      this.counter++;
	    }.bind(this), 5000);
	  };

	  NotifyOnlyCharacteristic.prototype.onUnsubscribe = function() {
	    console.log('NotifyOnlyCharacteristic unsubscribe');

	    if (this.changeInterval) {
	      clearInterval(this.changeInterval);
	      this.changeInterval = null;
	    }
	  };

	  NotifyOnlyCharacteristic.prototype.onNotify = function() {
	    console.log('NotifyOnlyCharacteristic on notify');
	  };

	  var IndicateOnlyCharacteristic = function() {
	    IndicateOnlyCharacteristic.super_.call(this, {
	      uuid: uuid,
	      properties: ['indicate']
	    });
	  };

	  util.inherits(IndicateOnlyCharacteristic, BlenoCharacteristic);

	  IndicateOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
	    console.log('IndicateOnlyCharacteristic subscribe');

	    this.counter = 0;
	    this.changeInterval = setInterval(function() {
	      var data = new Buffer(4);
	      data.writeUInt32LE(this.counter, 0);

	      console.log('IndicateOnlyCharacteristic update value: ' + this.counter);
	      updateValueCallback(data);
	      this.counter++;
	    }.bind(this), 1000);
	  };

	  IndicateOnlyCharacteristic.prototype.onUnsubscribe = function() {
	    console.log('IndicateOnlyCharacteristic unsubscribe');

	    if (this.changeInterval) {
	      clearInterval(this.changeInterval);
	      this.changeInterval = null;
	    }
	  };

	  IndicateOnlyCharacteristic.prototype.onIndicate = function() {
	    console.log('IndicateOnlyCharacteristic on indicate');
	  };
	  
	  */

	  var WriteOnlyCharacteristic = function() {
	    WriteOnlyCharacteristic.super_.call(this, {
	      uuid: "9A0F8BE0F89C48FEB11706A2EC7C3792",
	      properties: ['write', 'writeWithoutResponse']
	    });
	  };

	  util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);

	  WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
	    console.log('WriteOnlyCharacteristic write request: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);

	    callback(this.RESULT_SUCCESS);
	  };

	  function SampleService() {
	    SampleService.super_.call(this, {
	      uuid: uuid,
	      characteristics: [
//	        new StaticReadOnlyCharacteristic(),
//	        new DynamicReadOnlyCharacteristic(),
//	        new LongDynamicReadOnlyCharacteristic(),
	        new WriteOnlyCharacteristic(),
//	        new NotifyOnlyCharacteristic(),
//	        new IndicateOnlyCharacteristic()
	      ]
	    });
	  }

	  util.inherits(SampleService, BlenoPrimaryService);

	  bleno.on('stateChange', function(state) {
	    console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

	    if (state === 'poweredOn') {
	      bleno.startAdvertising('hBuddy-gateway', [uuid]);
	    } else {
	      bleno.stopAdvertising();
	    }
	  });

	  // Linux only events /////////////////
	  bleno.on('accept', function(clientAddress) {
	    console.log('on -> accept, client: ' + clientAddress);
	    bleno.updateRssi();
	  });

	  bleno.on('disconnect', function(clientAddress) {
	    console.log('on -> disconnect, client: ' + clientAddress);
	  });

	  bleno.on('rssiUpdate', function(rssi) {
	    console.log('on -> rssiUpdate: ' + rssi);
	  });
	  //////////////////////////////////////

	  bleno.on('mtuChange', function(mtu) {
	    console.log('on -> mtuChange: ' + mtu);
	  });

	  bleno.on('advertisingStart', function(error) {
	    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
	    if (!error) {
	      bleno.setServices([
	        new SampleService()
	      ]);
	    }
	  });

	  bleno.on('advertisingStop', function() {
	    console.log('on -> advertisingStop');
	  });

	  bleno.on('servicesSet', function(error) {
	    console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
	  });
	  
    
}