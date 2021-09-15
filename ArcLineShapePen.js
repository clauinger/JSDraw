/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  LineShapePen
} from './LineShapePen.js'
import {
  Public
} from './Public.js'
import {
  State
} from './State.js'
import {
  CircleSeriesPen
} from './CircleSeriesPen.js'
import {
  modifyMousePointIfSnapIsEngaged , setSnapPointEngaged
} from './PenTools.js'
import {
  DrawMark
} from './DrawMarks.js';


export class ArcLineShapePen extends LineShapePen {
  constructor(
    context,
    beginPoint = null,
    endPoint = null,
    arcPoint = null,
  ) {
    super(context, beginPoint, endPoint)
    this.circlePen = new CircleSeriesPen(context)
    this.returnSnap = null
    this.arcPoint = null
    this.centerPoint = null
    this.context = context
    this.drawLoop = () => {
      this.drawLinePen()
      if(!this.circlePen.context && this.context) this.circlePen.context = this.context
      if (this.centerPoint) {
        DrawMark.pointCaptureHalo(this.context, this.centerPoint, 'rgba(70%, 70%, 70%, 0.5)', 5, 1)
        DrawMark.pointCaptureHalo(this.context, this.arcMidPoint, 'rgba(70%, 70%, 70%, 0.5)', 5, 2)
        this.circlePen.drawLoop()
      }
    }
    /**--------------------CONSTRUCTOR SCOPED VARIABLES/FUNCTIONS DEFINED BELOW------------------------*/
    const coordinateArcWithLine = (arcHeight = this.arcHeight) => {
      if (this.arcHeightIsEstablished) {} else {
        return
      }
      if (this.arcHeightIsEstablished) {
        const direction = this.direction
        const perpFactor = function () {
          if (direction === 'clockwise') {
            return -90
          } else {
            return +90
          }
        }()
        const angl = Public.getLineAngle(this.line) + perpFactor // % 360
        const midPoint = Public.getLineMidPoint(this.line)
        const newRadiusLineEndPoint = Public.getEndPoint(midPoint, arcHeight, angl)
        const newCenterPoint =
          Public.getCircleCenterFromThreePoints(
            this.line.beginPoint,
            newRadiusLineEndPoint,
            this.line.endPoint)
        const cp = this.radiusLine.beginPoint
        const radiusPoint = this.radiusLine.endPoint
        cp.x = newCenterPoint.x
        cp.y = newCenterPoint.y
        this.centerPoint.x = newCenterPoint.x
        this.centerPoint.y = newCenterPoint.y
        radiusPoint.x = newRadiusLineEndPoint.x
        radiusPoint.y = newRadiusLineEndPoint.y
        const arcLine = this.circlePen.arcLineCollection[0]
        arcLine.beginPoint.x = this.beginPoint.x
        arcLine.beginPoint.y = this.beginPoint.y
        arcLine.endPoint.x = this.endPoint.x
        arcLine.endPoint.y = this.endPoint.y
        this.circlePen.refreshArcParameterCollection()
      }
    }

    const logMessage = (logString) => {
      if (this.logToConsole) {
        console.log(logString)
      }
    }

    const theDirection = {
      clockwise: 'clockwise',
      counterclockwise: 'counterclockwise'
    }
    const getDirection = (mousePressPoint) => {
      if (this.hasArcInitLine) {} else {
        return null
      }
      const dir = Public.getArcDirection(this.endPoint, mousePressPoint, this.beginPoint)
      if (dir < 0) {
        return theDirection.counterclockwise
      } else {
        return theDirection.clockwise
      }
    }
    const eventCallFunction_dragCenterPoint = (mouseDragPoint /** = {x: mouseX , y: mouseY}*/ ) => {
      this.arcPoint = {
        x: mouseDragPoint.x,
        y: mouseDragPoint.y
      }
      this.centerPoint = Public.getCircleCenterFromThreePoints(
        this.beginPoint,
        this.arcPoint,
        this.endPoint
      )
      this.radiusLine.beginPoint.x = this.centerPoint.x
      this.radiusLine.beginPoint.y = this.centerPoint.y
      this.radiusLine.endPoint.x = mouseDragPoint.x
      this.radiusLine.endPoint.y = mouseDragPoint.y
      this.arcLine.direction = getDirection(mouseDragPoint)
      this.circlePen.refreshArcParameterCollection()
    }
    const getArcHeight = () => {
      let anglePerp
      if (this.direction === 'counterclockwise') {
        anglePerp = 90
      } else {
        anglePerp = 270
      }
      const perpAng = Public.getLineAngle(this.line) + anglePerp
      const endPoint = Public.getEndPoint(this.centerPoint, this.radius, perpAng)
      const beginPoint = Public.getLineMidPoint(this.arcLine)
      return Public.getLineLength({beginPoint, endPoint})
    }

    let arcHeightAtMousePress


    /**--------------------OVERWRITE PARENT VARIABLES/FUNCTIONS DEFINED BELOW------------------------*/
    this.mousePressSetup = () => {
      arcHeightAtMousePress = this.arcHeight
    }
    this.didSetBeginPoint = () => {
      coordinateArcWithLine(arcHeightAtMousePress)
    }
    this.didSetEndPoint = () => {
      coordinateArcWithLine(arcHeightAtMousePress)
    }

    if (beginPoint && endPoint && arcPoint) {
      const angl = Public.getLineAngle({
        beginPoint: beginPoint,
        endPoint: endPoint
      }) + 90
      const midPoint = Public.getLineMidPoint({
        beginPoint: beginPoint,
        endPoint: endPoint
      })
      this.circlePen.sendMousePress(midPoint)
      this.circlePen.assignPointsToNewArcLine(this.beginPoint.clone, this.endPoint.clone, this.circlePen.radiiLineCollection[0])
      eventCallFunction_dragCenterPoint(arcPoint)
      this.beginPoint.didSet = this.didSetBeginPoint
      this.endPoint.didSet = this.didSetEndPoint
    }


    this.mousePressEventStack.mouseClickedOnArcInitLine = {
      evaluate: (mousePressPoint,
        eventKey = '',
        hasArcInitLine = this.hasArcInitLine,
        arcNotEstablished = this.arcNotEstablished,
        proximityDistance = this.proximityDistance,

      ) => {
        /**------------------GUARD STATEMENTS**/

        if (arcNotEstablished === false) {
          return
        }
        if (hasArcInitLine === false) {
          return
        }
        /**-------------------GET FINDINGS**/
        const findings = (() => {
          let result = {}
          const lineTapped = Public.getUserMouseClickOnLine(
            mousePressPoint,
            proximityDistance,
            [this.line])
          if (lineTapped) {
            result = {
              eventKey: eventKey
            }
            result.arcInitLine = lineTapped
            result.distanceOffset = Public.getPointDistanceToLine(mousePressPoint, lineTapped)
            result.modifiedPressPoint = Public.getPerpendicularPoint(lineTapped, mousePressPoint)
            return result
          }
        })()
        return findings
      },
      execute: (userMousePressInfo = this.userMousePressInfo) => {
        logMessage('case 1: user to initialize arc')
        const mousePressPoint = userMousePressInfo.modifiedPressPoint
        this.circlePen.sendMousePress(mousePressPoint)
        this.circlePen.assignPointsToNewArcLine(this.beginPoint.clone, this.endPoint.clone, this.circlePen.radiiLineCollection[0])
        this.defineEventFunction({
          mouseDragContinue: (mousePressPoint) => {
            eventCallFunction_dragCenterPoint(mousePressPoint)
          }
        })
      }
    }

    this.mousePressEventStack.mouseClickedOnArcCenterPoint = {
      evaluate: (mousePressPoint,
        eventKey = '',
        centerPoint = this.centerPoint,
        proximityDistance = this.proximityDistance,
        arcHeightIsEstablished = this.arcHeightIsEstablished
      ) => {
        /**------------------GUARD STATEMENTS**/
        if (arcHeightIsEstablished) {} else {
          return
        }

        /**------------------GET FINDINGS**/
        const findings = (() => {
          let result = {}
          const pointTapped = Public.getUserMouseClickOnPoint(
            mousePressPoint, proximityDistance,
            [centerPoint])

          if (pointTapped) {
            result = {
              eventKey: eventKey
            }
            result.centerPoint = pointTapped
            result.distanceOffset = Public.getLineLength({beginPoint:mousePressPoint, endPoint:pointTapped} )
            result.modifiedPressPoint = pointTapped
            return result
          }
        })()

        return findings
      },
      execute: () => {
        logMessage('case 3: move arc center point')
        const centerPoint = this.centerPoint
        const lineAngle = Public.getLineAngle(this.line)
        const pathAngle = (lineAngle + 90) % 360
        const pathLine = {
          beginPoint: this.centerPoint,
          endPoint: Public.getEndPoint(this.centerPoint, 10, pathAngle)
        }
        const radiusLineAngle = Public.getLineAngle(this.radiusLine)

        this.circlePen.returnSnap = {
          point: {
            x: centerPoint.x,
            y: centerPoint.y
          },
          isEngaged: null,
          proximityDistance: 5
        }
        this.defineEventFunction({
          // mouseDragContinue: (mousePressPoint = {
          //     x: mouseX,
          //     y: mouseY
          // }) => {
          mouseDragContinue: (mousePressPoint) => {
            const startMouse = {
              x: mousePressPoint.x,
              y: mousePressPoint.y
            }
            let modifiedPoint = Public.getPerpendicularPoint(pathLine, mousePressPoint)
            if (setSnapPointEngaged(startMouse, this.circlePen.returnSnap, this)) {
              modifiedPoint = {
                x: this.circlePen.returnSnap.point.x,
                y: this.circlePen.returnSnap.point.y
              }
            }
            const newRadius = Public.getLineLength( {beginPoint:modifiedPoint , endPoint: this.beginPoint} )
            this.centerPoint = modifiedPoint
            const newRadusLineEndpoint = Public.getEndPoint(modifiedPoint, newRadius, radiusLineAngle)
            this.radiusLine.beginPoint.x = modifiedPoint.x
            this.radiusLine.beginPoint.y = modifiedPoint.y
            this.radiusLine.endPoint.x = newRadusLineEndpoint.x
            this.radiusLine.endPoint.y = newRadusLineEndpoint.y
            this.circlePen.refreshArcParameterCollection()
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            this.circlePen.returnSnap = null
          }
        })
      }
    }

    this.mousePressEventStack.mouseClickedOnArcMidPoint = {
      evaluate: (mousePressPoint,
        eventKey = '',
        proximityDistance = this.proximityDistance,
        arcMidPoint = this.arcMidPoint,
        arcHeightIsEstablished = this.arcHeightIsEstablished
      ) => {
        /**------------------GUARD STATEMENTS**/
        if (arcHeightIsEstablished) {} else {
          return
        }

        /**------------------GET FINDINGS**/
        const findings = (() => {
          let result = {}
          const pointTapped = Public.getUserMouseClickOnPoint(
            mousePressPoint, proximityDistance,
            [arcMidPoint])

          if (pointTapped) {
            result = {
              eventKey: eventKey
            }
            result.arcMidPoint = pointTapped
            result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped)
            result.modifiedPressPoint = pointTapped
            return result
          }
        })()
        return findings
      },
      execute: () => {
        logMessage('case 4: move arc center point')
        this.circlePen.returnSnap = {
          point: {
            x: this.arcMidPoint.x,
            y: this.arcMidPoint.y
          },
          isEngaged: null,
          proximityDistance: 5
        }

        this.defineEventFunction({
          // mouseDragContinue: (mouseDragPoint = {
          //     x: mouseX,
          //     y: mouseY
          // }) => {
          mouseDragContinue: (mouseDragPoint) => {
            modifyMousePointIfSnapIsEngaged(mouseDragPoint, this.circlePen.returnSnap)
            eventCallFunction_dragCenterPoint(mouseDragPoint)
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {

            this.circlePen.returnSnap = null
          }
        })
      }
    }

    this.mousePressEventStack.mouseClickedOnArc = {
      evaluate: (mousePressPoint,
        eventKey = '',
        proximityDistance = this.proximityDistance,
        arcHeightIsEstablished = this.arcHeightIsEstablished,
        circlePen = this.circlePen
      ) => {
        /**------------------GUARD STATEMENTS**/
        if (arcHeightIsEstablished) {} else {
          return
        }

        /**------------------GET FINDINGS**/
        const findings = (() => {
          let result = {}
          const arcTappedFindings = Public.getUserMouseClickedOnCirclePenArc(
            mousePressPoint,
            proximityDistance,
            circlePen)

          if (arcTappedFindings) {
            result = {
              eventKey: eventKey
            }
            Object.assign(result, arcTappedFindings)
            return result
          }
        })()
        return findings
      },
      execute: () => {
        logMessage('case 5: initiate swipe arc point change')

        this.circlePen.returnSnap = null
        var pointGrab = null

        this.defineEventFunction({
          // mouseDragContinue: (mousePressPoint = {x: mouseX,y: mouseY}) => {
          mouseDragContinue: (mousePressPoint) => {
            if (pointGrab == null) {
              const pointCollection = [this.circlePen.arcLineCollection[0].beginPoint, this.circlePen.arcLineCollection[0].endPoint]
              pointGrab = Public.getUserMouseClickOnPoint(mousePressPoint, 5, pointCollection)
              if (this.circlePen.arcLineCollection[0].beginPoint === pointGrab && this.lockBeginPoint) {
                // print('should lock')
                pointGrab = null
              } else if (this.circlePen.arcLineCollection[0].endPoint === pointGrab && this.lockBeginPoint) {
                // print('should lock')
                pointGrab = null
              }
            }
            if (this.circlePen.hasSelectedPoints) {

              setSnapPointEngaged(mousePressPoint, this.returnSnap, this)
              // mouseDidDrag = true;
              this.circlePen.sendMouseDrag(mousePressPoint)
              arcHeightAtMousePress = getArcHeight()
              this.beginPoint.setPointValuesWithoutObserverFunctionsRunning(this.arcLine.beginPoint)
              this.endPoint.setPointValuesWithoutObserverFunctionsRunning(this.arcLine.endPoint)
            } else if (pointGrab) {
              logMessage('    5a: select move drag arc point')
              this.circlePen.sendMousePress(pointGrab)
              this.circlePen.selectedPoints.add(pointGrab)
              this.returnSnap = {
                point: {
                  x: pointGrab.x,
                  y: pointGrab.y
                },
                isEngaged: null,
                proximityDistance: 5
              }
            }
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            this.circlePen.returnSnap = null
            this.line.beginPoint.x = this.circlePen.arcLineCollection[0].beginPoint.x
            this.line.beginPoint.y = this.circlePen.arcLineCollection[0].beginPoint.y
            this.line.endPoint.x = this.circlePen.arcLineCollection[0].endPoint.x
            this.line.endPoint.y = this.circlePen.arcLineCollection[0].endPoint.y
            if (this.mouseWasDragged) {
              this.circlePen.selectedPoints.removeAll()
            }
            this.returnSnap = null
            /**DONT DELETE */
            this.circlePen.radiiLineCollection[0].endPoint.x = this.arcMidPoint.x
            /**DONT DELETE */
            this.circlePen.radiiLineCollection[0].endPoint.y = this.arcMidPoint.y
          }
        })
      }
    }

    this.mousePressEventStack.mouseClickedOnRadiusLine = {
      evaluate: (mousePressPoint,
        eventKey = '',
        arcHeightIsEstablished = this.arcHeightIsEstablished
      ) => {
        /**------------------GUARD STATEMENTS**/
        if (arcHeightIsEstablished) {} else {
          return
        }

        /**------------------GET FINDINGS**/
        const findings = (() => {

          return this.circlePen.mousePressEventStack.mouseClickedOnRadiusLine.evaluate(
            mousePressPoint,
            'mouseClickedOnRadiusLine')
        })()
        /**------------------RETURN FINDINGS**/
        return findings
      },
      execute: (userMousePressInfo = this.userMousePressInfo) => {
        logMessage('case 6: begin rotate of arc')
        // this.circlePen.mousePressEventStack.mouseClickedOnRadiusLine.execute(userMousePressInfo)
        this.circlePen.sendMousePress(userMousePressInfo.modifiedPressPoint)
        this.defineEventFunction({
          // mouseDragContinue: (mouseDragPoint = {
          //     x: mouseX,
          //     y: mouseY
          // }) => {
          mouseDragContinue: (mouseDragPoint) => {
            this.circlePen.sendMouseDrag(mouseDragPoint)
            // const arcLine = this.circlePen.arcLineCollection[0]
            this.beginPoint.setPointValuesWithoutObserverFunctionsRunning(this.arcLine.beginPoint)
            this.endPoint.setPointValuesWithoutObserverFunctionsRunning(this.arcLine.endPoint)
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            this.circlePen.sendMouseRelease()
          }
        })
      }
    }
    this.mousePressEventStackOrder = [
      'mouseClickedOnArcInitLine',
      'mouseClickedOnPoint',
      'mouseClickedOnArcCenterPoint',
      'mouseClickedOnArcMidPoint',
      'mouseClickedOnArc',
      'mouseClickedOnRadiusLine',
      'mouseClickedOnLine',
    ]
  } /**CLOSE CONSTRUCTOR */


