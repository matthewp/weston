var canCompute = require("can-compute");
var getChildNodes = require("can-util/dom/child-nodes/child-nodes");
var live = require("can-view-live");
var viewTarget = require("can-view-target");
var viewCallbacks = require("can-view-callbacks");
var expression = require("./expression");
var Observation = require("can-observation");

module.exports = makeTarget;

var bindingExp = /{{([\w\.\(\)]+)}}/g;

function makeTarget(frag, makeRenderer) {
  var path = [];

  var children = getChildNodes(frag);
  for(var i = 0, len = children.length; i < len; i++) {
    walk(children.item(i), path, makeRenderer);
  }

  return viewTarget(path);
}

function walk(el, arr, makeRenderer) {
  if(!el) {
    return;
  }

  var node = {};

  switch(el.nodeType) {
    // Element
    case 1:
      var tagName = el.nodeName.toLowerCase();

      if(tagName === "template") {
        handleTemplate(el, arr, makeRenderer);
        break;
      }

      node.tag = tagName;
      var isCustomTag = viewCallbacks.tag(node.tag);
      if(isCustomTag) {
        addAttributesCallback(node, function(scope, options){
          viewCallbacks.tagHandler(this, node.tag, {
            options: options,
            scope: scope,
            templateType: "my-template"
          });
        });
      } else {
        // Bind to attributes
        node.attrs = {};
        var attributes = el.attributes, attr;
        for(var i = 0, len = attributes.length; i < len; i++) {
          attr = attributes.item(i);
          handleAttribute(attr.name, attr.value, node);
        }
      }
      arr.push(node);
      break;
    // TextNode
    case 3:
      var value = el.nodeValue;
      var split = splitBoundText(value);
      arr.push.apply(arr, split);
      // Break apart this text node
      break;
  }

  var children = getChildNodes(el);

  if(children.length) {
    node.children = [];
  }

  for(var i = 0, len = children.length; i < len; i++) {
    walk(children.item(i), node.children, makeRenderer);
  }
}

function handleTemplate(el, arr, makeRenderer) {
  var callback;
  var templateType = el.getAttribute("if") ?
    "conditional" : el.getAttribute("each") ?
    "iterator": false;

  switch(templateType) {
    case "conditional":
      callback = function(scope, options){
        var attrValue = el.getAttribute("if");
        var expr = expression.parse(attrValue);
        var prop = expr.value;
        var valueCompute = canCompute(function(){
          var res = scope.read(prop);
          return res.value;
        });
        var htmlCompute = canCompute(function(){
          var isTrue = !!valueCompute();
          if(isTrue) {
            var frag = render(scope, options);
            return frag;
          }
          return document.createTextNode("");
        });
        live.html(this, htmlCompute);
      };
      break;
    case "iterator":
      callback = function(scope, options){
        var textNode = this;
        var attrValue = el.getAttribute("each");
        var expr = expression.parse(attrValue);
        var prop = expr.value;
        var valueCompute = canCompute(function(){
          var res = scope.read(prop);
          return res.value;
        });
        live.list(this, valueCompute, function(item){
          var newScope = scope.add(item);
          var newOptions = options.add({});
          var frag = render(newScope, newOptions);
          return frag;
        });
      };
      break;
  }

  if(callback) {
    var render = makeRenderer(el);
    arr.push(callback);
  }
}

function handleAttribute(name, value, node){
  var expr = expression.parse(value);
  if(expr.hasBinding) {
    var callback = function(scope, options){
      var el = this;
      var compute = canCompute(function(){
        var res = scope.read(expr.value);
        return res.value || "";
      });
      live.attr(el, name, compute);
    };

    node.attrs[name] = callback;
  } else {
    node.attrs[name] = value;
  }
}

function splitBoundText(txt){
  bindingExp.lastIndex = 0;
  var idx = 0;
  var match = bindingExp.exec(txt);
  var out = [];
  if(!match) {
    return [txt];
  }
  while(match) {
    var len = match[0].length;
    var part = txt.substr(idx, match.index - idx);
    if(part.length)
      out.push(part);
    out.push(boundText(match[0]));
    idx = match.index + len;
    match = bindingExp.exec(txt);
  }
  return out;
}

function boundText(str){
  var expr = expression.parse(str);

  if(expr.hasCall) {
    return function(scope){
      var argsCompute = canCompute(function(){
        return expr.args.map(function(prop){
          return scope.read(prop).value;
        });
      });
      var key = "@" + expr.value;
      var callCompute = canCompute(function(){
        var res = scope.read(key);
        var fn = res.value;
        var context = res.scope._context;
        var args = argsCompute();
        return fn.apply(context, args);
      });
      live.text(this, callCompute);
    };
  }

  return function(scope){
    var compute = canCompute(function(){
      var res = scope.read(expr.value);
      return res.value || "";
    });
    live.text(this, compute);
  };
}

function addAttributesCallback(node, callback) {
  if(!node.attributes) {
    node.attributes = [];
  }
  node.attributes.unshift(callback);
}
