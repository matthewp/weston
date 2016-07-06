var weston = require("weston");
var Map = require("can-simple-map");
var Component = require("can-component");

var map = new Map({
  panels: [
    { title: "first" },
    { title: "second" }
  ].map(function(o) { return new Map(o); }),

  select: function(){

  }

});

Component.extend({
  tag: "tabs-widget",
  template: weston("#tabs-template"),
  viewModel: map
});

var frag = weston("#body")(new Map);
document.body.appendChild(frag);
