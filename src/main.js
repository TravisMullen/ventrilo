/* global page: false */

import { version } from '../package.json'
import camelCase from 'camel-case'
import paramCase from 'param-case'
import pascalCase from 'pascal-case'

/** ventrilo */

// @todo - make a class
const ventrilo = {}

/**
 * Custom Error
 * @returns {Error}
 */
const ventriloError = msg => new Error(`ventrilo ${version} - ${msg}`)

/**
 * Global Attributes
 * @see {@link} https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
 */
const globalAttributes = new Set([
  // 'aria-*',
  // 'accesskey',
  // 'autocapitalize',
  // 'class',
  // 'contenteditable',
  // 'contextmenu',
  // // 'data-*',
  // 'dir',
  // 'draggable',
  // 'dropzone',
  // 'hidden',
  'id'
  // 'is', // set in createElement only as setting via attribute will not instantial custom element
  // 'itemid',
  // 'itemprop',
  // 'itemref',
  // 'itemscope',
  // 'itemtype',
  // 'lang',
  // 'slot',
  // 'spellcheck',
  // 'style',
  // 'tabindex',
  // 'title',
  // 'translate'
])

const DocumentOrShadowRoot = ['activeElement', 'styleSheets']
/** todo add 'caretPositionFromPoint', 'elementFromPoint' */

/** Default Properties */
const defaultProperties = ['textContent', 'innerHTML', ...DocumentOrShadowRoot]

/** Default Methods */
const defaultMethods = new Set([...defaultProperties, ...globalAttributes])

/** Defined Methods */
const definedMethods = new Set()

// const shadowSelectorFn = (el, selector) => el.shadowRoot.querySelector(selector)

/**
 * Resize a HTMLElement using `style` properties.
 * Assumed to be already in the DOM.
 *
 * @param {selector} string Query Selector for HTMLElement to resize
 * @param {width} string Update HTMLElement `style.width` property
 * @param {height} string Update HTMLElement `style.height` property
 * @returns: {boolean} Confirms completion of HTMLElement property changes and `dispose` of JSHandle
 * @see {@link} https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageevaluatehandlepagefunction-args
 */
ventrilo.resizeElement = async (selector, width, height) => {
  const handle = await page.evaluateHandle((el, _width, _height) => {
    const elm = document.querySelector(el)
    if (_width) {
      elm.style.width = _width
    }
    if (_height) {
      elm.style.height = _height
    }
  }, selector, width, height)
  handle.dispose()
  return true
}

/**
 * Resize a HTMLElement using `style` properties.
 * Assumed to be already in the DOM.
 *
 * @param {createElement} string Query Selector for HTMLElement to resize
 * @param {extended} string Query Selector for HTMLElement to resize
 * @param {parentElement} string Query Selector for HTMLElement to resize
 * @param {options} Object Options for element creation
 * @param {options.properties} Object Properties to set on initial connection/render
 * @param {options.attributes} Object Attributes to set on initial connection/render
 * @returns returns: {Promise<JSHandle>} Promise which resolves to the return value of `pageFunction` as in-page object (JSHandle)
 */
ventrilo.createCustomElementHandle = async (createElement, extended = null, parentElement = null, options = {}) => {
  const customElement = await page.evaluateHandle((selector, is, parent, { properties, attributes }) => {
    let elm
    if (is) {
      elm = document.createElement(selector, { is })
    } else {
      elm = document.createElement(selector)
    }

    if (properties && Object.keys(properties).length) {
      for (const item in properties) {
        elm[item] = properties[item]
      }
    }

    if (attributes && Object.keys(attributes).length) {
      for (const item in attributes) {
        console.log('setAttribute', item, attributes[item])
        elm.setAttribute(item, attributes[item])
      }
    }

    if (parent) {
      document.querySelector(parent).appendChild(elm)
    } else {
      document.body.appendChild(elm)
    }
    return elm
  }, createElement, extended, parentElement, options)
  return customElement
}

ventrilo.removeCustomElementHandle = async (createCustomElementHandle, parentSelector = null) => {
  const handle = await page.evaluateHandle((elm, parent) => {
    if (parent) {
      document.querySelector(parent).removeChild(elm)
    } else {
      document.body.removeChild(elm)
    }
  }, createCustomElementHandle, parentSelector)
  if (createCustomElementHandle.dispose) {
    await createCustomElementHandle.dispose()
  }
  handle.dispose()
  return true
}

ventrilo.customElementHandle = async selector => {
  const handle = await page.evaluateHandle((el) => document.querySelector(el), selector)
  return handle
}

// ventrilo.queryDeep = async (page, ...selectors) => {
//   if (!selectors || selectors.length === 0) {
//     return;
//   }

//   const [ firstSelector, ...restSelectors ] = selectors;
//   let parentElement = await page.$(firstSelector);
//   for (const selector of restSelectors) {
//     parentElement = await page.evaluateHandle(shadowSelectorFn, parentElement, selector);
//   }