  /**-----------------GETTERS AND SETTERS DEFINED BELOW---------------------------*/

  get arcMidPoint() {
    if (this.line == undefined) {
      return null
    }
    if (this.line == null) {
      return null
    }
    if (this.centerPoint == null) {
      return null
    }
    let anglePerp
    if (this.direction === 'counterclockwise') {
      anglePerp = 90
    } else {
      anglePerp = 270
    }
    const perpAng = Public.getLineAngle(this.line) + anglePerp
    return Public.getEndPoint(this.centerPoint, this.radius, perpAng)
  }

  get radius() {
    if (this.centerPoint) {
      // return Public.getLineLength(this.centerPoint, this.arcPoint)
      return Public.getLineLength( {beginPoint: this.centerPoint, endPoint: this.line.beginPoint} )
    }
  }
  get arcLine() {
    if (this.hasLineDrawn) {
      return this.circlePen.arcLineCollection[0]
    }
    return null
  }
  get hasArcInitLine() {
    return this.hasLineDrawn
  }
  get arcNotEstablished() {
    // return this.circlePen.linePen.lineCount === 0
    return this.circlePen.hasRadiusLinesDrawn === false
  }
  get arcHeightIsEstablished() {
    // return this.circlePen.linePen.lineCount > 1
    return this.circlePen.hasRadiusLinesDrawn
  }
  get arcHeight() {
    if (this.arcHeightIsEstablished === false) {
      return 0
    }

    return Public.getLineLength( {beginPoint: Public.getLineMidPoint(this.line), endPoint: this.arcMidPoint} )
  }
  get direction() {
    if (this.arcHeightIsEstablished == false) {
      return null
    }
    return this.arcLine.direction
  }
  get radiusLine() {
    if (this.arcHeightIsEstablished == false) {
      return null
    }
    return this.circlePen.radiiLineCollection[0]
  }


