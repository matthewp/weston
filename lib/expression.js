var bindingTypes = {
  auto: 0,
  oneway: 1
};

exports.parse = function(expr){
  var pos = 0, len = expr.length;
  var inBinding = false;
  var inCall = false;
  var char, bindingType;
  var args = "";
  var value = "";
  while(pos < len) {
    char = expr[pos];
    if(!inBinding) {
      if(char === "{") {
        inBinding = true;
        bindingType = bindingTypes.auto;
      } else if(char === "[") {
        inBinding = true;
        bindingType = bindingTypes.oneway;
      }
    } else if(!isBindingChar(char)){
      if(isCallChar(char) && value) {
        inCall = true;
      } else if(inCall) {
        if(char !== " ") {
          args += char;
        }
      } else {
        value += char;
      }
    }
    pos++;
  }

  var bindingTypeStr = getBindingType(bindingType);

  return {
    hasBinding: !!bindingTypeStr,
    hasCall: inCall,
    bindingType: bindingTypeStr,
    args: args.split(","),
    value: value
  };
};

var isBindingChar = makeCharChecker("{}[]");
var isCallChar = makeCharChecker("()");

function makeCharChecker(str){
  var bindingChars = str.split("").reduce(function(acc, cur){
    acc[cur] = true;
    return acc;
  }, {});
  return function(char){
    return !!bindingChars[char];
  };
}

function getBindingType(bindingType) {
  switch(bindingType) {
    case bindingTypes.auto:
      return "auto";
    case bindingTypes.oneway:
      return "oneway";
  }
}

function first(str) {
  return str[0];
}

function last(str){
  return str[str.length - 1];
}
