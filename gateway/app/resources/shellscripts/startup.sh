#! /bin/sh

 ### BEGIN INIT INFO
 # Short-Description: Hukam hBuddy Gateway Startup Script
 # Run this script after running below comnands
 # sudo apt-get update
 # sudo apt-get upgrade
 ### END INIT INFO

wget -q --spider http://google.com
if [ $? -eq 0 ]; then
    echo "Online"
    
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs
	sudo apt-get install -y build-essential    
    
    sudo rm -rf hbuddy-install.sh
	wget https://raw.githubusercontent.com/sinny777/hbuddy-gateway/master/app/resources/shellscripts/hbuddy-install.sh
	sudo bash hbuddy-install.sh

	sudo rm -rf hbuddy-service.sh
	wget https://raw.githubusercontent.com/sinny777/hbuddy-gateway/master/app/resources/init.d/hbuddy-service.sh
	sudo bash hbuddy-service.sh restart
else
    echo "Offline"
    sudo bash hbuddy-service.sh restart
fi

exit 0