  /**-----------------METHODS DEFINED BELOW---------------------------*/
  setArcHeight(newHeight) {
    const angl = Public.getLineAngle({
      beginPoint: this.centerPoint,
      endPoint: this.arcMidPoint
    })
    const beginPoint = Public.getLineMidPoint(this.line)
    const newArcMidPoint = Public.getEndPoint(beginPoint, newHeight, angl)
    const newCenterPoint =
      Public.getCircleCenterFromThreePoints(
        this.line.beginPoint,
        newArcMidPoint,
        this.line.endPoint)
    this.radiusLine.beginPoint.x = newCenterPoint.x
    this.radiusLine.beginPoint.y = newCenterPoint.y
    this.radiusLine.endPoint.x = newArcMidPoint.x
    this.radiusLine.endPoint.y = newArcMidPoint.y
    this.centerPoint.x = newCenterPoint.x
    this.centerPoint.y = newCenterPoint.y
    this.circlePen.refreshArcParameterCollection()
  }
  toJSON() {
    // this.circlePen.radiiLineCollection[0].endPoint
    // const rotateLine = this.circlePen.radiiLineCollection[0]
    // log(this.circlePen.hasRadiusLinesDrawn)
    const rotatePoint = function (circlePen) {
      if (circlePen.hasRadiusLinesDrawn) {
        return circlePen.radiiLineCollection[0].endPoint
      } else {
        return null
      }
    }(this.circlePen)

    if (this.hasArcInitLine) {
      return {
        'beginPoint': JSON.stringify(this.beginPoint.getMainPoint()),
        'endPoint': JSON.stringify(this.endPoint.getMainPoint()),
        'arcMidPoint': JSON.stringify(rotatePoint)
      }
    } else {
      return {
        'beginPoint': 'null',
        'endPoint': 'null',
        'arcMidPoint': 'null'
      }
    }
  }
}