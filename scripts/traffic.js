// author: InMon Corp.
// version: 1.0
// date: 9/9/2017
// description: Internet traffic visualizion using NetFlix Vizceral
// copyright: Copyright (c) 2017 InMon Corp. ALL RIGHTS RESERVED

var aggMode  = getSystemProperty('viz.aggMode')  || 'sum';
var maxFlows = getSystemProperty('viz.maxFlows') || 20;
var minValue = getSystemProperty('viz.minValue') || 0.01;
var agents   = getSystemProperty('viz.agents')   || 'ALL';
var t        = getSystemProperty('viz.t')        || 10;
var n        = getSystemProperty('viz.n')        || 10;

var maxVolume = parseInt(getSystemProperty('viz.maxVolume') || '10000'); 
var demoMode = "yes" === getSystemProperty('viz.demo');

if(demoMode) {
  logInfo('Showing NetFlix demo data');
  include(scriptdir()+'/inc/demo.js');
}

var defaultGroups = {
  'INTERNET': ['0.0.0.0/0'],
  'Private': ['10.0.0.0/8','172.16.0.0/12','192.168.0.0/16'],
};
var groups = storeGet('groups') || defaultGroups;

setGroups('viz',groups);

var incoming = 'group:ipsource:viz=INTERNET&group:ipdestination:viz!=INTERNET';
var outgoing = 'group:ipsource:viz!=INTERNET&group:ipdestination:viz=INTERNET';
setFlow('viz_group_in', {
  keys:'group:ipdestination:viz,stack',
  filter:incoming, value:'frames', t:t, n:n
});
setFlow('viz_group_out', {
  keys:'group:ipsource:viz,stack',
  filter:outgoing, value:'frames', t:t, n:n
});



// https://github.com/Netflix/Vizceral/wiki/Configuration#definitions-for-data-to-display
var defs = {
  detailedNode: {
    volume: {
      default: {
        top: { header: 'PPS'},
        bottom: { header: 'ERROR RATE' },
      },
      focused: {
        top: { header: 'PPS' },
      },
      entry: {
        top: { header: 'TOTAL PPS' }
      }
    }
  }
}

function getGroup(group,flows_in,flows_out) {
  var flows = {renderer:'region',name:group,class:'normal',nodes:[],connections:[]};
  var nodes = {};
  var entry,source,target;
  for(entry in flows_in) {
    [source,target] = entry.split('-');
    nodes[source] = source;
    nodes[target] = target;
    flows.connections.push({
      source:source,
      target:target,
      metrics: flows_in[entry],
      metadata: { streaming: true }
    });
  }
  for(entry in flows_out) {
    [target,source] = entry.split('-');
    nodes[source] = source;
    nodes[target] = target;
    flows.connections.push({
      source:source,
      target:target,
      metrics: flows_out[entry],
      metadata: { streaming: true }
    });
  }
  for(node in nodes) flows.nodes.push({renderer:'focusedChild',name:node,class:'normal'}); 
   
  return flows;
}

function updateMetrics(metrics,stacks,flows) {
  for(var i = 0; i < flows.length; i++) {
    var [group,stack] = flows[i].key.split(',');
    var layers = stack.split('.');
    var idx = layers.indexOf('ip');
    if(idx === -1) continue;

    var ipprot = layers[idx+1] || 'none';
    var val = flows[i].value;
    if(!metrics.hasOwnProperty(group)) metrics[group] = {normal:0,warning:0,danger:0};
    var severity = 'normal';
    switch(ipprot) {
      case 'tcp': severity = 'normal'; break;
      case 'udp': severity = 'normal'; break;
      case 'icmp': severity = 'warning'; break;
      default: severity = 'danger';
    }
    metrics[group][severity] += val;
    if(!stacks.hasOwnProperty(group)) stacks[group] =  {};
    var entry = stacks[group];
    var start = layers[idx];
    while(++idx < layers.length) {
      var target = layers[idx];
      var key = start+'-'+target;
      if(!entry.hasOwnProperty(key)) entry[key] = {normal:0,warning:0,danger:0};
      entry[key][severity] += val; 
      start = target;
    }
  }
}

function getFlows() {
  var data = {
    name: 'vizceral',
    renderer: 'global',
    maxVolume: maxVolume,
    updated: Date.now(),
    entryNode:'INTERNET',
    nodes: [{renderer:'region', name:'INTERNET', class:'normal'}],
    connections: [] 
  };

  // flows to groups
  var group_in = {};
  var flows_in = {};
  updateMetrics(group_in,flows_in,activeFlows(agents,'viz_group_in',maxFlows,minValue,aggMode));
  var group_out = {};
  var flows_out = {};
  updateMetrics(group_out,flows_out,activeFlows(agents,'viz_group_out',maxFlows,minValue,aggMode));

  for(var group in groups) {
    if('INTERNET' === group) continue;

    data.nodes.push(getGroup(group,flows_in[group],flows_out[group]));

    data.connections.push({
      source:'INTERNET',
      target:group,
      metrics: group_in[group] || {normal:0,warning:0,danger:0},
      metadata: { streaming: true }
    });
    data.connections.push({
      source:group,
      target:'INTERNET',
      metrics: group_out[group] || {normal:0,warning:0,danger:0},
      metadata: { streaming: true }
    });
  }
  return {definitions:defs, data:data, poll:5};  
}

setHttpHandler(function(req) {
  var result, path = req.path;
  if(!path || path.length != 1) throw "not_found";
  switch(path[0]) {
    case 'data':
      result = demoMode ? {data:demo} : getFlows();
      break;
    case 'groups':
      switch(req.method) {
        case 'POST':
        case 'PUT':
          if(req.error) throw "bad_request";
          if(!setGroups('viz', req.body)) throw "bad_request";
          groups = req.body;
          storeSet('groups', groups);
          break;
        default: result = groups;
      }
      break;
    default: throw "not_found";
  }
  return result;
});
