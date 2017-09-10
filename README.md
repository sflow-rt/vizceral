# Vizceral real-time traffic graph

https://github.com/Netflix/vizceral

# To install
1. Copy files to the sFlow-RT app directory.
2. Restart sFlow-RT to load application.

# Demo
Set property -Dvizceral.demo=yes

# Configuration

Post a new set of address groups (INTERNET group is required):
curl -H "Content-Type:application/json" -X PUT \
--data '{"INTERNET":["0.0.0.0/0"],"Local":["10.0.0.0/8"],"Campus":["10.1.0.0/16"]}' \
http://localhost:8008/app/vizceral/scripts/traffic.js/groups/json

Set the maximum packets per second:
-Dviz.maxVolume=10000

# UI
Click on nodes to zoom. Press ESC to unzoom.

For more information, visit:
http://www.sFlow-RT.com