//   return parentElement;
// };

/**
 * Handle function wrapper for a custom element to be
 * defined in `window.CustomElementRegistry`.
 * @param  {string} selector - Selector for custom element.
 * @return {Promise} - Resolves when custom element is `.define`.
 */
ventrilo.waitForHandle = async selector => {
  const handle = await page.evaluateHandle((el) => window.customElements.waitFor(el), selector)
  return handle
}

ventrilo.shadowHandle = async (selector, parent) => {
  const handle = await page.evaluateHandle((el) => document.querySelector(el).shadowRoot, selector)
  return handle
}

ventrilo.shadowRootHandle = async (selector, parent = false) => {
  const handle = await page.evaluateHandle((el, root) => root ? root.querySelector(el).shadowRoot : document.querySelector(el).shadowRoot, selector)
  return handle
}

const defineMethod = type => {
  const methodName = pascalCase(type)

  // getters
  let shadowGetter = `raw${methodName}`
  ventrilo[shadowGetter] = async (selector) => {
    const handle = await page.evaluateHandle((el, prop) => document.querySelector(el).shadowRoot[prop], selector, camelCase(type))
    const result = await handle.jsonValue()
    await handle.dispose()
    return result
  }
  // getters
  let getter = `get${methodName}`
  ventrilo[getter] = async (elementHandle, selector = false) => {
    const handle = await page.evaluateHandle((el, prop, sel) => {
      let scope
      if (sel && el.shadowRoot) {
        scope = el.shadowRoot
      } else {
        scope = el
      }
      console.log('getter', sel, scope[prop])
      return sel ? scope.querySelector(sel)[prop] : scope[prop]
    }, elementHandle, camelCase(type), selector)
    const result = await handle.jsonValue()
    await handle.dispose()
    return result
  }
  
  // setters for property in format of setType
  let setter = `set${methodName}`
  ventrilo[setter] = async (elementHandle, testValue) => {
    /** @todo handle property changes that don't reset reference */
    const handle = await page.evaluateHandle((el, prop, update) => (el[prop] = update), elementHandle, camelCase(type), testValue)
    const result = await handle.jsonValue()
    await handle.dispose()
    return result
  }
  // setters for attribute
  /** all properties are given attribute setters to optionally test scenatio of failure */
  let attribSetter = `setAttribute${methodName}`
  ventrilo[attribSetter] = async (elementHandle, testValue) => {
    const handle = await page.evaluateHandle((el, attributeName, update) => { el.setAttribute(attributeName, update) }, elementHandle, paramCase(type), testValue)
    const result = await handle.jsonValue()
    await handle.dispose()
    return result
  }

  /** all properties are given attribute setters to optionally test scenatio of failure */
  let attribGetter = `getAttribute${methodName}`
  ventrilo[attribGetter] = async (elementHandle) => {
    const handle = await page.evaluateHandle((el, attributeName) => { return el.getAttribute(attributeName) }, elementHandle, paramCase(type))
    const result = await handle.jsonValue()
    await handle.dispose()
    return result
  }
}

ventrilo.addMethod = type => {
  // if (defaultMethods.has(type)) {
  //   throw ventriloError(`${type} is already defined by default.`)
  // }
  if (definedMethods.has(type)) {
    throw ventriloError(`Methods can only be defined once. Try adding ${type} before scripts run.`)
  }

  definedMethods.add(type)

  defineMethod(type)
}

// document.activeElement.querySelector('custom-element').shadowRoot
// .querySelector('nested-custom-element').shadowRoot
// .querySelector('.class-name')
ventrilo.activeElementHandle = async () => {
  const handle = await page.evaluateHandle(() => document.activeElement)
  return handle
}

ventrilo.customEventHandle = async (elementHandle, eventName) => {
  const handle = await page.evaluateHandle((el, ev) => {
    window.captured = []
    el.addEventListener(ev, ({ type, detail, target }) => {
      window.captured.push({ type, detail, target })
    })
  }, elementHandle, eventName)
  return handle
}

ventrilo.waitForCustomEvent = async (timeout = 20000, totalEvents = 1) => {
  await page.mainFrame().waitForFunction(`window.captured.length >= ${totalEvents}`, {
    timeout
  })
  return true
}

/** @todo - make timeout and capture length dynamic */
ventrilo.customEventGetter = async () => {
  const aHandle = await page.evaluateHandle(() => window)
  const resultHandle = await page.evaluateHandle(w => w.captured, aHandle)
  const captured = await resultHandle.jsonValue()
  await resultHandle.dispose()
  await aHandle.dispose()
  if (captured.length && captured.length === 1) {
    return captured[0]
  } else {
    return captured
  }
}

for (let type of defaultMethods) {
  defineMethod(type)
}

export default ventrilo
