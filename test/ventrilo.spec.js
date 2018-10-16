/* eslint-disable no-unused-vars */
/* eslint-env mocha */
/* global page: false, expect: false, DEBUG_BROWSER: true */

import service from '..'

const CUSTOM_ELEMENT = 'research-element'
const EXTENDED_ELEMENT = null
const CUSTOM_EVENT_TYPE = 'example-event'
const TEST_ELEMENT_ID = 'this-element-is-for-testing-only'

// const WRAPPER_SELELCTOR = '.wrapper-element'
const MAX_TIMEOUT = 25000

let customElementCreate
let elementHandle

// define custom properties/attributes
service.addMethod('trigger')
service.addMethod('someProperty')
service.addMethod('data-jawn')

describe(`Testing `, function () {
  // `timeout()` must be inside standard (non-arrow) function
  // so `this` is correct
  this.timeout(MAX_TIMEOUT)

  // set-up and remove fresh instance for each test
  beforeEach(async () => {
    // await service.resizeElement(WRAPPER_SELELCTOR, 700)
    // create a clean element instance.
    customElementCreate = await service.createCustomElementHandle(CUSTOM_ELEMENT, EXTENDED_ELEMENT, null, {
      properties: {
        id: TEST_ELEMENT_ID,
        someProperty: 'a default value.'
      },
      attributes: {
        'data-jawn': 'another default value.'
      }
    })
    // wait for it to render in the DOM.
    await page.waitFor(CUSTOM_ELEMENT)
    // grab the rendered element for test analysis.
    elementHandle = await service.customElementHandle(CUSTOM_ELEMENT)
  })

  afterEach(async () => {
    // clean up mess.
    await service.removeCustomElementHandle(customElementCreate)
    await elementHandle.dispose()
    await customElementCreate.dispose()
  })

  describe(`confirm the DOM is not polluted with duplicate elements of same type`, () => {
    // setup for other tests to confirm element can be grabbed by selector
    it(`should render test element and apply change to id`, async () => {
      const updatedId = 'updated-element-id'
      const testIdValue = await page.$eval(CUSTOM_ELEMENT, e => e.id)

      expect(testIdValue).to.equal(TEST_ELEMENT_ID)

      await service.setId(elementHandle, updatedId)
      const idValue = await page.$eval(CUSTOM_ELEMENT, e => e.id)

      expect(idValue).to.equal(updatedId)
    })
  })

  describe(`demo attribute methods`, () => {
    it(`should get attribute set on creation using defined handler`, async () => {
      const attributeValue = await service.getAttributeDataJawn(elementHandle)
      expect(attributeValue).to.equal('another default value.')
    })
    it(`should change attribute using defined handler`, async () => {
      const testValue = `${new Date()} Sartorial jean`

      await service.setAttributeDataJawn(elementHandle, testValue)

      const attributeValue = await service.getAttributeDataJawn(elementHandle)
      expect(attributeValue).to.equal(testValue)
    })
  })

  describe(`demo property methods on root element`, () => {
    it(`should get property set on creation using defined handler`, async () => {
      const propertyValue = await service.getSomeProperty(elementHandle)
      console.log('service', Object.keys(service))
      expect(propertyValue).to.equal('a default value.')
    })
    it(`should change property using defined handler`, async () => {
      const testValue = `${new Date()} Sartorial jean`

      await service.setSomeProperty(elementHandle, testValue)

      const propertyValue = await service.getSomeProperty(elementHandle)
      expect(propertyValue).to.equal(testValue)
    })
  })

  // describe(`demo property methods in shadowRoot on child element`, () => {
  //   it(`should get property set on creation using defined handler`, async () => {
  //     const propertyValue = await service.getSomeProperty(elementHandle)
  //     console.log('service', Object.keys(service))
  //     expect(propertyValue).to.equal('a default value.')
  //   })
  //   it(`should change property using defined handler`, async () => {
  //     const testValue = `${new Date()} Sartorial jean`

  //     await service.setSomeProperty(elementHandle, testValue)

  //     const propertyValue = await service.getSomeProperty(elementHandle)
  //     expect(propertyValue).to.equal(testValue)
  //   })
  // })

  describe(`demo property generated custom event`, () => {
    it(`emmit CustomEvent of ${CUSTOM_EVENT_TYPE} when augmentation is complete`, async () => {
      const testValue = `${new Date()} Sartorial jean shorts actually, tattooed kickstarter direct trade try-hard woke four dollar toast truffaut. Green juice keffiyeh four dollar toast hot chicken pabst typewriter scenester before they sold out banh mi roof party bushwick ugh ennui edison bulb echo park. Street art edison bulb heirloom occupy health goth, cloud bread af small batch deep v crucifix intelligentsia try-hard. Wayfarers hexagon chartreuse, selvage lo-fi coloring book vape. Raw denim marfa taiyaki photo booth.`

      const ce = await service.customEventHandle(elementHandle, CUSTOM_EVENT_TYPE)

      await service.setAttributeTrigger(elementHandle, testValue)

      await service.waitForCustomEvent(MAX_TIMEOUT)

      const { type } = await service.customEventGetter()
      expect(type).to.equal(CUSTOM_EVENT_TYPE)

      await ce.dispose()
    })
  })
})
