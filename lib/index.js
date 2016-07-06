var getFragment = require("can-util/dom/fragment/fragment");
var types = require("can-util/js/types/types");
var Scope = require("can-view-scope");
var makeTarget = require("./target");

exports = module.exports = function(selectorOrElement){
  var template = getElement(selectorOrElement);

  if(!template || template.nodeName !== "TEMPLATE") {
    throw new Error("Parent element must be a <template>");
  }

  var copy = document.importNode(template.content, true);

  // Targets are lazy, this way templates aren't processed if they
  // might never actually be used such as conditionals.
  var target;

  return function(map, options){
    if(!target) {
      target = makeTarget(copy, exports);
    }

    var scope = getScope(map);
    options = new Scope.Options({}).add(options || {});

    return target.hydrate(scope, options);
  };
};

exports.fromString = function(str){
  var frag = getFragment(str);
  var template = frag.firstChild;

  return exports(template);
};

function getElement(selectorOrElement) {
  return typeof selectorOrElement === "string" ?
    document.querySelector(selectorOrElement) :
    selectorOrElement;
}

function getScope(map) {
  var scope;
  if(map instanceof Scope) {
    scope = map;
  } else {
    if(!types.isMapLike(map)) {
      map = new types.DefaultMap(map);
    }
    scope = new Scope().add(map);
  }
  return scope;
}

