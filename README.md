# Ventrilo

Support for testing Custom Element, Shadow DOM, and Custom Events using Puppeteer.

Example project [truncate-title](https://github.com/TravisMullen/truncate-title)

`addMethod('some-property')` will provide handler for get/set property and getAttribute and setAttribute

```js
setAttributeSomeProperty
getAttributeSomeProperty
setSomeProperty
getSomeProperty
```


```js
setSomeProperty(element, 'value')
getSomeProperty(element)
```

### Get Propty Inside shadowRoot
```js
getSomeProperty(element, childElement)
```

## Todo

- [ ] Document Usage


## License

[MIT](LICENSE).


[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
