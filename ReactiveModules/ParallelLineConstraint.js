//**------------------------------------------------------------------------------------------  */
//** THIS IS A REACTIVE LINE ANGLE PARAMETRIC                                                   */
//** THIS IS TO ENFORCE THAT WHEN ONE POINT IS MOVED, THE OTHER IS CORRECTED TO SPECIFIED ANGLE *//
//**------------------------------------------------------------------------------------------   */
/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */
import {
  PointObservable
} from './PointObservable.js'

import {
  Public
} from '../Public.js'



const {
  log
} = console

export class ParallelLineConstraint {
  constructor(
    beginPoint,
    endPoint,
    referenceLine //** SETS ANGLE*/
  ) {
    this.beginPoint = Public.whatThisIs(beginPoint) === 'PointObservable' ? beginPoint : new PointObservable(beginPoint)
    this.endPoint = Public.whatThisIs(endPoint) === 'PointObservable' ? endPoint : new PointObservable(endPoint)
    this.referenceLine = referenceLine
    const generateReferencePointReactionFunction = () => {
      return {
        //** IF ONE POINT IS MOVED, THE OTHER IS CORRECTED FOR ANGLE CONFORMITY, PRESERVING LINE LENGTH/DISTANCE */
        function: () => { 
          if (!this.referenceLine) return
          if (Math.round(this.referenceLineAngle * 100) === Math.round(this.angle * 100)) return
          this.endPoint.xy = Public.getEndPoint(this.beginPoint, this.referenceLineLength, this.referenceLineAngle)
        }
      }
    }

    const refreshLinePoints = generateReferencePointReactionFunction().function
    this.referenceLine.beginPoint.appendDidSet(refreshLinePoints)
    this.referenceLine.endPoint.appendDidSet(refreshLinePoints)
    this.beginPoint.didSet = refreshLinePoints
    this.beginPoint.appendDidSet(refreshLinePoints)

    this.disassociateWithLine = () => {
      this.referenceLine.endPoint.removeDidSetFunction(refreshLinePoints)
      this.referenceLine.beginPoint.removeDidSetFunction(refreshLinePoints)
      this.referenceLine = null
    }
    this.proximityDistance = 10
    let _mousePressPoint = null
    this.sendMousePress = (mousePressPoint) => {
      if (Public.getUserMouseClickOnPoint(mousePressPoint, this.proximityDistance, [this.endPoint])) {
        _mousePressPoint = mousePressPoint
        return true
      }
    }
    this.sendMouseDrag = (mouseDragPoint) => { 
      if (!_mousePressPoint) return

      const modifiedMouseDragPoint = Public.getPerpendicularPoint({
        beginPoint: this.beginPoint,
        endPoint: this.endPoint
      }, mouseDragPoint)

      const tempPoint = Public.getMovedPoints(_mousePressPoint, modifiedMouseDragPoint, [this.endPoint.xy])[0]
      const thisAngle = Math.round(Public.getAngle(this.beginPoint, tempPoint))
      if (thisAngle === Math.round(this.angle)) {
        this.length = Public.getDistanceTwoPoints(this.beginPoint, tempPoint)
      //TODO THIS REALLY SHOULD BE ABLE TO SETTLE TO ZERO; NEED TO FIX ERROR WHEN ZERO OCCURS
      } else this.length = 0.001
      this.endPoint.xy = tempPoint
    }
    this.sendMouseRelease = () => {
      _mousePressPoint = null
    }
    refreshLinePoints()

  }
  get angle() {
    return Public.getAngle(this.beginPoint, this.endPoint)
  }
  get referenceLineAngle() {
    return Public.getLineAngle(this.referenceLine)
  }
  get referenceLineLength() {
    return Public.getLineLength(this.referenceLine)
  }
  get didSet() {
    return this.point.didSet
  }
  get appendDidSet() {
    return this.point.appendDidSet
  }
}

