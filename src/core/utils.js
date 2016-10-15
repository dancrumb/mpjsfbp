import Fiber from 'fibers';
import _ from 'lodash';
import {
  Status as ProcessStatus
} from './Component';

function getInportWithData(inportArray) {
  let allDrained = true;

  let inportElementWithData = inportArray.findIndex(inport => {
    const conn = inport ? inport.conn : false;
    if (!conn) {
      return false;
    } else if (conn.usedslots > 0) { // connection has data
      return true;
    }

    allDrained = allDrained && conn.closed; // no data but not all closed, so suspend
    return false;
  });

  if (inportElementWithData >= 0) {
    console.log(`findIPE_with_data - found: ${inportElementWithData}`);
  } else if (allDrained) {
    console.log('findIPE_with_data: all drained');
  } else {
    inportElementWithData = null;
  }

  return {
    inportElementWithData,
    allDrained
  };
}

/*
 * Takes and array and creates a new array that starts at the `wrapPoint` in the old array and wraps around when
 * it reaches the end
 *
 * For instance: `array = [1,2,3,4,5]`, `wrapPoint = 2`
 * Gives: `[3,4,5,1,2]`
 */
var wrapArray = (array, wrapPoint) => array.slice(wrapPoint).concat(array.slice(0, wrapPoint));

export function getElementWithSmallestBacklog(portArray, startIndex) {
  let number = Number.MAX_VALUE;
  let element = startIndex;
  if (element === -1) {
    element = 0;
  }
  let j = element;

  return _.minBy(wrapArray(portArray, startIndex), 'getConnectionDepth');
}

export function findInputPortElementWithData(array) {
  const proc = Fiber.current.fbpProc;

  console.log('findIPE_with_data ');

  while (true) {
    const inportWitData = getInportWithData(array);

    if (inportWitData.inportElementWithData !== null) {
      return inportWitData.inportElementWithData;
    }

    proc.yield(ProcessStatus.WAITING_TO_FIPE);
  }
}
