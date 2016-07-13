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
