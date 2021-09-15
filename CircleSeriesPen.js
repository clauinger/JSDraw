import {
  LineSeriesPen
} from './LineSeriesPen.js'

import {
  Public
 } from './Public.js'
 import {
  State
 } from './State.js'
 // import { State } from './State.js'
 import {
  PenConstruct
 } from './PenConstruct.js'
 import {
  cursorTracker , setMousePointToSnapPointIfInProximity
 } from './PenTools.js'
 
 import {
  DrawMark
} from './DrawMarks.js';


export class CircleSeriesPen extends PenConstruct {
  constructor(
    context,
    circleShapeData = null,
  ) {
    super()
    this.context = context
    this.linePen = new LineSeriesPen(context);

    // if(radiiLineCollection){

    //     const lineCollection = radiiLineCollection.concat(arcLineCollection || [])
    //     this.linePen.insert(lineCollection,[])
    // }
    this.refreshArcParameterCollection = () => {
      refreshArcParameterCollection()
    }

    this.linePen.enableSnap = false
    // this.enableArcOverlap = true
    this.enableUserCommandToSwitch = true
    this.linePen.lineColor = 'rgba(50%, 50%, 50%, 0.5)'
    this.circleColor = 'rgba(0%, 50%, 50%, .2)'

    this.drawArcWeight = 1
    this.drawArcColor = 'rgba(90%, 20%, 90%, 1)'

    this.arcLineSelectionSet = new Set();
    this.minimumNewRadiusLength = 15
    this.arcOriginPointCollection = []
    this.selectedRadiusLines = new Set()

    this.proximityDistance = 5
    this.returnSnap = null
    this.logToConsole = false


    this.arcParameterCollection = []
    // this.refreshArcParameterCollection = () => {
    //     refreshArcParameterCollection()
    // }
    // this.refreshArcParameterCollection = ()=>{refreshArcParameterCollection()}

    this.getArcParameterCollection = (radiusLine) => {
      /** CREATE AN DICTIONARY OBJETC OF EACH POINT OF W/ KEY BEING THE ANGLE
       *  WITH THE FIRST ARCLINE BEGINPOINT BEING THE ORIGIN
       *  CREATE AN ARRAY OF ONLY THE POINT ANGLES
       *  SORT THAT ARRAY
       *  CREATE ARRAY OF NEW ARCLINE POINTS
       *  ASSEMBLE NEW ARC PERAMETERS AND ADD TO OUTPUT COLLECTION ARRAY
       */
      const pointsList = {}
      const angleKeySet = new Set()
      const arcLines = this.gatherConnectedArcLines(radiusLine)
      if (arcLines.length == 0) {
        return []
      }
      const direction = arcLines[0].direction
      const originPoint = arcLines[0].beginPoint

      const addLinePoint = (point, direction) => {
        const arcLine = {
          direction: direction,
          beginPoint: originPoint,
          endPoint: point
        }
        const angleKey = Math.round(getArcLineAngle(arcLine))
        angleKeySet.add(angleKey)

        if (pointsList[angleKey]) {
          pointsList[angleKey].push(point)

        } else {
          pointsList[angleKey] = [point]
        }
      }
      const radius = Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint)
      const x = this.centerPoint.x
      const y = this.centerPoint.y
      const produceParameter = (point1, point2) => {
        const beginAngle = Public.getLineRadianAngle({
          beginPoint: this.centerPoint,
          endPoint: point1
        })
        const endAngle = Public.getLineRadianAngle({
          beginPoint: this.centerPoint,
          endPoint: point2
        })
        return {
          x: x,
          y: y,
          radius: radius,
          beginAngle: endAngle,
          endAngle: beginAngle,
          direction: direction
        }
      }
      arcLines.map((arcLine, index) => {
        /** ADD BEGINPOINT */
        if (index !== 0) {
          addLinePoint(arcLine.beginPoint, direction)
        }
        /** ADD ENDPOINT */
        addLinePoint(arcLine.endPoint, direction)
      })

      const sortedKeys = [...angleKeySet].sort(function (a, b) {
        return a - b;
      })
      let sortedPointList = [originPoint]
      sortedKeys.map(key => {
        sortedPointList = sortedPointList.concat(pointsList[key])

      })
      const returnList = []
      for (let i = 0; i < sortedPointList.length; i++) {
        const p1 = sortedPointList[i]
        i++
        const p2 = sortedPointList[i]
        returnList.push(produceParameter(p1, p2))
      }
      return returnList
    }

