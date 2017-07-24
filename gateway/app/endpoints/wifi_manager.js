var _       = require("underscore")._,
    async   = require("async"),
    fs      = require("fs"),
    exec    = require("child_process").exec,
    CONFIG = require('../config/config').get();
    
// Better template format
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate :   /\{\[([\s\S]+?)\]\}/g
};

// Helper function to write a given template to a file based on a given
// context
function write_template_to_file(template_path, file_name, context, callback) {
    async.waterfall([

        function read_template_file(next_step) {
            fs.readFile(template_path, 'utf-8', function (err, data) {
            	if(err){
            		console.log("Error In readFile: >> ", err);
            		console.log(process.cwd());
            	}
            	next_step(err, data);  
              });
        },

        function update_file(file_txt, next_step) {
            var template = _.template(file_txt);
            fs.writeFile(file_name, template(context), next_step);
            console.log('File Copied: ', file_name);
        }

    ], callback);
}

/*****************************************************************************\
    Return a set of functions which we can use to manage and check our wifi
    connection information
\*****************************************************************************/
module.exports = function() {
    // Detect which wifi driver we should use, the rtl871xdrv or the nl80211
    exec("iw list", function(error, stdout, stderr) {
        if (stderr.match(/^nl80211 not found/)) {
            CONFIG.wifi_driver_type = "rtl871xdrv";
        }
        // console.log("CONFIG.wifi_driver_type = " + CONFIG.wifi_driver_type);
    });

    // Hack: this just assumes that the outbound interface will be "wlan0"

    // Define some globals
    var ifconfig_fields = {
        "hw_addr":         /HWaddr\s([^\s]+)/,
        "inet_addr":       /inet addr:([^\s]+)/,
    },  iwconfig_fields = {
        "ap_addr":         /Access Point:\s([^\s]+)/,
        "ap_ssid":         /ESSID:\"([^\"]+)\"/,
        "unassociated":    /(unassociated)\s+Nick/,
    },  last_wifi_info = null;

    // Get generic info on an interface
    var _get_wifi_info = function(callback) {
        var output = {
            hw_addr:      "<unknown>",
            inet_addr:    "<unknown>",
            unassociated: "<unknown>",
        };

        // Inner function which runs a given command and sets a bunch
        // of fields
        function run_command_and_set_fields(cmd, fields, callback) {
            exec(cmd, function(error, stdout, stderr) {
                if (error) return callback(error);
                for (var key in fields) {
                    re = stdout.match(fields[key]);
                    if (re && re.length > 1) {
                        output[key] = re[1];
                    }
                }
                callback(null);
            });
        }

        // Run a bunch of commands and aggregate info
        async.series([
            function run_ifconfig(next_step) {
                run_command_and_set_fields("ifconfig wlan0", ifconfig_fields, next_step);
            },
            function run_iwconfig(next_step) {
                run_command_and_set_fields("iwconfig wlan0", iwconfig_fields, next_step);
            },
        ], function(error) {
            last_wifi_info = output;
            return callback(error, output);
        });
    },

    _reboot_wireless_network = function(wlan_iface, callback) {
        async.series([
            function down(next_step) {
                exec("sudo ifdown " + wlan_iface, function(error, stdout, stderr) {
                    if (!error) console.log("ifdown " + wlan_iface + " successful...");
                    next_step();
                });
            },
            function up(next_step) {
                exec("sudo ifup " + wlan_iface, function(error, stdout, stderr) {
                    if (!error) console.log("ifup " + wlan_iface + " successful...");
                    next_step();
                });
            },
        ], callback);
    },

    // Wifi related functions
    _is_wifi_enabled_sync = function(info) {
        // If we are not an AP, and we have a valid
        // inet_addr - wifi is enabled!
        if (null        == _is_ap_enabled_sync(info) &&
            "<unknown>" != info["inet_addr"]         &&
            "<unknown>" == info["unassociated"] ) {
            return info["inet_addr"];
        }
        return null;
    },

    _is_wifi_enabled = function(callback) {
        _get_wifi_info(function(error, info) {
            if (error) return callback(error, null);
            return callback(null, _is_wifi_enabled_sync(info));
        });
    },

    // Access Point related functions
    _is_ap_enabled_sync = function(info) {
        // If the hw_addr matches the ap_addr
        // and the ap_ssid matches "rpi-config-ap"
        // then we are in AP mode
        
    	var is_ap  = info["hw_addr"] && info["ap_addr"] &&
            info["hw_addr"].toLowerCase() == info["ap_addr"].toLowerCase() &&
            info["ap_ssid"] == CONFIG.access_point.ssid;
          
    	/*
        var is_ap = null;
        if(info["hw_addr"]){
        	if(info["ap_addr"]){
        		if(info["hw_addr"].toLowerCase() == info["ap_addr"].toLowerCase()){
        			if(info["ap_ssid"] == CONFIG.access_point.ssid){
        				is_ap = true;
        			}
        		}
        	}
        }else{
        	if(info["ap_addr"]){
        		if(info["ap_ssid"] == CONFIG.access_point.ssid){
    				is_ap = true;
    			}
        	}
        }
        */
    	console.log("\n\nis_ap: ", is_ap, ", hw_addr: ", info["hw_addr"], ", ap_addr: ", info["ap_addr"]);
    	
    	if(!info["ap_addr"]){
    		is_ap = null;
    	}
    	
        return (is_ap) ? info["hw_addr"].toLowerCase() : null;
    },

    _is_ap_enabled = function(callback) {
        _get_wifi_info(function(error, info) {
            if (error) return callback(error, null);
            return callback(null, _is_ap_enabled_sync(info));
        });
    },

    // Enables the accesspoint w/ bcast_ssid. This assumes that both
    // isc-dhcp-server and hostapd are installed using:
    // $sudo npm run-script provision
    _enable_ap_mode = function(bcast_ssid, callback) {
        _is_ap_enabled(function(error, result_addr) {
            if (error) {
                console.log("ERROR: " + error);
                return callback(error);
            }
            
            if (result_addr && !CONFIG.access_point.force_reconfigure) {
                console.log("\nAccess point is enabled with ADDR: " + result_addr);
                return callback(null);
            } else if (CONFIG.access_point.force_reconfigure) {
                console.log("\nForce reconfigure enabled - reset AP");
            } else {
                console.log("\nAP is not enabled yet... enabling...");
            }

            var context = CONFIG.access_point;
            context["enable_ap"] = true;
            context["wifi_driver_type"] = CONFIG.wifi_driver_type;
            
            // Here we need to actually follow the steps to enable the ap
            async.series([

                // Enable the access point ip and netmask + static
                // DHCP for the wlan0 interface
                function update_interfaces(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/network/interfaces.ap.template",
                        CONFIG.home_path+"/Templates/interfaces",
                        context, next_step);
                },

                // Enable DHCP conf, set authoritative mode and subnet
                function update_dhcpd(next_step) {
                    var context = CONFIG.access_point;
                    // We must enable this to turn on the access point
                    write_template_to_file(appRoot+
                        "/resources/etc/dhcp/dhcpd.conf.template",
                        CONFIG.home_path+"/Templates/dhcpd.conf",
                        context, next_step);
                },

                // Enable the interface in the dhcp server
                function update_dhcp_interface(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/default/isc-dhcp-server.template",
                        CONFIG.home_path+"/Templates/isc-dhcp-server",
                        context, next_step);
                },

                // Enable hostapd.conf file
                function update_hostapd_conf(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/hostapd/hostapd.conf.template",
                        CONFIG.home_path+"/Templates/hostapd.conf",
                        context, next_step);
                },

                function update_hostapd_default(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/default/hostapd.template",
                        CONFIG.home_path+"/Templates/hostapd",
                        context, next_step);
                },

                function moveFiles(next_step) {
                	var command = 'sudo sh ' +appRoot +'/resources/shellscripts/copyfiles.sh';
                	
                    exec(command, function(error, stdout, stderr) {
                        //console.log(stdout);
                        if (!error) console.log("... Files Copied Successfully!");
                        next_step();
                    });
                },
                
                function reboot_network_interfaces(next_step) {
                    _reboot_wireless_network(context.wifi_interface, next_step);
                },
                
                function restart_dhcp_service(next_step) {
                    exec("sudo service isc-dhcp-server restart", function(error, stdout, stderr) {
                        //console.log(stdout);
                        if (!error) console.log("... dhcp server restarted!");
                        next_step();
                    });
                },

                function restart_hostapd_service(next_step) {
                    exec("sudo service hostapd restart", function(error, stdout, stderr) {
                        //console.log(stdout);
                        if (!error) console.log("... hostapd restarted!");
                        next_step();
                    });
                }
                
                // TODO: Do we need to issue a reboot here?

            ], callback);
        });
    },

    // Disables AP mode and reverts to wifi connection
    _enable_wifi_mode = function(connection_info, callback) {

        _is_wifi_enabled(function(error, result_ip) {
            if (error) return callback(error);

            /*
            if (result_ip) {
                console.log("\nWifi connection is enabled with IP: " + result_ip);
                return callback(null, "Wifi connection is enabled with IP: " + String(result_ip));
            }
            */

            async.series([

                // Update /etc/network/interface with correct info...
                function update_interfaces(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/network/interfaces.wifi.template",
                        CONFIG.home_path+"/Templates/interfaces",
                        connection_info, next_step);
                },
                
                function update_wpa_supplicant(next_step) {
                    write_template_to_file(appRoot+
                        "/resources/etc/wpa_supplicant/wpa_supplicant.template",
                        CONFIG.home_path+"/Templates/wpa_supplicant.conf",
                        connection_info, next_step);
                },
                
                function moveFiles(next_step) {
                	var command = 'sudo sh ' +appRoot +'/resources/shellscripts/copyfiles.sh';
                	
                    exec(command, function(error, stdout, stderr) {
                        //console.log(stdout);
                    	if(error) console.log("ERROR in moveFiles: >> ", error);
                        if (!error) console.log("... Files Copied Successfully!");
                        next_step();
                    });
                },
                
                // Stop the DHCP server...
                function stop_dhcp_service(next_step) {
                    exec("sudo service isc-dhcp-server stop", function(error, stdout, stderr) {
                        //console.log(stdout);
                        if (!error) console.log("... dhcp server stopped!");
                        next_step();
                    });
                },

                function reboot_network_interfaces(next_step) {
                    _reboot_wireless_network(CONFIG.wifi_interface, next_step);
                }

            ], callback(null, "WIFI_ENABLED"));
        });

    };

    return {
        get_wifi_info:           _get_wifi_info,
        reboot_wireless_network: _reboot_wireless_network,

        is_wifi_enabled:         _is_wifi_enabled,
        is_wifi_enabled_sync:    _is_wifi_enabled_sync,

        is_ap_enabled:           _is_ap_enabled,
        is_ap_enabled_sync:      _is_ap_enabled_sync,

        enable_ap_mode:          _enable_ap_mode,
        enable_wifi_mode:        _enable_wifi_mode,
    };
}