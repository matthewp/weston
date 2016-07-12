var QUnit = require("steal-qunit");
var weston = require("weston");
var Map = require("can-simple-map");
var Component = require("can-component");
var viewModel = require("can-view-model");
var callbacks = require("can-view-callbacks");

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

QUnit.module("template if");

QUnit.test("basics works", function(assert){
  var template = weston.fromString("<template><template if='{{show}}'><div>Hello</div></template></template>");
  var map = new Map({ show: true });

  var frag = template(map);
  assert.equal(frag.firstChild.firstChild.nodeValue, "Hello");

  map.attr("show", false);
  assert.equal(frag.firstChild.nodeType, 3);

  map.attr("show", true);
  assert.equal(frag.firstChild.firstChild.nodeValue, "Hello");
});

QUnit.test("item and index are available", function(assert){
  var template = weston.fromString("<template><template each='{{things}}'><span>{{item.name}}</span><span>{{index}}</span></template></template>");
  var map = new Map({
    things: [
      new Map({ name: "one" }),
      new Map({ name: "two" })
    ]
  });

  var frag = template(map);

  var first = frag.firstChild.nextSibling;
  var second = first.nextSibling.nextSibling;

  assert.equal(first.firstChild.nodeValue, "one");
  assert.equal(first.nextSibling.firstChild.nodeValue, "0");

  assert.equal(second.firstChild.nodeValue, "two");
  assert.equal(second.nextSibling.firstChild.nodeValue, "1");
});

QUnit.module("view-callbacks attr");

QUnit.test("basics works", function(assert){
  var template = weston.fromString("<template><div thing='bar'></div></template>");
  var map = new Map({ bar: 'qux' });
  callbacks.attr("thing", function(el, tagData){
    var val = tagData.scope.compute(el.getAttribute(tagData.attributeName))();
    assert.equal(val, "qux");
  });
  var frag = template(map);
});

QUnit.module("can-component");

QUnit.test("automatic binding", function(assert){
  Component.extend({
    tag: "basic-el",
    template: weston.fromString("<template><div>Hello {{name}}</div></template>"),
    viewModel: {
      name: "Person"
    }
  });
  var map = new Map({ name: "Matthew" });

  var template = weston.fromString("<template><basic-el name='{{name}}'></basic-el>");
  var frag = template(map);
  var customEl = frag.firstChild;
  var tn = customEl.firstChild.firstChild.nextSibling;

  assert.equal(tn.nodeValue, "Matthew");

  map.attr("name", "Wilbur");

  assert.equal(tn.nodeValue, "Wilbur");

  // This is auto bindings so...
  var vm = viewModel(customEl);
  vm.attr("name", "Matthew");

  assert.equal(map.attr("name"), "Matthew");
});

QUnit.test("one-way binding", function(assert){
  Component.extend({
    tag: "oneway-el",
    template: weston.fromString("<template><div>Hello {{name}}</div></template>"),
    viewModel: {
      name: "Person"
    }
  });
  var map = new Map({ name: "Matthew" });

  var template = weston.fromString("<template><oneway-el name='[[name]]'></oneway-el></template>");
  var frag = template(map);
  var customEl = frag.firstChild;
  var tn = customEl.firstChild.firstChild.nextSibling;

  assert.equal(tn.nodeValue, "Matthew");

  map.attr("name", "Wilbur");

  assert.equal(tn.nodeValue, "Wilbur");

  // This is one-way bindings so...
  var vm = viewModel(customEl);
  vm.attr("name", "Matthew");

  assert.equal(map.attr("name"), "Wilbur", "name did not change");
  assert.equal(tn.nodeValue, "Matthew", "tn did");

  map.attr("name", "Anne");
  assert.equal(vm.attr("name"), "Anne");
  assert.equal(tn.nodeValue, "Anne");
});
