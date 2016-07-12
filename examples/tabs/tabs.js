const weston = require("weston");
const Component = require("can-component");
const define = require("can-define");

class Panel {
  constructor(title, selected) {
    this.title = title;
    this.selected = selected;
  }
}

define(Panel.prototype, {
  title: "string",
  selected: "boolean"
});

class TabsViewModel {
  select(panel) {
    this.panels.forEach(function(thisPanel){
      thisPanel.selected = thisPanel === panel;
    });
  }
}

define(TabsViewModel.prototype, {
  panels: {
    value: [
      new Panel("first", true),
      new Panel("second", false)
    ]
  }
});

Component.extend({
  tag: "tabs-widget",
  template: weston("#tabs-template"),
  ViewModel: TabsViewModel,
  events: {
    ".title click": function(el){
      let idx = +el.dataset.index;
      let panel = this.viewModel.panels[idx];
      this.viewModel.select(panel);
    }
  }
});

let frag = weston("#body")(new Map);
document.body.appendChild(frag);