    const logMessage = (logString) => {
      if (this.logToConsole) {
        console.log(logString)
      }
    }
    const direction = {
      clockwise: 'clockwise',
      counterclockwise: 'counterclockwise'
    }
    let mouseDidDrag = false;
    let cursorTravel = cursorTracker()
    const getMouseClickedOnDrawCircle = (mousePressPoint, proximityDistance = this.proximityDistance) => {
      if (this.radiiLineCollection.length == 0) {
        return null
      }
      var closestDistance = proximityDistance + 1
      var output = null
      const evaluateRadiusLine = (radiusLine) => {
        const radius = Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint)
        const dist = Public.getDistanceTwoPoints(this.centerPoint , mousePressPoint )
        const diff = Math.abs(radius - dist)
        if (diff <= closestDistance) {
          closestDistance = diff
          const angl = Public.getAngle(this.centerPoint, mousePressPoint)
          output = {
            point: Public.getEndPoint(this.centerPoint, radius, angl),
            radiusLine: radiusLine,
            angle: angl,
            radius: radius
          }
        }
      }
      this.radiiLineCollection.map(line => {
        evaluateRadiusLine(line)
      })
      return output
    } /**RETURN RADIUS LINE INFO OR NULL**/

    const getMouseClickOnArcPoint = (mousePressPoint, proximityDistance = this.proximityDistance) => {
      let match = null
      const pointTapped = Public.getUserMouseClickOnPoint(mousePressPoint, proximityDistance, this.arcPointCollection);
      this.arcLineCollection.map(line => {
        if (line.beginPoint === pointTapped) {
          match = {
            arcPoint: pointTapped,
            modifiedPressPoint: pointTapped,
            arcLine: line,
            distanceOffset: Public.getLengthTwoPoints(mousePressPoint, pointTapped)
          }
        }
        if (line.endPoint === pointTapped) {
          match = {
            arcPoint: pointTapped,
            modifiedPressPoint: pointTapped,
            arcLine: line,
            distanceOffset: Public.getLengthTwoPoints(mousePressPoint, pointTapped)
          }
        }
      })
      return match
    } /*RETURN POINT AND LINE OR NULL*/


    const mouseReleaseStandardFunction = () => {

      this.linePen.sendMouseRelease()
      this.linePen.clearSelectedPoints();
      this.linePen.paintingMode = false
      this.linePen.enableSnap = false
      refreshArcParameterCollection()
    }
    const setArcOriginPointsCollection = () => {
      const points = []
      this.radiiLineCollection.map(radiusLine => {
        const arcLines = this.gatherConnectedArcLines(radiusLine)
        if (arcLines.length > 0) {
          points.push({
            point: arcLines[0].beginPoint,
            radiusLine: radiusLine
          })
        }
      })
      this.arcOriginPointCollection = points
    }

    this.drawLoop = () => {
      if(!this.context)return 
      if(!this.linePen.context && this.context)this.linePen.context = this.context
      this.context
        .stroke('rgba(0%, 0%, 100%, 0.5)')
        .strokeWeight(1);
      [...this.selectedRadiusLines].forEach(radiuLine => {
        this.context
          .line(radiuLine.beginPoint.x, radiuLine.beginPoint.y, radiuLine.endPoint.x, radiuLine.endPoint.y)
      })
      this.arcOriginPointCollection.forEach(pInfo => {
        DrawMark.pointCaptureHalo(this.context, pInfo.point, 'rgba(50%, 70%, 50%, 0.5)', 4, 1)
      })
      this.linePen.drawLoop()
      this.context
        .noFill()
        .strokeWeight(1)
        .stroke(this.circleColor);
      this.radiiLineCollection.forEach(line => {
        const radius = Public.getDistanceTwoPoints(this.centerPoint , line.endPoint )
        this.context.circle(this.centerPoint.x, this.centerPoint.y, radius * 2)
      })
      this.drawArcs()
      if (this.returnSnap == null) {
        //EXIT
      } else if (this.returnSnap.isEngaged) {
        DrawMark.pointCaptureHalo(this.context, this.returnSnap.point, 'rgba(0%, 70%, 0%, 0.5)', 12, 2)
      } else {
        DrawMark.pointCaptureHalo(this.context, this.returnSnap.point, 'rgba(0%, 70%, 0%, 0.5)', 7, 1)
      }
    }

    const setModifiedCursorAlongCirclePath = (radius, mouseX, mouseY) => {
      const angl = Public.getAngle(this.centerPoint, {
        x: mouseX,
        y: mouseY
      })
      const modifiedCursor = Public.getEndPoint(this.centerPoint, radius, angl)
      return modifiedCursor
    }

    const getModifiedCursorAlongCirclePath = (radius, mouseX, mouseY) => {
      const angl = Public.getAngle(this.centerPoint, {
        x: mouseX,
        y: mouseY
      })
      const modifiedCursor = Public.getEndPoint(this.centerPoint, radius, angl)
      return modifiedCursor
    }


    const getDirection = (arcLine) => {
      const dir = Public.getArcDirection(arcLine.beginPoint, this.centerPoint, arcLine.endPoint)
      if (dir < 0) {
        return direction.counterclockwise
      } else {
        return direction.clockwise
      }
    }


    const refreshArcParameterCollection = () => {
      let newArcParametersCollection = []
      this.radiiLineCollection.map(radiusLine => {

        newArcParametersCollection = newArcParametersCollection.concat(this.getArcParameterCollection(radiusLine))
      })
      this.arcParameterCollection = newArcParametersCollection
    }
    const getArcLineAngle = (arcLine) => {
      const a1 = Public.getAngle(this.centerPoint, arcLine.beginPoint)
      var a2 = Public.getAngle(this.centerPoint, arcLine.endPoint)
      if (a2 > a1 && arcLine.direction == 'counterclockwise') {
        a2 = a2 - 360
      } else if (a2 < a1 && arcLine.direction == 'clockwise') {
        a2 = a2 + 360
      }
      return Math.abs(a1 - a2)
    }

    this.insertCircle = (circleShapeData) => {
      let radiusLine = circleShapeData[0]
      circleShapeData.shift()
      const direction = radiusLine.direction
      delete radiusLine.direction
      let deltaX = 0
      let deltaY = 0
      if (this.hasRadiusLinesDrawn) {
        deltaX = radiusLine.beginPoint.x - this.centerPoint.x
        deltaY = radiusLine.beginPoint.y - this.centerPoint.y
        radiusLine.beginPoint.x -= deltaX
        radiusLine.beginPoint.y -= deltaY
        radiusLine.endPoint.x -= deltaX
        radiusLine.endPoint.y -= deltaY
        this.linePen.lineCollection.push(radiusLine)
        this.linePen.connect(this.linePen.firstLine.beginPoint, this.linePen.lastLine.beginPoint)
      } else {
        this.linePen.lineCollection.push(radiusLine)
      }
      radiusLine = this.linePen.lastLine
      const arcLineCollection = circleShapeData.map(line => {
        return {
          beginPoint: {
            x: line.beginPoint.x - deltaX,
            y: line.beginPoint.y - deltaY
          },
          endPoint: {
            x: line.endPoint.x - deltaX,
            y: line.endPoint.y - deltaY
          },
          direction: direction,
          radiusLine: radiusLine
        }
      })
      this.linePen.lineCollection = this.linePen.lineCollection.concat(arcLineCollection)
      this.refreshArcParameterCollection()
    }
    if (circleShapeData) {
      const isMultipleCircleShapes = isArrayOfArrays(circleShapeData)
      if (isMultipleCircleShapes) {
        circleShapeData.forEach(circleShape => {
          this.insertCircle(circleShape)
        })
      } else {
        this.insertCircle(circleShapeData)
      }

    }

    /** CHANGE STATE OF ARC LINES  ------\*/
    const adjustArcLines = (toRadiusLine, radius, startRotateAngle, connectedArcLinesClone) => {
      const rotationAngle = Public.getAngle(this.centerPoint, toRadiusLine.endPoint) - startRotateAngle
      for (let i = 0; i < connectedArcLinesClone.length; i++) {
        const ln = this.gatherConnectedArcLines(toRadiusLine)[i]
        const lineClone = connectedArcLinesClone[i]
        const angleToBeginPoint = Public.getAngle(this.centerPoint, lineClone.beginPoint) + rotationAngle
        const angleToEndPoint = Public.getAngle(this.centerPoint, lineClone.endPoint) + rotationAngle
        const newBeginPoint = Public.getEndPoint(this.centerPoint, radius, angleToBeginPoint)
        const newEndPoint = Public.getEndPoint(this.centerPoint, radius, angleToEndPoint)
        ln.beginPoint.x = newBeginPoint.x
        ln.beginPoint.y = newBeginPoint.y
        ln.endPoint.x = newEndPoint.x
        ln.endPoint.y = newEndPoint.y
      }
    }

    // const repositionArcOrigin = (radiusLine)=> {
    //     if(this.hasArcLinesDrawn === false){
    //         return
    //     }
    //     const pt = this.gatherConnectedArcLines(radiusLine)[0].beginPoint
    //     radiusLine.endPoint.x = pt.x
    //     radiusLine.endPoint.y = pt.y
    // }

    const arcPointModifyStandard_setMouseDragMouseRelease = (selectedArcPoints, primaryArcPoint, logStatement) => {
      logMessage(logStatement)
      let selectedArcPointInfo = [{
        radius: Public.getLengthTwoPoints(this.centerPoint, primaryArcPoint),
        startRotateAngle: Public.getAngle(this.centerPoint, primaryArcPoint),
        arcPoint: primaryArcPoint
      }]
      selectedArcPoints.map(arcPoint => {
        if (arcPoint === primaryArcPoint) {
          //EXIT
        } else {
          const APInfo = {
            radius: Public.getLengthTwoPoints(this.centerPoint, arcPoint),
            startRotateAngle: Public.getAngle(this.centerPoint, arcPoint),
            arcPoint: arcPoint
          }
          selectedArcPointInfo.push(APInfo)
        }
      })
      this.returnSnap = {
        point: {
          x: primaryArcPoint.x,
          y: primaryArcPoint.y
        },
        isEngaged: null,
        proximityDistance: 5
      }
      this.defineEventFunction({
        mouseDragBegin: () => {
          logMessage("     move arc point")
        }
      })
      this.defineEventFunction({
        mouseDragContinue: (mouseDragPoint = {
          x: this.context.mouseX,
          y: this.context.mouseY
        }) => {
          /** BELOW  IS TO SET CONTROL PATH OF CURSOR, IF CALLED UPON (CHANGE mouseX & mouseY) */
          const cursorDist = Public.getLengthTwoPoints({
            x: mouseDragPoint.x,
            y: mouseDragPoint.y
          }, this.returnSnap.point)
          let angleDelta
          if (cursorDist < this.returnSnap.proximityDistance) {
            this.returnSnap.isEngaged = true
            angleDelta = 0
          } else {
            const angl = Public.getAngle(this.centerPoint, {
              x: mouseDragPoint.x,
              y: mouseDragPoint.y
            })
            this.returnSnap.isEngaged = false
            angleDelta = angl - selectedArcPointInfo[0].startRotateAngle
          }
          selectedArcPointInfo.map((APInfo, index) => {
            const newPoint = Public.getEndPoint(this.centerPoint, APInfo.radius, angleDelta + APInfo.startRotateAngle)
            APInfo.arcPoint.x = newPoint.x
            APInfo.arcPoint.y = newPoint.y
          })
          refreshArcParameterCollection()
        }
      })
      this.defineEventFunction({
        mouseRelease: () => {
          refreshArcParameterCollection()
          if (mouseDidDrag) {
            mouseReleaseStandardFunction()
          }
          if (this.returnSnap.isEngaged) {
            logMessage("     mouse was released without any arc point change being made")
          }
          this.returnSnap = null
        }
      })
    }

    /**--------------------MUST PROVIDE & DEFINED BELOW-------------------------*/
    this.mousePressSetup = () => {
      /** OPTIONAL
      ANY PROCEDURAL CODE PROVIDED HERE 
      WILL RUN IMEADIATELY UPON MOUSE PRESS
      */
    }
    this.userInitializer = {

      evaluateRequirements: (nothingIsDrawnYet = this.linePen.lineCollection.length == 0) => {
        return nothingIsDrawnYet
      }, //   PURE FUNCTION
      execute: (mousePressPoint) => {
        logMessage("case 0: user to initialize radii line series")
        /** USER TO DRAW CIRCLE */

        // this.linePen.sendMousePress({x: this.context.mouseX , y: this.context.mouseY})

        this.linePen.sendMousePress(mousePressPoint)

        this.defineEventFunction({
          mouseDragContinue: (mouseDragPoint = {
            x: this.context.mouseX,
            y: this.context.mouseY
          }) => {
            this.linePen.sendMouseDrag(mouseDragPoint)
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            this.linePen.sendMouseRelease()
            mouseReleaseStandardFunction()
          }
        })
      },

    }

    this.mousePressEventStack = {
      mouseClickedOnFullySelected: {
        evaluate: (mousePressPoint, runFunction, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          if (this.arcOriginPointCollection.length == 0) {
            return
          }

          const fullPointCount = this.arcPointCollection.length + 1 + this.radiiLineCollection.length
          const selectedPointCount = this.linePen.selectedPoints.size
          const isFullySelected = selectedPointCount === fullPointCount
          if (isFullySelected === false) {
            return
          }

          /**-------------------GET FINDINGS**/
          const findings = (() => {
            const fullPointCollection = this.arcPointCollection.slice()
            fullPointCollection.push(this.centerPoint)

            const pointTapped = Public.getUserMouseClickOnPoint(
              mousePressPoint,
              this.proximityDistance,
              fullPointCollection)
            if (pointTapped) {
              const result = {
                eventKey: eventKey
              }
              result.pointTapped = pointTapped
              result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped)
              result.modifiedPressPoint = pointTapped
              return result
            }
          })()

          /**-------------------RETURN FINDINGS**/
          if (findings && runFunction !== undefined) {
            runFunction()
          }
          return findings
        },
        execute: () => {
          logMessage("case 1: initiate move of aperatus")
          this.returnSnap = {
            point: {
              x: this.userMousePressInfo.modifiedPressPoint.x,
              y: this.userMousePressInfo.modifiedPressPoint.y
            },
            isEngaged: null,
            proximityDistance: this.proximityDistance
          }
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {
              const cursorDist = Public.getLengthTwoPoints(mouseDragPoint, this.returnSnap.point)
              if (cursorDist < this.returnSnap.proximityDistance) {
                mouseDragPoint.x = this.returnSnap.point.x
                mouseDragPoint.y = this.returnSnap.point.y
                this.returnSnap.isEngaged = true
              } else {
                this.returnSnap.isEngaged = false
              }
              this.linePen.dragMoveSelectedPoints(mouseDragPoint)
              refreshArcParameterCollection()
            }
          })
          this.defineEventFunction({
            mouseReleaseWithoutDrag: () => {
              if (this.returnSnap.isEngaged) {
                logMessage("     1a: mouse was released without any move being made")
              }
              mouseReleaseStandardFunction()
              this.returnSnap = null
            }
          })
          this.defineEventFunction({
            mouseReleaseAfterDrag: () => {
              mouseReleaseStandardFunction()
              this.returnSnap = null
            }
          })

        }
      },
      /**-------------------------------------------------------------*/
      mouseClickedNoPointsWhilePointsWereSelected: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          if (this.hasSelectedPoints === false) {
            return
          }
          /**-------------------GET FINDINGS**/
          const findings = (() => {
            const fullPointCollection = this.arcPointCollection.slice()
            fullPointCollection.push(this.centerPoint)
            const pointTapped = Public.getUserMouseClickOnPoint(
              mousePressPoint,
              this.proximityDistance,
              fullPointCollection)
            if (pointTapped) {
              return
            }
            return {
              eventKey: eventKey
            }
          })()
          return findings
        },
        execute: () => {
          logMessage("case 2: clear all selected points")
          this.defineEventFunction({
            mouseRelease: () => {
              this.linePen.selectedPoints.clear()
              this.linePen.selectedLines.clear()
            }
          })
        }
      },
      /**-------------------------------------------------*/
      mouseClickedOnCenterPoint: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          /**-------------------GET FINDINGS**/
          const findings = (() => {
            const pointTapped = Public.getUserMouseClickOnPoint(mousePressPoint, this.proximityDistance, [this.centerPoint])
            if (pointTapped) {
              const result = {
                eventKey: eventKey
              }
              result.centerPoint = pointTapped
              result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped)
              result.modifiedPressPoint = pointTapped
              return result
            }
          })()
          return findings
        },
        execute: () => {
          logMessage("case 3: draw new radius line for new concentric circle")
          this.linePen.enableSnap = true
          this.linePen.sendMousePress(this.centerPoint)
          var newRadius
          const lineCount = this.linePen.lineCount

          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {
              if (this.linePen.selectedPoints.size == 1 && [...this.linePen.selectedPoints][0] === this.centerPoint) {
                logMessage("     3a) draw command is switched to Select all")
                this.linePen.selectAll()
                this.returnSnap = {
                  point: {
                    x: this.centerPoint.x,
                    y: this.centerPoint.y
                  },
                  isEngaged: null,
                  proximityDistance: 5

                }
              } else {
                newRadius = Public.getLengthTwoPoints(this.linePen.lastLine.beginPoint, this.linePen.lastLine.endPoint)
              }
              setMousePointToSnapPointIfInProximity(mouseDragPoint, this.returnSnap)

              this.linePen.sendMouseDrag(mouseDragPoint)
              refreshArcParameterCollection()
            }
          })
          this.defineEventFunction({
            mouseReleaseWithoutDrag: () => {
              logMessage("     3c) select all points")
              this.linePen.selectAll()
              this.returnSnap = null
            }
          })
          this.defineEventFunction({
            mouseReleaseAfterDrag: () => {
              const newRadiusIsTooSmall = newRadius < this.minimumNewRadiusLength
              if (newRadiusIsTooSmall && mouseDidDrag) {
                logMessage("     3b) new radius is too small and is to be deleted")
                this.linePen.selectAll()
                if (this.linePen.lineCount - lineCount == 1) {
                  this.linePen.clearSelectedPoints()
                  this.linePen.deleteLastLine()
                  this.linePen.selectAll()
                }
                return
              }
              mouseReleaseStandardFunction()
              this.returnSnap = null
              // JSON.stringify(this.linePen.lineCollection)
              // log(this.linePen.lineCollection)
              // log(this.linePen.nodeCollection)
            }
          })
        }
      },
      /**-------------------------------------------------*/
      mouseClickedOnArcOrigin: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          if (this.hasSelectedPoints) {
            return
          }
          if (this.arcOriginPointCollection.length == 0) {
            return
          }
          /**-------------------GET FINDINGS**/
          const findings = (() => {

            const arcOriginPoints = this.arcOriginCollection
            // print(arcOriginPoints)
            const pointTapped = Public.getUserMouseClickOnPoint(mousePressPoint, this.proximityDistance, arcOriginPoints)
            if (pointTapped) {
              const result = {
                eventKey: eventKey
              }
              result.arcOrigin = pointTapped
              result.radiusLine = pointTapped.radiusLine
              result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped)
              result.modifiedPressPoint = pointTapped
              return result
            }
          })()
          return findings
        },
        execute: (userMousePressInfo = this.userMousePressInfo) => {
          logMessage("case 4: select arc origin point")
          this.linePen.selectedPoints.append(userMousePressInfo.modifiedPressPoint)
          const mousePressPoint = userMousePressInfo.modifiedPressPoint
          /** MAKE AND STORE A RECORD OF CONNECTED ARC LINES -----\*/
          const userMouseClickedOnDrawCircle = getMouseClickedOnDrawCircle(mousePressPoint)
          userMouseClickedOnDrawCircle.connectedArcLinesClone = JSON.parse(
            JSON.stringify(this.gatherConnectedArcLines(userMousePressInfo.radiusLine)))
          const radius = Public.getLengthTwoPoints(
            userMousePressInfo.radiusLine.beginPoint,
            userMousePressInfo.radiusLine.endPoint)
          this.returnSnap = {
            point: {
              x: userMousePressInfo.modifiedPressPoint.x,
              y: userMousePressInfo.modifiedPressPoint.y
            },
            isEngaged: null,
            proximityDistance: 5
          }

          userMouseClickedOnDrawCircle.angle = Public.getAngle(this.centerPoint, this.returnSnap.point)
          const reset = true
          cursorTravel.totalDistance({
            x: this.context.mouseX,
            y: this.context.mouseY
          }, reset)
          let cursorHasBrokenSnap = false
          let otherSelectedRadiusLines = new Set([...this.selectedRadiusLines])
          otherSelectedRadiusLines.delete(userMousePressInfo.radiusLine)
          otherSelectedRadiusLines = [...otherSelectedRadiusLines]

          const otherArcOriginPointInfo = []

          otherSelectedRadiusLines.map(radiusLine => {
            const RLInfo = {
              radiusLine: radiusLine,
              radius: Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint),
              startRotateAngle: Public.getAngle(this.centerPoint, radiusLine.endPoint),
              connectedArcLinesClone: JSON.parse(JSON.stringify(this.gatherConnectedArcLines(radiusLine)))
            }
            otherArcOriginPointInfo.push(RLInfo)
          })

          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {
              const cursorTravelTotalDistance = cursorTravel.totalDistance(mouseDragPoint)
              const cursorDist = Public.getLengthTwoPoints(mouseDragPoint, this.returnSnap.point)
              if (cursorDist < this.returnSnap.proximityDistance) {
                cursorHasBrokenSnap = false
                mouseDragPoint = this.returnSnap.point
                if (this.returnSnap.isEngaged == false) {
                  const reset = true
                  cursorTravel.totalDistance({
                    x: this.context.mouseX,
                    y: this.context.mouseY
                  }, reset)
                } else
                if (cursorTravelTotalDistance == 'over' && cursorHasBrokenSnap == false) {

                  this.linePen.selectedPoints.append(userMousePressInfo.arcOrigin)
                  arcPointModifyStandard_setMouseDragMouseRelease(
                    [userMousePressInfo.arcOrigin],
                    userMousePressInfo.arcOrigin,
                    "   4a: command switched to select arc point")
                  return
                }
                this.returnSnap.isEngaged = true
              } else {
                cursorHasBrokenSnap = true
                // setModifiedCursorAlongCirclePath(radius, mouseX, mouseY)
                mouseDragPoint = getModifiedCursorAlongCirclePath(radius, this.context.mouseX, this.context.mouseY)
                this.returnSnap.isEngaged = false
              }
              const anglePrevious = Public.getAngle(this.centerPoint, userMousePressInfo.radiusLine.endPoint)
              userMousePressInfo.radiusLine.endPoint.x = mouseDragPoint.x
              userMousePressInfo.radiusLine.endPoint.y = mouseDragPoint.y
              const angleNew = Public.getAngle(this.centerPoint, userMousePressInfo.radiusLine.endPoint)
              const angleDisplacement = angleNew - anglePrevious
              otherArcOriginPointInfo.map(info => {
                const radiusLine = info.radiusLine
                const point = radiusLine.endPoint
                const newAngle = Public.getAngle(this.centerPoint, point) + angleDisplacement
                const newPT = Public.getEndPoint(this.centerPoint, info.radius, newAngle)
                point.x = newPT.x
                point.y = newPT.y
                adjustArcLines(radiusLine, info.radius, info.startRotateAngle, info.connectedArcLinesClone)
              })
              adjustArcLines(userMouseClickedOnDrawCircle.radiusLine,
                userMouseClickedOnDrawCircle.radius,
                userMouseClickedOnDrawCircle.angle,
                userMouseClickedOnDrawCircle.connectedArcLinesClone)
              refreshArcParameterCollection()
            }
          })
          this.defineEventFunction({
            mouseRelease: () => {
              // if (mouseDidDrag == false) {
              //     logMessage("     4b: hold selection")
              // } else {
              //     this.linePen.selectedPoints.removeAll()
              //     this.selectedRadiusLines.clear()
              // }
              this.linePen.selectedPoints.removeAll()
              this.selectedRadiusLines.clear()
              const reset = true
              cursorTravel.totalDistance({
                x: 0,
                y: 0
              }, reset)
              if (this.returnSnap.isEngaged) {
                logMessage("     4c: mouse was released without any rotation change being made")
              }
              this.returnSnap = null
            }
          })
        }
      },
      /**----------------------------------------------------------------------*/
      mouseClickedOnArcPointWithOtherArcPointsSelected: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          if (this.arcLineCollection.length === 0) {
            return
          }
          if (this.hasSelectedPoints === false) {
            return
          }
          /**-------------------GET FINDINGS**/
          const pointTapped = getMouseClickOnArcPoint(mousePressPoint)
          const findings = (() => {
            if (pointTapped) {
              const result = {
                eventKey: eventKey
              }
              result.arcPoint = pointTapped.arcPoint
              result.modifiedPressPoint = pointTapped.arcPoint
              result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped.arcPoint)
              return result
            }
          })()
          return findings
        },
        execute: (userMousePressInfo = this.userMousePressInfo) => {
          logMessage("case 5: add to arc point selection")
          this.linePen.selectedPoints.append(userMousePressInfo.arcPoint)
          arcPointModifyStandard_setMouseDragMouseRelease(
            this.linePen.selectedPointCollection,
            userMousePressInfo.arcPoint,
            "   5a: move point")
        }
      },
      /**-------------------------------------------------*/
      mouseClickedOnArcPoint: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          if (this.arcLineCollection.length === 0) {
            return
          }

          /**-------------------GET FINDINGS**/
          const pointTapped = getMouseClickOnArcPoint(mousePressPoint)
          const findings = (() => {
            if (pointTapped) {
              const result = Object.assign({
                eventKey: eventKey
              }, pointTapped)

              return result
            }
          })()
          return findings
        },
        execute: (userMousePressInfo = this.userMousePressInfo) => {
          logMessage("case 6: select arc point")
          this.returnSnap = {
            point: {
              x: userMousePressInfo.arcPoint.x,
              y: userMousePressInfo.arcPoint.y
            },
            isEngaged: null,
            proximityDistance: this.proximityDistance
          }
          this.linePen.selectedPoints.append(userMousePressInfo.arcPoint)
          arcPointModifyStandard_setMouseDragMouseRelease(
            this.linePen.selectedPointCollection,
            userMousePressInfo.arcPoint,
            "   6a: move point")
        }
      },
      /**-------------------------------------------------*/
      mouseClickedOnDrawCircle: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          /**-------------------GET FINDINGS**/
          const findings = (() => {
            if (this.hasRadiusLinesDrawn === false) {
              return null
            }
            var closestDistance = this.proximityDistance
            let result
            const evaluateRadiusLine = (radiusLine) => {
              const radius = Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint)
              const dist = Public.getDistanceTwoPoints(this.centerPoint , mousePressPoint )
              const diff = Math.abs(radius - dist)
              if (diff <= closestDistance) {
                closestDistance = diff
                const angl = Public.getAngle(this.centerPoint, mousePressPoint)
                const modifiedPressPoint = Public.getEndPoint(this.centerPoint, radius, angl)
                result = {
                  eventKey: eventKey,
                  modifiedPressPoint: modifiedPressPoint,
                  distanceOffset: Public.getLengthTwoPoints(mousePressPoint, modifiedPressPoint),
                  radiusLine: radiusLine,
                  angle: angl,
                  radius: radius
                }
              }
            }
            this.radiiLineCollection.map(line => {
              evaluateRadiusLine(line)
            })
            return result
          })()
          return findings
        },
        execute: (userMousePressInfo = this.userMousePressInfo) => {
          logMessage("case 7: draw free arc")
          const arcDirectionLockGate = {
            gate: 2.70,
            arcLineAngle: null
          }
          let commandSwitchFlag = false
          /** MAKE AND STORE A RECORD OF CONNECTED ARC LINES -----\*/
          const arcLineRecord = this.gatherConnectedArcLines(userMousePressInfo.radiusLine)
          userMousePressInfo.connectedArcLinesClone = JSON.parse(JSON.stringify(arcLineRecord))
          /** MOVE THE RADIUSLINE FOR THE CIRCLE TAPPED ON TO THE POINT OF CONTACT -----\*/

          userMousePressInfo.radiusLine.endPoint.x = userMousePressInfo.modifiedPressPoint.x
          userMousePressInfo.radiusLine.endPoint.y = userMousePressInfo.modifiedPressPoint.y

          this.linePen.sendMousePress(this.userMousePressInfo.modifiedPressPoint)
          const radiusLineAngle = Public.getLineAngle(userMousePressInfo.radiusLine)
          this.returnSnap = {
            point: {
              x: userMousePressInfo.radiusLine.endPoint.x,
              y: userMousePressInfo.radiusLine.endPoint.y
            },
            isEngaged: null,
            proximityDistance: 5
          }
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {
              const lineCount = this.linePen.lineCollection.length
              /** LINEPEN, WHEN PUSHED, CAN AUTOMATICLY SWITCH FROM DRAW OF NEW ARC TO TO MOVE OF RADIUS */
              const linePenCommandHasSwitched = this.linePen.selectedPoints.size == 1
              /** BELOW  IS TO SET CONTROL PATH OF CURSOR */
              var pathPoint
              if (linePenCommandHasSwitched) {
                const mouseDist = Public.getLengthTwoPoints(this.centerPoint, mouseDragPoint)
                let modifiedCursorPathPoint = Public.getEndPoint(this.centerPoint, mouseDist, radiusLineAngle)
                const cursorDist = Public.getLengthTwoPoints(mouseDragPoint, this.returnSnap.point)
                if (cursorDist < this.returnSnap.proximityDistance) {
                  modifiedCursorPathPoint.x = this.returnSnap.point.x
                  modifiedCursorPathPoint.y = this.returnSnap.point.y
                  this.returnSnap.isEngaged = true
                } else {
                  this.returnSnap.isEngaged = false
                }
                pathPoint = {
                  x: modifiedCursorPathPoint.x,
                  y: modifiedCursorPathPoint.y
                }
                if (commandSwitchFlag == false) {
                  commandSwitchFlag = true
                  logMessage("     7a) draw of new arc is canceled; command switched to edit of radius")
                }
              } else {
                const angl = Public.getAngle(this.centerPoint, mouseDragPoint)
                const modifiedCursorPathPoint = Public.getEndPoint(this.centerPoint, userMousePressInfo.radius, angl)
                pathPoint = {
                  x: modifiedCursorPathPoint.x,
                  y: modifiedCursorPathPoint.y
                }
              }

              /** PUSH LINEPEN */
              this.linePen.sendMouseDrag(pathPoint)
              /** CORRECT FOR ERROR COMING FROM onUserMouseDrag ABOVE; (IM WITH STUPID) */
              const point = [...this.linePen.selectedPoints][0]
              if (point) {
                point.x = pathPoint.x
                point.y = pathPoint.y
                const ang = Public.getAngle(this.centerPoint, point)
              }
              const newLineHasJustBeenCreated = this.linePen.lineCollection.length == lineCount + 1
              if (newLineHasJustBeenCreated && userMousePressInfo != null) {
                this.linePen.lastLine.radiusLine = userMousePressInfo.radiusLine
              }
              const ln = userMousePressInfo.radiusLine
              adjustArcLines(
                userMousePressInfo.radiusLine,
                Public.getLengthTwoPoints(ln.beginPoint, ln.endPoint),
                radiusLineAngle,
                userMousePressInfo.connectedArcLinesClone)
              if (commandSwitchFlag) {
                //EXIT  
              } else if (this.lastArcLine /** EXISTS */ ) {
                const direction = getDirection(this.lastArcLine)
                const ang1 = Public.getAngleFromThreePoints(
                  this.lastArcLine.beginPoint,
                  this.centerPoint,
                  this.lastArcLine.endPoint)
                // const currentArcLineAngle = round5(this.lastArcLineAngle)
                //Math.ceil(n / 5) * 5
                const currentArcLineAngle = Math.ceil(this.lastArcLineAngle / 5) * 5
                const arcIsPastGate = ang1 > arcDirectionLockGate.gate
                const arcIsNotPastGate = arcIsPastGate == false
                const arcLineAngleDoesNotExist = arcDirectionLockGate.arcLineAngle == null
                const arcLineAngleMatches = currentArcLineAngle == arcDirectionLockGate.arcLineAngle
                var allowChangeInDirection = false
                if (arcIsPastGate && this.linePen.enableUserCommandToSwitch == true) {
                  this.linePen.enableUserCommandToSwitch = false
                  logMessage("     7b) command switching is canceled; to stay with drawing arc")
                }
                if (arcIsPastGate && arcLineAngleDoesNotExist) {
                  arcDirectionLockGate.arcLineAngle = currentArcLineAngle
                  allowChangeInDirection = false
                }
                if (arcIsNotPastGate && arcLineAngleMatches) {
                  arcDirectionLockGate.arcLineAngle = null
                  allowChangeInDirection = true
                }
                if (arcIsNotPastGate && arcLineAngleDoesNotExist) {
                  allowChangeInDirection = true
                }
                if (allowChangeInDirection) {
                  this.lastArcLine.direction = direction
                }
              }
              refreshArcParameterCollection()
            }
          })

          this.defineEventFunction({
            mouseRelease: () => {

              this.linePen.enableUserCommandToSwitch = true
              setArcOriginPointsCollection()
              this.returnSnap = null
              mouseReleaseStandardFunction()
              // repositionArcOrigin(this.userMousePressInfo.radiusLine)
            }
          })

        }
      },
      /**-------------------------------------------------*/
      mouseClickedOnRadiusLine: {
        evaluate: (mousePressPoint, eventKey) => {
          /**------------------GUARD STATEMENTS**/
          if (this.hasRadiusLinesDrawn === false) {
            return
          }
          /**-------------------GET FINDINGS**/
          const findings = (() => {
            const lineTapped = Public.getUserMouseClickOnLine(mousePressPoint, this.proximityDistance, this.radiiLineCollection)
            if (lineTapped) {
              const result = {
                eventKey: eventKey
              }
              result.radiusLine = lineTapped
              result.distanceOffset = Public.getPointDistanceToLine(mousePressPoint, lineTapped)
              result.modifiedPressPoint = Public.getPerpendicularPoint(lineTapped, mousePressPoint)
              return result
            }
          })()
          return findings
        },
        execute: (userMousePressInfo = this.userMousePressInfo) => {
          logMessage("case 8: begin rotate of arc")
          const mouseClickedRadiusLine = userMousePressInfo.radiusLine
          const selectionIsFull = this.selectedRadiusLines.size == this.radiiLineCollection.length
          const tappedRadiusLineIsPrimary = mouseClickedRadiusLine === [...this.selectedRadiusLines][0]
          const lineIsAlreadySelected = this.selectedRadiusLines.has(mouseClickedRadiusLine)
          let radius;
          let arcOriginPointInfo = []

          this.defineEventFunction({
            mouseDragBegin: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {
              // logMessage("     8b: start rotate circle apperatus")
              /** SELECT ALL RADIUS LINES */
              this.selectedRadiusLines.clear()
              this.selectedRadiusLines.add(mouseClickedRadiusLine)
              this.radiiLineCollection.map(radiusLine => {
                this.selectedRadiusLines.add(radiusLine)
              })
              const anchorPoint = Public.getPerpendicularPoint(mouseClickedRadiusLine, mouseDragPoint)
              this.returnSnap = {
                point: {
                  x: anchorPoint.x,
                  y: anchorPoint.y
                },
                isEngaged: null,
                proximityDistance: 5
              }
              radius = Public.getLengthTwoPoints(this.centerPoint, mouseClickedRadiusLine.endPoint)
              const selectedRadiusLines = [...this.selectedRadiusLines]
              selectedRadiusLines.map(radiusLine => {
                const RLInfo = {
                  radiusLine: radiusLine,
                  radius: Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint),
                  startRotateAngle: Public.getAngle(this.centerPoint, radiusLine.endPoint),
                  connectedArcLinesClone: JSON.parse(JSON.stringify(this.gatherConnectedArcLines(radiusLine)))
                }
                arcOriginPointInfo.push(RLInfo)
              })
            }
          })

          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint = {
              x: this.context.mouseX,
              y: this.context.mouseY
            }) => {

              const cursorDist = Public.getLengthTwoPoints({
                x: mouseDragPoint.x,
                y: mouseDragPoint.y
              }, this.returnSnap.point)
              if (cursorDist < this.returnSnap.proximityDistance) {
                mouseDragPoint.x = this.returnSnap.point.x
                mouseDragPoint.y = this.returnSnap.point.y
                this.returnSnap.isEngaged = true
              } else {
                setModifiedCursorAlongCirclePath(radius, mouseDragPoint.x, mouseDragPoint.y)
                this.returnSnap.isEngaged = false
              }
              const primaryArchLine = arcOriginPointInfo[0]
              const cursorAngle = Public.getAngle(this.centerPoint, mouseDragPoint)
              const newRadiusLineEndpoint = Public.getEndPoint(this.centerPoint, primaryArchLine.radius, cursorAngle)
              const anglePrevious = Public.getAngle(this.centerPoint, primaryArchLine.radiusLine.endPoint)

              primaryArchLine.radiusLine.endPoint.x = newRadiusLineEndpoint.x
              primaryArchLine.radiusLine.endPoint.y = newRadiusLineEndpoint.y
              const angleNew = Public.getAngle(this.centerPoint, primaryArchLine.radiusLine.endPoint)
              const angleDisplacement = angleNew - anglePrevious
              arcOriginPointInfo.map((info, index) => {
                if (index > 0) {
                  const radiusLine = info.radiusLine
                  const point = radiusLine.endPoint
                  const newAngle = Public.getAngle(this.centerPoint, point) + angleDisplacement
                  const newPT = Public.getEndPoint(this.centerPoint, info.radius, newAngle)
                  point.x = newPT.x
                  point.y = newPT.y
                  adjustArcLines(radiusLine, info.radius, info.startRotateAngle, info.connectedArcLinesClone)
                }
              })
              adjustArcLines(primaryArchLine.radiusLine, primaryArchLine.radius,
                primaryArchLine.startRotateAngle,
                primaryArchLine.connectedArcLinesClone)
              refreshArcParameterCollection()
            }
          })

          this.defineEventFunction({
            mouseReleaseAfterDrag: () => {
              this.selectedRadiusLines.clear()
              if (this.returnSnap.isEngaged) {
                logMessage("     8f: mouse was released without any rotation being made")
              }
              this.returnSnap = null
            }
          })

          this.defineEventFunction({
            mouseReleaseWithoutDrag: () => {
              if (selectionIsFull && tappedRadiusLineIsPrimary) {
                logMessage("     8a: remove selected radius line")
                this.selectedRadiusLines.delete(mouseClickedRadiusLine)
              } else if (tappedRadiusLineIsPrimary) {
                logMessage("     8b: select all radius lines")
                this.radiiLineCollection.map(radiusline => {
                  this.selectedRadiusLines.add(radiusline)
                })
              } else if (lineIsAlreadySelected && tappedRadiusLineIsPrimary == false) {
                logMessage("     8c: remove selected radius line")
                this.selectedRadiusLines.delete(mouseClickedRadiusLine)
              } else {
                logMessage("     8d: add selected radius line")
                this.selectedRadiusLines.add(mouseClickedRadiusLine)
              }
            }
          })

        }
      },
    }

  } /** CLOSE CONSTRUCTOR */

  /**-----------------------GETTERS DEFINED BELOW---------------------------*/

  get centerPoint() {
    /* RETURN CENTER POINT OR NULL*/

    if (this.linePen == undefined) {
      return null
    }
    if (this.linePen.nothingIsDrawnYet) {
      return null;
    }
    return this.linePen.getLinePointNodes(this.linePen.lineCollection[0]).beginPointNode
  }

  get nothingIsDrawnYet() {
    return this.linePen.lineCollection.length === 0
  }

  get radiiLineCollection() {
    /*RETURN ARRAY OF LINES*/
    const lines = []
    this.linePen.lineCollection.map(line => {
      const ln = this.linePen.getLinePointNodes(line)
      if (ln.beginPointNode === this.centerPoint) {
        lines.push(line)
      }
    })
    return lines
  }

  get arcLineCollection() {
    /*RETURN ARRAY OF LINES*/
    const lines = []
    this.linePen.lineCollection.map(line => {
      if (line.radiusLine != undefined) {
        lines.push(line)
      }
    })
    return lines
  }

  get arcPointCollection() {
    const points = []
    this.arcLineCollection.map(ln => {
      points.push(ln.beginPoint)
      points.push(ln.endPoint)
    })
    return points
  }

  get hasRadiusLinesDrawn() {
    // print(this.linePen.lineCollection)
    return this.linePen.lineCollection.length > 0
  }

  get selectedRadiusPoint() {
    /*RETURN RADIUS POINT OR NULL*/
    if (this.linePen.selectedPoints.size != 2) {
      return null
    }
    var match = null
    const selectedPoint = [...this.linePen.selectedPoints][0]
    // const selectedPoint = [...this.linePen.selectedPoints][1]
    this.radiiLineCollection.map(pt => {
      if (pt.endPoint === selectedPoint) {
        match = selectedPoint
      }
    })
    return match
  }

  get hasSelectedPoints() {
    /*RETURN RADIUS POINT OR NULL*/
    return this.linePen.hasSelectedPoints
  }

  get lastArcLine() {
    return this.arcLineCollection.slice(-1)[0]
  }
  get lastArcLineAngle() {
    if (this.lastArcLine) {
      return Public.getAngle(this.lastArcLine.beginPoint, this.lastArcLine.endPoint)
    }
    return null
  }

  get selectedArcOriginPoints() {
    if (this.selectedRadiusLines.size == 0) {
      return []
    }
    let arcOriginPoints = []
    const selectedRadiusLines = [...this.selectedRadiusLines]
    selectedRadiusLines.map(radiusLine => {
      const ar = this.gatherConnectedArcLines(radiusLine)
      if (ar[0]) {
        arcOriginPoints.push(ar[0].beginPoint)
      }
    })
    return arcOriginPoints
  }
  get isFullySelected() {
    return this.linePen.selectedPoints.size != this.linePen.lineCollection.length * 2
  }

  get arcOriginCollection() {
    const points = []
    this.radiiLineCollection.map(radiusLine => {
      const arcLines = this.gatherConnectedArcLines(radiusLine)
      if (arcLines.length > 0) {
        arcLines[0].beginPoint.radiusLine = radiusLine
        points.push(arcLines[0].beginPoint)
      }
    })
    return points
  }

  get hasArcLinesDrawn() {
    return this.arcLineCollection.length > 0
  }

  get lineColor() {
    return this.linePen.lineColor
  }

  get selectedPoints() {
    return this.linePen.selectedPoints
  }

  /** PUBLIC FUNCTIONS *******************************************************************/
  gatherConnectedArcLines(radiusLine) {
    const lineCollection = []
    this.linePen.lineCollection.map(ln => {
      if (ln.radiusLine === radiusLine) {
        lineCollection.push(ln)
      }
    })
    return lineCollection
  }

  drawArcs() {
    this.context
      .noFill()
      .strokeWeight(this.drawArcWeight)
      .stroke(this.drawArcColor)
    this.arcParameterCollection.map(thisArc => {
      if (thisArc.direction == 'counterclockwise') {
        this.context.arc(thisArc.x, thisArc.y, thisArc.radius * 2, thisArc.radius * 2, thisArc.beginAngle, thisArc.endAngle)
      } else {
        this.context.arc(thisArc.x, thisArc.y, thisArc.radius * 2, thisArc.radius * 2, thisArc.endAngle, thisArc.beginAngle)
      }
    })
  }
  
  clearSelectedPoints() {
    this.linePen.clearSelectedPoints()
  }
  resetPen() {
    this.linePen.resetPen()
    this.linePen.enableSnap = false
    // this.enableArcOverlap = true
    this.enableUserCommandToSwitch = true
    this.lineColor = 'rgba(50%, 50%, 50%, 0.5)'
  }

  assignPointsToNewArcLine(beginPoint, endPoint, radiusLine) {

    if (this.radiiLineCollection.includes(radiusLine)) {
      //EXIT
    } else {
      logMessage('addArcLine failed: radiusLine entered is not a memeber')
      return
    }

    this.linePen.lineCollection.push({
      beginPoint: beginPoint,
      endPoint: endPoint,
      radiusLine: radiusLine
    })
  }

  insertNewCircle(radiusLine) { // , arcDirection = null, arcBeginPoint = null, arcEndPoint = null

    const newRadiusLine = (() => {
      if (this.centerPoint) {
        const length = Public.getLengthTwoPoints(radiusLine.beginPoint, radiusLine.endPoint)
        const angl = Public.getLineAngle(radiusLine)

        const endPoint = Public.getEndPoint(this.centerPoint, length, angl)
        return {
          beginPoint: {
            x: this.centerPoint.x,
            y: this.centerPoint.y
          },
          endPoint: {
            x: endPoint.x,
            y: endPoint.y
          }
        }
      } else {
        return {
          beginPoint: {
            x: radiusLine.beginPoint.x,
            y: radiusLine.beginPoint.y
          },
          endPoint: {
            x: radiusLine.endPoint.x,
            y: radiusLine.endPoint.y
          },
        }
      }
    })()

    if (this.linePen.hasLinesDrawn) {
      this.linePen.lineCollection.push(newRadiusLine)
      this.linePen.connect(newRadiusLine.beginPoint, this.radiiLineCollection[0].beginPoint)
    } else {
      this.linePen.lineCollection = [newRadiusLine]

    }
    // this.linePen.drawLoop()
    return newRadiusLine
  }
  insertNewArcLine(beginPoint, endPoint, direction, toRadiusLine) {
    if (toRadiusLine === undefined) {
      toRadiusLine = this.radiiLineCollection.slice(-1)[0]
    }
    if (direction !== 'clockwise' || direction !== 'counterclockwise') {
      direction = 'clockwise'
    }

    const arcLine = {
      beginPoint: {
        x: beginPoint.x,
        y: beginPoint.y
      },
      endPoint: {
        x: endPoint.x,
        y: endPoint.y
      },
      radiusLine: toRadiusLine,
      direction: direction
    }
    this.linePen.lineCollection.push(arcLine)
  }
  toJSON() {
    // this.radiiLineCollection
    const circleCollection = []
    if (this.hasRadiusLinesDrawn) {
      this.radiiLineCollection.map(line => {

        const direction = function (arcLineCollection) {
          const hasArcs = arcLineCollection.length > 0

          if (hasArcs) {
            return arcLineCollection[0].direction
          } else {
            return null
          }
        }(this.gatherConnectedArcLines(line))

        let list = [{
          beginPoint: {
            x: line.beginPoint.x,
            y: line.beginPoint.y
          },
          endPoint: {
            x: line.endPoint.x,
            y: line.endPoint.y
          },
          direction: direction
        }]
        const arcCollection = []
        this.gatherConnectedArcLines(line).map(arcLine => {
          arcCollection.push({
            beginPoint: {
              x: arcLine.beginPoint.x,
              y: arcLine.beginPoint.y
            },
            endPoint: {
              x: arcLine.endPoint.x,
              y: arcLine.endPoint.y
            },
          })
        })

        list = list.concat(arcCollection)
        circleCollection.push(JSON.stringify(list))
      })
      return {
        'circleArcCollection': circleCollection,
      }

    } else {
      return {
        'circleArcCollection': 'null',
      }
    }
  }

}