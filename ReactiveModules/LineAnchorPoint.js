
import {
  Public
} from '../Public.js'
import {
  PointObservable
} from './PointObservable.js'

//**------------------------------------------------------------------------------------------ */
//** POINT CLASS WITH DID-SET AND WILL-SET FUNCTIONALITY WHICH TRIGGERS WHEN X OR Y IS CHANGED */
//**------------------------------------------------------------------------------------------- */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const {
  log
} = console

const EMPTY_FUNCTION = () => {}

export class LineAnchorPoint {
  //** THIS IS A REACTIVE ANCHOR FOR POINT TO LINE*/
  //** ANYTHING CAN BE MADE TO MAKE POINT CONNECTION*/
  constructor(
    referenceLine, //** OBJECT REQUIRES ONLY A BEGIN POINT AND END POINT */
    perpendicularDistance = 0,
    linearDistance = 0
  ) {
    this.point = new PointObservable(referenceLine.beginPoint.xy)
    this.referenceLine = referenceLine
    this.referencePoint = this.referenceLine.beginPoint
    this.perpendicularDistance = perpendicularDistance
    this.linearDistance = linearDistance
    this.distancePoint = new PointObservable({
      x: 0,
      y: 0
    })
    this.colinearPoint = new PointObservable({
      x: 0,
      y: 0
    })

    this.coordinateDistanceValues = () => {
      const side = Public.getWhichSidePointToLine(this.point, this.referenceLine)
      this.colinearPoint.xy = Public.getPerpendicularPoint(this.referenceLine, this.point)
      const tempLineEndPoint = Public.getEndPoint(this.referencePoint, 100, this.lineAngle + 90)
      const tempLine = {
        beginPoint: tempLineEndPoint,
        endPoint: this.referencePoint,
      }
      const baseSide = Public.getWhichSidePointToLine(this.point, tempLine)
      this.distancePoint.xy = Public.getPerpendicularPoint(tempLine, this.point, true)
      this.perpendicularDistance = Public.getDistanceTwoPoints(this.point, this.colinearPoint)
      if (side === 'left') this.perpendicularDistance *= -1
      this.linearDistance = Public.getDistanceTwoPoints(this.referencePoint, this.colinearPoint)
      if (baseSide === 'left') this.linearDistance *= -1
    }
    const coordinateTrackPoints = () => {
      this.colinearPoint.xy = Public.getPerpendicularPoint(this.referenceLine, this.point)
      const tempLineEndPoint = Public.getEndPoint(this.referencePoint, 100, this.lineAngle + 90)
      const tempLine = {
        beginPoint: tempLineEndPoint,
        endPoint: this.referencePoint,
      }
      this.distancePoint.xy = Public.getPerpendicularPoint(tempLine, this.point, true)
    }

    //** FOR PURPOSES OF MANAGING DID SET FUNCTION, A UNIQUE INSTANCE OF SET-POINT-FUNCTION IS GENERATED */
    const generateSetPointFunction = (referncePoint) => {
      return {
        function: () => {
          const linearAngle = (this.linearDistance < 0 ? this.lineAngle + 180 : this.lineAngle) % 360
          const linePoint = this.linearDistance === 0 ?
            referncePoint :
            Public.getEndPoint(referncePoint, Math.abs(this.linearDistance), linearAngle)
          const perpAngle = (this.perpendicularDistance < 0 ? this.lineAngle + -90 : this.lineAngle + 90) % 360
          this.point.xy = Public.getEndPoint(linePoint, Math.abs(this.perpendicularDistance), perpAngle)
          coordinateTrackPoints()
        }
      }
    }

    let setPointFunction = generateSetPointFunction(this.referenceLine.beginPoint).function
    setPointFunction()
    this.referenceLine.beginPoint.appendDidSet(setPointFunction)
    this.referenceLine.endPoint.appendDidSet(setPointFunction)

    this.disassociateWithLine = () => {
      this.referenceLine.endPoint.removeDidSetFunction(setPointFunction)
      this.referenceLine.beginPoint.removeDidSetFunction(setPointFunction)
      this.referenceLine = null
    }

    let _mousePressPoint = null
    this.sendMousePress = (mousePressPoint) => {
      if (Public.getUserMouseClickOnPoint(mousePressPoint, 10, [this.point])) {
        _mousePressPoint = mousePressPoint
        return true
      }
    }
    this.sendMouseDrag = (mouseDragPoint) => {
      if (!_mousePressPoint) return
      this.point.xy = Public.getMovedPoints(_mousePressPoint, mouseDragPoint, [this.point.xy])[0]
      this.coordinateDistanceValues()

    }
    this.sendMouseRelease = () => {
      this.coordinateDistanceValues()
      _mousePressPoint = null
    }
  }
  get x() {
    return this.point.x
  }
  set x(newVal) {
    this.point.x = newVal
    this.coordinateDistanceValues()
  }
  get y() {
    return this.point.y
  }
  set y(newVal) {
    this.point.y = newVal
    this.coordinateDistanceValues()
  }
  get xy() {
    return this.point.xy
  }
  set xy(newVal) {
    this.point.xy = newVal
    this.coordinateDistanceValues()
  }
  get didSet() {
    return this.point.didSet
  }
  get appendDidSet() {
    return this.point.appendDidSet
  }
  get lineMidPoint() {
    return Public.getLineMidPoint(this.referenceLine)
  }
  get lineAngle() {
    return Public.getLineAngle(this.referenceLine)
  }
  get pointToLineSide() {
    return Public.getWhichSidePointToLine(this.point, this.referenceLine)
  }
}
