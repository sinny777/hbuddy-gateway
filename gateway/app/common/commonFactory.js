
var exec = require("child_process").exec,
fs = require('fs'),
gatewayHandler,
commonHandler,
localDBHandler,
cloudantHandler,
sceneHandler,
scheduleHandler,
radioHandler,
conversationHandler,
scheduleHandler,
ibmIoTHandler,
objectStorageHandler,
sensorsHandler,
sensortagHandler,
serialportHandler,
gpioHandler,
speechHandler,
bluetoothHandler,
appConfig;

module.exports = function() {

var methods = {};

  methods.setAppConfig = function(config){
    appConfig = config;
    if(!appConfig.GATEWAY_CONFIG){
      let rawData = fs.readFileSync('./config/default.json');
      appConfig.GATEWAY_CONFIG = JSON.parse(rawData);      
    }
    if(!appConfig.GATEWAY_CONFIG.BROADCAST_TYPE){
    	appConfig.GATEWAY_CONFIG.BROADCAST_TYPE = "LORA";
    }    
    console.log("\n\n<<<<<<< GATEWAY CONFIGURATION SET >>>>>>>>>> ");
    console.log(appConfig);
  }

  methods.getGatewayConfig = function(){ 
    if(appConfig && appConfig.GATEWAY_CONFIG){
    	if(!appConfig.GATEWAY_CONFIG.BROADCAST_TYPE){
        	appConfig.GATEWAY_CONFIG.BROADCAST_TYPE = "LORA";
        }       
      return appConfig.GATEWAY_CONFIG;
    }
    return null;
  }

  methods.CommonHandler = function(){
    if(!commonHandler){
      commonHandler = require('../handlers/commonHandler')();
    }
    return commonHandler;
  }

  methods.GatewayHandler = function(){
    if(!gatewayHandler){
      gatewayHandler = require('../handlers/gatewayHandler')();
    }
    return gatewayHandler;
  }

  methods.IBMIoTHandler = function(){
    if(!ibmIoTHandler){
      ibmIoTHandler = require('../handlers/ibmiotHandler')();
    }
    return ibmIoTHandler;
  }

  methods.ConversationHandler = function(){
    if(!conversationHandler){
      conversationHandler = require('../handlers/conversationHandler')();
    }
    return conversationHandler;
  }

  methods.ScheduleHandler = function(){
    if(!scheduleHandler){
      scheduleHandler = require('../handlers/scheduleHandler')();
    }
    return scheduleHandler;
  }

  methods.ObjectStorageHandler = function(){
    if(!objectStorageHandler){
      objectStorageHandler = require('../handlers/objectStorageHandler')();
    }
    return objectStorageHandler;
  }

  methods.LocalDBHandler = function(){
    if(!localDBHandler){
      localDBHandler = require('../handlers/localDBHandler')();
    }
    return localDBHandler;
  }

  methods.CloudantHandler = function(){
    if(!cloudantHandler){
      cloudantHandler = require('../handlers/cloudantHandler')();
    }
    return cloudantHandler;
  }

  methods.SceneHandler = function(){
    if(!sceneHandler){
      sceneHandler = require('../handlers/sceneHandler')();
    }
    return sceneHandler;
  }

  methods.ScheduleHandler = function(){
    if(!scheduleHandler){
      scheduleHandler = require('../handlers/scheduleHandler')();
    }
    return scheduleHandler;
  }

  methods.RadioHandler = function(){
    if(process.platform != 'darwin' && !radioHandler){
      radioHandler = require('../handlers/radioHandler')();
    }
    return radioHandler;
  }
  
  methods.SerialportHandler = function(){
	    if(process.platform != 'darwin' && !radioHandler){
	    	serialportHandler = require('../handlers/serialportHandler')();
	    }
	    return serialportHandler;
	  }

  methods.SpeechHandler = function(){
    if(process.platform != 'darwin' && !speechHandler){
      speechHandler = require('../handlers/speechHandler')();
    }
    return speechHandler;
  }

  methods.GpioHandler = function(){
    if(process.platform != 'darwin' && !gpioHandler){
      gpioHandler = require('../handlers/gpioHandler')();
    }
    return gpioHandler;
  }

  methods.BluetoothHandler = function(){
    if(process.platform != 'darwin' && !bluetoothHandler){
      bluetoothHandler = require('../handlers/bluetoothHandler')();
    }
    return bluetoothHandler;
  }

  methods.SensorsHandler = function(){
    if(process.platform != 'darwin' && !sensorsHandler){
      sensorsHandler = require('../handlers/sensorsHandler')();
    }
    return sensorsHandler;
  }

  methods.SensorTagHandler = function(){
    if(process.platform != 'darwin' && !sensortagHandler){
      sensortagHandler = require('../handlers/sensortagHandler')();
    }
    return sensortagHandler;
  }

	return methods;

}
