import chai from 'chai';
import Fiber from 'fibers';
import Process from '../src/core/Component';
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);


global.expect = chai.expect;
global.sinon = sinon;

global.ComponentScaffold = require('./mocks/ComponentScaffold');


global.TestFiber = action => {
  Fiber(() => {
    const mockProcess = new Process("test", () => {console.log("Test Component");});

    Fiber.current.fbpProc = mockProcess;
    action(mockProcess);
  }).run();
};


// equalPropertiesOn.js
//
// Copyright 2016 Chris Tomich
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chai.use(chai => {
  const Assertion = chai.Assertion;

  function compareArrays(assertionContext, expectedArray, valueArray) {
    assertionContext.assert(
      valueArray.length === expectedArray.length,
      "expected #{this} to have an array #{exp}, but instead got an array with value #{act}",
      "expected #{this} to not have an array #{exp}",
      expectedArray,
      valueArray
    );

    for (let propertyIndex = 0; propertyIndex < expectedArray.length; propertyIndex++) {
      const valueArrayItem = valueArray[propertyIndex];
      const expectedArrayItem = expectedArray[propertyIndex];

      if (Object.prototype.toString.call(valueArrayItem) === "[object Array]") {
        compareArrays(assertionContext, expectedArrayItem, valueArrayItem);
      }
      else if (Object.prototype.toString.call(valueArrayItem) === "[object Object]") {
        compareObjects(assertionContext, expectedArrayItem, valueArrayItem);
      }
      else {
        assertionContext.assert(
          valueArrayItem === expectedArrayItem,
          "expected #{this} to have an array item #{exp}, but instead got an array item with value #{act}",
          "expected #{this} to not have an array item with value #{exp}",
          valueArrayItem,
          expectedArrayItem
        )
      }
    }
  }

  function compareObjects(assertionContext, expected, value) {
    for (const expectedPropertyName in expected) {
      if (expected.hasOwnProperty(expectedPropertyName)) {
        const expectedProperty = expected[expectedPropertyName];

        const valueHasProperty = value.hasOwnProperty(expectedPropertyName);

        assertionContext.assert(
          valueHasProperty,
          "expected #{this} to have a property named #{exp}",
          "expected #{this} to not have a property named #{exp}",
          expectedPropertyName
        );

        if (valueHasProperty) {
          const valueProperty = value[expectedPropertyName];

          if (Object.prototype.toString.call(valueProperty) === "[object Array]") {
            compareArrays(assertionContext, expectedProperty, valueProperty);
          }
          else if (Object.prototype.toString.call(valueProperty) === "[object Object]") {
            compareObjects(assertionContext, expectedProperty, valueProperty);
          }
          else {
            assertionContext.assert(
              valueProperty === expectedProperty,
              "expected #{this} to have a property with value #{exp}, but instead got a property with value #{act}",
              "expected #{this} to not have a property with the value #{exp}",
              expectedProperty,
              valueProperty
            )
          }
        }
      }
    }
  }

  Assertion.addMethod("equalPropertiesOn", function (expected) {
    const value = this._obj;

    compareObjects(this, expected, value);
  });
});