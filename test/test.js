var QUnit = require("steal-qunit");
var weston = require("weston");
var Map = require("can-simple-map");

QUnit.module("fromString API");

QUnit.test("throws if first element is not a <template>", function(assert){
  var render = function(){
    weston.fromString("foo");
  };
  assert.throws(render, Error, "throws because the first element is not a template");
});

QUnit.test("doesn't throw if you give it a template", function(assert){
  weston.fromString("<template></template>");
  assert.ok(true, "it worked");
});

QUnit.module("automatic binding");

QUnit.test("values are live", function(assert){
  var map = new Map({ name: "Matthew" });
  var template = weston.fromString("<template>{{name}}</template>");
  var frag = template(map);

  var tn = frag.firstChild;

  assert.equal(tn.nodeValue, "Matthew");

  map.attr("name", "Wilbur");
  assert.equal(tn.nodeValue, "Wilbur");
});

QUnit.test("attributes are live", function(assert){
  var map = new Map({ name: "Matthew" });
  var template = weston.fromString("<template><div class='{{name}}' name='foo'></div></template>");
  var frag = template(map);

  var div = frag.firstChild;
  assert.equal(div.getAttribute("class"), "Matthew");

  map.attr("name", "Wilbur");
  assert.equal(div.getAttribute("class"), "Wilbur");

  // static attr
  assert.equal(div.getAttribute("name"), "foo");
});

QUnit.test("can call functions with args", function(assert){
  var map = new Map({
    name: "matthew",
    toUpper: function(str){
      return str.toUpperCase();
    }
  });
  var template = weston.fromString("<template><div>{{toUpper(name)}}</div></template>");
  var frag = template(map);

  var div = frag.firstChild;
  assert.equal(div.textContent, "MATTHEW");

  map.attr("name", "wilbur");

  assert.equal(div.textContent, "WILBUR");
});

QUnit.module("template each");

QUnit.test("basics works", function(assert){
  var template = weston.fromString("<template>{{name}}<template each='{{things}}'><span>{{name}}</span></template><div>foo</div></template>");
  var map = new Map({
    name: "Things",
    things: [
      new Map({ name: "one" }),
      new Map({ name: "two" })
    ]
  });

  var frag = template(map);

  var thingsText = frag.firstChild;
  assert.equal(thingsText.nodeValue, "Things");

  var firstSpan = thingsText.nextSibling.nextSibling;
  var secondSpan = firstSpan.nextSibling;

  assert.equal(firstSpan.textContent, "one");
  assert.equal(secondSpan.textContent, "two");
});
