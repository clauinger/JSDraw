//**------------------------------------------------------------------------------------------  */
//** THIS IS A REACTIVE LINE ARRAY PARAMETRIC                                                   */
//** IT SUBDIVIDES A LINE AND PLACES COLINEAR POINTS                                            */
//**------------------------------------------------------------------------------------------   */

import {
  PointObservable
} from './PointObservable.js'

import {
  Public
} from '../Public.js'

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const EMPTY_FUNCTION = () => {}

const {
  log
} = console

export class LinearPointArray {
  //** THIS IS TO ENFORCE THAT WHEN ONE POINT IS MOVED, THE OTHER IS CORRECTED TO SPECIFIED ANGLE*//
  constructor(
    beginPoint,
    endPoint,
    incrementDistance = 20,
  ) {
    this.beginPoint = Public.whatThisIs(beginPoint) === 'PointObservable' ? beginPoint : new PointObservable(beginPoint)
    this.endPoint = Public.whatThisIs(endPoint) === 'PointObservable' ? endPoint : new PointObservable(endPoint)
    this.setIncrementDistance = (newVal) => {
      incrementDistance = newVal
    }
    this.getIncrementDistance = () => {
      return incrementDistance
    }
    const pointArray = [new PointObservable(beginPoint.xy)]
    this.getPoints = () => {
      return pointArray
    }

    const generateRefreshArrayFunction = () => {
      return {
        //** IF ONE POINT IS MOVED, ARRAY IS RECONFIGURED*/
        function: () => {
          if (this.pointCount > pointArray.length) {
            // const deficit = this.pointCount - pointArray.length
            // for (let i = 0; i < deficit; i++) {
            for (let i = pointArray.length ; i < this.pointCount; i++) {
              const newPt = new PointObservable()
              pointArray.push(newPt)
            }
          }
          let xLen = 0
          const xAngle = this.angle
          for (let i = 0; i < this.pointCount; i++) {
            xLen += this.incrementDistance
            const newXY = Public.getEndPoint(this.beginPoint, xLen, xAngle)
            pointArray[i].xy = newXY
          }
          const newPointCount = Math.floor(this.totalDistance / this.incrementDistance)
          if(this.previousPointCount !== newPointCount) {this.pointCountDidChange()}
          this.previousPointCount = newPointCount
        }
      }
    }
    const refreshArrayFunction = generateRefreshArrayFunction().function
    this.disaccotiateWithLine = () => {
      //** MUST CLEAR OR ERROR WILL OCCUR */
      this.endPoint.removeDidSetFunction(refreshArrayFunction)
      this.beginPoint.removeDidSetFunction(refreshArrayFunction)
    }
    this.accotiateWithLine = () => {
      this.endPoint.appendDidSet(refreshArrayFunction)
      this.beginPoint.appendDidSet(refreshArrayFunction)
    }
    this.accotiateWithLine()
    this.proximityDistance = 10
    this.pointCountDidChange = EMPTY_FUNCTION
    this.previousPointCount = 0
  }

  get incrementDistance() {
    return this.getIncrementDistance()
  }
  set incrementDistance(newVal) {
    this.setIncrementDistance(newVal)
  }
  get angle() {
    return Public.getAngle(this.beginPoint, this.endPoint)
  }

  get pointCount() {

    return Math.floor(this.totalDistance / this.incrementDistance)
  }
  get pointArray() {
    const pointCount = this.pointCount
    return this.getPoints().filter((pt, i) => i < pointCount )
  }
  get totalDistance() {
    return Public.getDistanceTwoPoints(this.beginPoint.xy, this.endPoint.xy)
  }
}
