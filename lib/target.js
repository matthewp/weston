var canCompute = require("can-compute");
var getChildNodes = require("can-util/dom/child-nodes/child-nodes");
var canBatch = require("can-event/batch/batch");
var canEvent = require("can-event");
require("can-util/dom/events/removed/removed");
var live = require("can-view-live");
var viewTarget = require("can-view-target");
var viewCallbacks = require("can-view-callbacks");
var expression = require("./expression");
var Observation = require("can-observation");

module.exports = makeTarget;

var bindingExp = /{{([\w\.\(\)]+)}}/g;
var slice = Array.prototype.slice;

var obs = {
  get: function(obs, key){
    if(typeof obs.attr === "function") {
      return obs.attr(key);
    } else if(typeof obs.get === "function") {
      return obs.get(key);
    } else {
      return obs[key];
    }
  },
  set: function(obs, key, val){
    if(typeof obs.attr === "function") {
      return obs.attr(key, val);
    } else if(typeof obs.set === "function") {
      return obs.set(key, val);
    } else {
      return (obs[key] = val);
    }
  }
};

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
        var customAttrs = {};
        addAttributesCallback(node, function(scope, options){
          viewCallbacks.tagHandler(this, node.tag, {
            options: options,
            scope: scope,
            templateType: "my-template",
            setupBindings: customElementBindings(customAttrs, scope, options)
          });
        });
      }
      // Bind to attributes
      node.attrs = {};
      var attributes = el.attributes, attr;
      for(var i = 0, len = attributes.length; i < len; i++) {
        attr = attributes.item(i);
        handleAttribute(attr.name, attr.value, node);
        if(isCustomTag) {
          customAttrs[attr.name] = attr.value;
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
      callback = function(scope, options, nodeList){
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
        live.html(this, htmlCompute, undefined, nodeList);
      };
      break;
    case "iterator":
      callback = function(scope, options, nodeList){
        var textNode = this;
        var attrValue = el.getAttribute("each");
        var expr = expression.parse(attrValue);
        var prop = expr.value;
        var valueCompute = canCompute(function(){
          var res = scope.read(prop);
          return res.value;
        });
        live.list(this, valueCompute, function(item, idx){
          var newScope = scope.add({ item: item, index: idx() }).add(item);
          var newOptions = options.add({});
          var frag = render(newScope, newOptions);
          return frag;
        }, undefined, undefined, nodeList);
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

  var attrCallback = viewCallbacks.attr(name);
  if(attrCallback) {
    addAttributesCallback(node, function(scope, options, nodeList){
      attrCallback(this, {
        attributeName: name,
        scope: scope,
        options: options,
        nodeList: nodeList
      });
    });
  }
}

var semaphore = (function(){
  var table = {};

  return {
    incr: function(key){
      var cur = table[key] || 0;
      table[key] = cur + 1;
    },
    decr: function(key){
      --table[key];
    },
    get: function(key){
      return table[key];
    }
  };
})();

function customElementBindings(attrs, scope, options){
  return function(el, callback, initialData){
    var data = {};
    var afterViewModel = [];
    Object.keys(attrs).forEach(function(name){
      var value = attrs[name];
      var expr = expression.parse(value);

      if(expr.hasBinding) {
        var key = expr.value;

        var parentCompute = scope.compute("@" + key);

        var childCompute = canCompute(function(newVal){
          if(arguments.length) {
            return obs.set(viewModel, key, newVal);
          }
          return obs.get(viewModel, key);
        });

        data[name] = parentCompute();
        afterViewModel.push(function(viewModel){
          var teardowns = [];
          var parentToChild = function(ev, c){
            semaphore.incr(key);

            childCompute(c);

            canBatch.after(function(){
              semaphore.decr(key);
            });
          };

          parentToChild({}, parentCompute());
          parentCompute.bind("change", parentToChild);
          teardowns.push(function(){
            parentCompute.unbind("change", parentToChild);
          });

          if(expr.bindingType === "auto") {
            var childToParent = function(ev, newVal){
              if(!semaphore.get(key)) {
                semaphore.incr(key);
                parentCompute(newVal);

                canBatch.after(function(){
                  semaphore.decr(key);
                });
              }
            };
            viewModel.bind(key, childToParent);
            teardowns.push(function(){
              viewModel.unbind(key, childToParent);
            });
          }

          canEvent.one.call(el, "removed", function(){
            teardowns.forEach(function(fn){
              fn();
            });
          });
        });
      }
    });
    var viewModel = callback(data);

    // Have the viewModel, so set everything up
    afterViewModel.forEach(function(fn){
      fn(viewModel);
    });
  };
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
    var compute = scope.compute(expr.value);
    live.text(this, compute);
  };
}

function addAttributesCallback(node, callback) {
  if(!node.attributes) {
    node.attributes = [];
  }
  node.attributes.unshift(callback);
}
