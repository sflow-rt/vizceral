# Vizceral real-time traffic graph

http://blog.sflow.com/2017/09/real-time-traffic-visualization-using.html

# To install

1. [Download sFlow-RT](https://sflow-rt.com/download.php)
2. Run command: `sflow-rt/get-app.sh sflow-rt vizceral`
3. Restart sFlow-RT

Alternatively, use the Docker image:
https://hub.docker.com/r/sflow/vizceral/

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
