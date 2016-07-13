# weston

A simple templating library for CanJS applications.

```html
<template id="user-template">
  <article>
    <header>
      <h1>User: {{name}}</h1>
    </header>

    <template if="{{isAdmin}}">
      <div>Admin section</div>
    </template>

    <h2>Departments</h2>
    <ul>
    <template each="{{departments}}">
      <li>
        <span>{{name}}</span>
      </li>
    </template>
    </ul>
  </article>
</template>
```

```js
const template = weston("#user-template");
const map = new ViewModel();

document.body.appendChild(template(map));
```

### Disclaimer

* This is **alpha** software, and as such you should have no presumptions of its quality, or even that it works at all.
* This project is not affiliated with the CanJS org, the DoneJS org, or Bitovi. It's my (Matthew Phillips) personal project.
* This project depends on prerelease versions of CanJS packages that you probably shouldn't be using. It will be updated to use the latest stable version (3.0) when it is released.

## Use

**weston** can be called one of two ways, both produce a renderer function that works the same as stache's.

### Provide an element

Let's say you have a template defined on a page:

```html
<template id="my-template">
  <div>Hello {{name}}</div>
</template>
```

Provide the `weston()` function either the element or a selector string:

```js
var weston = require("weston");

var template = weston("#my-template");
var map = new Map();

var fragment = template(map);
document.body.appendChild(fragment);
```

### Provide a string

Alternatively you can provide weston a template string using `weston.fromString()`. This is mostly useful when writing tests:

```js
var weston = require("weston");

var template = weston.fromString("<template><div>Hello {{name}}</div></template>");
var map = new Map();

var frag = template(map);
document.body.appendChild(frag);
```

## Template concepts

### Scope

weston is different from stache in that scope is very easy to understand. Each `<template>` tag defines a new scope. Since template tags can be nested, scopes will also nest with them:

```html
<template id="outer">

  <template each="{{teams}}">
    <div>{{name}}</div>
    <div class="record">{{wins}} - {{losses}}</div>
  </template>

</template>
```

In this example the inner template loops over the `teams` property that is part of the parent template's scope. Inside of this inner template there is another scope which is of a single team.

### Binding

Binding is simple in weston, there is one-way and automatic binding. There is no difference between binding to text vs. binding to an attribute vs. binding to a View Model. The syntax is the same.

#### One-way binding

One-way binding binds from the parent to the child. Any change in the parent property will be reflected onto the child but the opposite doesn't hold.

```html
<template>

  <custom-el foo="[[bar]]"></custom-el>

</template>
```

Here we have a one way binding from the parent scope's `bar` property to the custom element `<custom-el>`'s `foo` property.

#### Automatic binding

Automatic bindings are probably the most common you will use. You can bind to a text using these bindings like so:

```html
<template>
  <div>{{name}}</div>
</template>
```

This would work the same as if written as `[[name]]`. These are **automatic** bindings because weston decides if one-way or two-way is most appropriate. It doesn't make sense for at text node to be two-way so it is not. However this would be:

```html
<template>

  <custom-el foo="{{bar}}"></custom-el>

</template>
```

In this example if the `<custom-el>`'s foo property changes it will be reflected on the template's `bar` property.

#### Function calling

**weston** always passes a property's exact value, this means if you have a map like:

```js
var MyMap = Map.extend({
  name: function(){
    return "Matthew";
  }
});
```

And you tried to use it like so:

```html
<template>
  <div>{{name}}</div>
</template>
```

It would not call the function. This is so that you can do interesting things like pass functions to child components. If you want to actually call a function, use `()` like you would in JavaScript:

```html
<template>
  <div>{{name()}}</div>
</template>
```

*Note* that this also means you can provide function arguments from other stuff within the template's scope. This will print out `MATTHEW`:

```js
var MyMap = Map.extend({
  upper: function(str){
    return str.toUpperCase();
  }
});
```

```html
<template>
  <div>{{upper(name)}}</div>
</template>
```

### Conditionals

Using `<template if="">` you can provide a value that, when true, will cause the template to be rendered. When false it will be removed.

```html
<template>
  <h1>Todos</h1>

  <template if="{{finished}}>
  
    <h2>You have no todos! Good job!</h2>

  </template>

</template>
```

### Iterating

You can interate over an array-like structure using `<template each="">`. Within the scope of the template will be the item that you are looping over:

```html
<template>
  <h1>Todos</h1>

  <ul>
    <template each="{{todos}}">
      <li>
        {{text}} {{dueBy}}
      </li>
    </template>
  </ul>

</template>
```

Within the scope of the each template there are two special values:

* **item** represents the item that you are looping over.
* **index** represents the index within the array-like.

## FAQ

### Why build weston?

I built weston primarily to see how easy it would be, given that many of CanJS' internal APIs have now been released as public APIs. **weston** uses most of the same internal packages as can-stache, like can-view-scope, can-view-target, and can-view-live.

I also built weston to see how to build a templating engine based on the `<template>` tag rather than strings, like stache and most other templating engines. This means that potentially they could be brought outside of `<template>` and put into the body (whether this is a good idea or not is debatable).

### Advantages over stache

There are numerous advantages of using weston, most of them revolve around *simplicity*:

* It's hard to determine in a stache template what the scope is of any given sectionbecause helpers can define the scope within their children. For example, `{{#foo}}{{/foo}}` creates a new scope within but `{{#if foo}}{{/if}}` does not. This makes it harder to reason about what is happening within a template. weston, on the other hand, only has **`<template>`** scope; that means that each `<template>` tag defines a new scope and anything within that template shares the same scope.
* Stache has helpers and [can-view-callbacks.attr attributes](https://github.com/canjs/can-view-callbacks) that largely overlap in use. weston only has attribute callbacks; there are no helpers.
* Stache has complex view bindings to accomodate legacy uses; see examples of how to pass functions into elements as an example. weston doesn't have any legacy concerns, so there's only 1 syntax for binding and you always get what you expect (if you are passing a compute they'll get a compute; if you're passing a function they'll get a function, etc.). There is no guessing of your *intent*.
* Stache templates differentiate *binding* syntax, such as binding to an attribute, from *templating* syntax, such as inserting text inside a span. In weston these are the same and have the same syntax. Use `{{key}}` to bind to everything.
* Stache bindings have different types and directions; there's one-way bindings, two-way bindings, bindings from parent to child and from child to parent, and reference bindings. In weston there's only **automatic** and **one-way** bindings. Use `{{key}}` to set up automatic bindings and `[[key]]` for one-way bindings.
