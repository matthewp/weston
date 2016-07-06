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

I built weston primarily to see how easy it would be, given that many of CanJS' internal APIs have now been released as public APIs. weston uses most of the same internal packages as can-stache, like can-view-scope, can-view-target, and can-view-live.

I also built weston 

### Advantages over stache


