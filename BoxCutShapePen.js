/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  MultiShapePen_01
} from './MultiShapePen_01.js'

import {
  Public
} from './Public.js';
import {
  State
} from './State.js';

import {
  DrawMark
} from './DrawMarks.js';


import {
  PointObservable
} from './ReactiveModules/PointObservable.js';


import {
  PenConstruct
} from './PenConstruct.js'

import {
  rotateGrip
} from './PenTools.js'


// const {
//   log
// } = console

const log = () => {}


const NULL_OBJECT = {
  draw: () => {},
  drawLoop: () => {},
  setGripPoint: () => {},
  toggleOn: () => {}
}
const GHOST_COLOR = 'rgba(0,0,0,.1)'
const LINE_SHAPE_PEN = 'LineShapePen'
const ARC_SHAPE_PEN = 'ArcShapePen'
const BEZIER_SHAPE_PEN = 'BezierShapePen'
const GROUP_SHAPE_PEN = 'GroupShapePen'

export class BoxCutShapePen extends PenConstruct {
  constructor(
    context,
    shape,
    box,
    lineReference//** IF PROVIDED, THEN POSITIONING OF BEGIN POINT.  */
  ) {
    super()
    this.context = context

    //** BOX OPTIONAL CAN BE PASSED AS REFERENCE OF A BOX CONTAINER OBJECT*/
    //** OR OF A SIMPLE BOX TO WHICH ITS OWN BOX CONTAINER OBJECT IS CREATED*/
    const boxContainerIsPassedByReference = !box ? false : box ? box.isBoxContainer === true : false
    let boxContainer = boxContainerIsPassedByReference ? box : null

    this.lineWid = 1;
    this.lineColor = GHOST_COLOR
    this.selectedColor = 'rgba(100%, 0%, 0%, .8)'
    this.shapePen

    const isLineReferenced = function(){
      if(!lineReference)return false
      if(Public.whatThisIs(lineReference.beginPoint)!== 'PointObservable')return false
      if(Public.whatThisIs(lineReference.endPoint)!== 'PointObservable')return false
      return true
    }()

    if(isLineReferenced){
      lineReference.beginPoint.appendDidSet(()=>{conformToLineReference()})
      lineReference.endPoint.appendDidSet(()=>{conformToLineReference()})
    }
    let tempLine
    const conformToLineReference = (line = lineReference)=>{ log('conformToLineReference')
    // log(this.beginPoint.xy)
      //* IF THERE IS NO LINE REFERENCE OBJECT, WE DEFAULT TO USE OF 
      // * CURRENT POINTS AND FORCE THEM TO BOX PARIMETER
      if(!line && this.beginPoint && this.endPoint) line = {beginPoint: this.beginPoint.xy , endPoint: this.endPoint.xy }
      tempLine = line
log(tempLine)
if(lineReference) log(Public.getLineLength(tempLine))
//* BUG
      tempLine = getPoints()
log(tempLine)
      if(!tempLine) return
// log(tempLine.beginPoint)

      const needsToBeFlipped = Math.abs( Public.getLineAngle(line) - Public.getLineAngle(tempLine) ) > 1
      if(needsToBeFlipped){
        tempLine = {beginPoint: tempLine.endPoint , endPoint: tempLine.beginPoint }
      }
      this.beginPoint.xy = tempLine.beginPoint
      this.endPoint.xy = tempLine.endPoint

      // log(this.beginPoint.xy)

      this.beginPoint.lineKey = tempLine.beginPoint.lineKey
      this.endPoint.lineKey = tempLine.endPoint.lineKey
    }

    this.lineIsSelected = false
    this.beginPointIsSelected = false
    this.endPointIsSelected = false

    this.didInitEndPoint = () => {}
    this.getboxContainer = () => {
      if (boxContainer) return boxContainer
      if (!box) { //** CREATE DEFAULT BOX*/
        const offset = 40
        box = {
          x: offset,
          y: offset,
          width: this.context.width - (offset * 2),
          height: this.context.height - (offset * 2)
        }
      }
      const {
        x,
        y,
        width,
        height
      } = box
      const topLeftPoint = {
        x: x,
        y: y,
        id: 'topLeftPoint'
      }
      const topRightPoint = {
        x: x + width,
        y: y,
        id: 'topRightPoint'
      }
      const bottomRightPoint = {
        x: x + width,
        y: y + height,
        id: 'bottomRightPoint'
      }
      const bottomLeftPoint = {
        x: x,
        y: y + height,
        id: 'bottomLeftPoint'
      }
      const left = x
      const right = width + x
      const top = y
      const bottom = height + y
      //** WRITE DEFAULT */
      boxContainer = {
        isBoxContainer : true,
        topLine: {
          beginPoint: topLeftPoint,
          endPoint: topRightPoint
        },
        rightLine: {
          beginPoint: topRightPoint,
          endPoint: bottomRightPoint
        },
        bottomLine: {
          beginPoint: bottomRightPoint,
          endPoint: bottomLeftPoint
        },
        leftLine: {
          beginPoint: bottomLeftPoint,
          endPoint: topLeftPoint
        },
        centerPoint: {
          x: x + width / 2,
          y: y + height / 2
        },
        side: {
          left,
          right,
          top,
          bottom
        },
        topLeftPoint,
        topRightPoint,
        bottomRightPoint,
        bottomLeftPoint,
        width,
        height
      }
      return boxContainer
    }

    const gatherShapeOutputPoints = (beginPoint, endPoint) => {
      const boxContainer = this.getboxContainer()
      const points = new Set()
      // log(beginPoint)
      points.add(boxContainer[beginPoint.lineKey].endPoint)
      points.add(boxContainer[endPoint.lineKey].beginPoint)

      function getNextLineKey(key) {
        return key === 'topLine' ? 'rightLine' :
          key === 'rightLine' ? 'bottomLine' :
          key === 'bottomLine' ? 'leftLine' :
          key === 'leftLine' ? 'topLine' : null
      }
      const nextLineKey = getNextLineKey(beginPoint.lineKey)
      if (nextLineKey === endPoint.lineKey) return [...points]
      points.add(boxContainer[nextLineKey].endPoint)
      const nextNextLineKey = getNextLineKey(nextLineKey)
      if (nextNextLineKey === endPoint.lineKey) return [...points]
      return [
        [...points][0], boxContainer[nextLineKey].endPoint, [...points][1]
      ]
    }

    const gatherShapeOutputPointsBothSides = () => { 
      const side1 = gatherShapeOutputPoints(this.beginPoint, this.endPoint)
      const side2 = gatherShapeOutputPoints(this.endPoint, this.beginPoint)
      return {
        side1,
        side2
      }
    }

    let arcPoints
    this.side1Color = 'rgba(230,100,100,.5)'

    const drawForm = (boxPoints , insertShape = ()=>{this.context.vertex(this.endPoint.x, this.endPoint.y)})=>{ 
      this.context.strokeWeight(1)
      this.context.fill(this.side1Color)
      this.context.beginShape()
      this.context.vertex(boxPoints[0].x, boxPoints[0].y)
      this.context.vertex(this.beginPoint.x, this.beginPoint.y)
      insertShape()
      const lastPoint = boxPoints[boxPoints.length - 1]
      if (boxPoints.length > 1) this.context.vertex(lastPoint.x, lastPoint.y)
      if (boxPoints.length > 2) this.context.vertex(boxPoints[1].x, boxPoints[1].y)
      this.context.endShape(this.context.CLOSE)
    }
    const renderSide1 = () => {
      const shapeOutput = this.shapePen.shapeOutput || []
      const boxPoints = gatherShapeOutputPointsBothSides().side1
      if (shapeOutput[0] === 'bezier') {
        drawForm(boxPoints , ()=>{
          this.context.bezierVertex(
            shapeOutput[3], shapeOutput[4],
            shapeOutput[5], shapeOutput[6],
            shapeOutput[7], shapeOutput[8])
        })
        return
      }
      
      if (this.shapePen.currentShapeType === ARC_SHAPE_PEN && this.shapePen.currentShape.arcIsEstablished) { 
        this.context.fill(this.side1Color)
        this.context.beginShape()
        this.context.vertex(boxPoints[0].x, boxPoints[0].y)
        this.context.vertex(this.beginPoint.x, this.beginPoint.y)
        if (arcPoints) arcPoints.forEach(point => this.context.vertex(point.x, point.y))
        this.context.vertex(this.endPoint.x, this.endPoint.y)
        const lastPoint = boxPoints[boxPoints.length - 1]
        if (boxPoints.length > 1) this.context.vertex(lastPoint.x, lastPoint.y)
        if (boxPoints.length > 2) this.context.vertex(boxPoints[1].x, boxPoints[1].y)
        this.context.endShape(this.context.CLOSE)
        return
      } 

      if (shapeOutput[0] === 'line' || this.shapePen.currentShapeType === ARC_SHAPE_PEN  ) {
        drawForm(boxPoints)
      }
    }

    this.renderSides = lineReference ? false : true

    this.drawLoop = () => {
      this.init()
      if (!this.context) return

      //** DRAW BOX CONTAINER */
      if(this.renderSides) this.context.fill('rgba(130,100,100,.3)')
      this.shallDrawArcSegmentPoints = false
      this.context.stroke('purple')
      this.context.strokeWeight(1)
      this.context.rect(this.boxContainer.side.left, this.boxContainer.side.top, this.boxContainer.width, this.boxContainer.height)

      //** RENDER SIDE 1 */
      if(!isLineReferenced){
        renderSide1()
        // const pointMarkSize = isLineReferenced ? 4 : 10
        // if (this.beginPoint) DrawMark.pointCaptureHalo(this.context, this.beginPoint.xy, 'purple', pointMarkSize)
        // if (this.endPoint) DrawMark.pointCaptureHalo(this.context, this.endPoint.xy, 'magenta', pointMarkSize)
        this.rotateGrip.draw()
      }

      const pointMarkSize = isLineReferenced ? 4 : 10
      if (this.beginPoint) DrawMark.pointCaptureHalo(this.context, this.beginPoint.xy, 'purple', pointMarkSize)
      if (this.endPoint) DrawMark.pointCaptureHalo(this.context, this.endPoint.xy, 'magenta', pointMarkSize)

      if (this.shapePen) this.shapePen.drawLoop()
      // if (this.shapePen) log(this.shapePen.beginPoint.xy)
      if(this.shallDrawArcSegmentPoints){
        this.context.strokeWeight(2)
        if (arcPoints) arcPoints.forEach(pt => this.context.point(pt.x, pt.y))
        this.context.strokeWeight(1)
      }

      if(this.lineIsSelected){
        this.context.stroke(this.selectedColor)
        this.context.strokeWeight(this.lineWid);
        this.context.line(this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y);
        this.context.stroke(this.lineColor)
      } 
    }

    const refreshArcPoints = () => {
      if (!this.shapePen.direction) return
      arcPoints = Public.generateArcPoints(this.beginPoint, this.endPoint, this.shapePen.centerPoint, this.shapePen.direction)
    }

    // ** INIT FUNCTION
    let isInitailized = false

    this.init = () => { 
      if (!this.context) return
      if (isInitailized) return
      isInitailized = true
      const beginPointXY = {
        x: this.boxContainer.leftLine.beginPoint.x,
        y: this.boxContainer.centerPoint.y
      }
      const endPointXY = {
        x: this.boxContainer.rightLine.beginPoint.x,
        y: this.boxContainer.centerPoint.y
      }
      if (!this.shapePen) this.shapePen = shape || new MultiShapePen_01(context, beginPointXY, endPointXY)


      this.beginPoint = new PointObservable(beginPointXY)
      this.shapePen.beginPoint.appendDidSet(()=>{})
      this.endPoint = new PointObservable(endPointXY)
      this.beginPoint.lineKey = 'leftLine'
      this.endPoint.lineKey = 'rightLine'
      this.beginPoint.didSet = () => {
        if (!this.shapePen) return
        this.shapePen.beginPoint.xy = this.beginPoint.xy
      }
      this.endPoint.didSet = () => {
        if (!this.shapePen) return
        this.shapePen.endPoint.xy = this.endPoint.xy
      }
      this.rotateGrip = rotateGrip(
        this.context, {
          beginPoint: this.beginPoint,
          endPoint: this.endPoint,
        },
        //** SET GRIP LOCATION */
        () => {
          return this.shapeMidPoint
        }
      )
      this.rotateGrip.setGripPoint()

      if(isLineReferenced){
        conformToLineReference()
      }

      this.didInitEndPoint()
    }

    this.reset = () => {
      isInitailized = false
    }

    const getPoints = () => { 
      let lineKeys = ['topLine', 'rightLine', 'bottomLine', 'leftLine']
      const points = []
      lineKeys.forEach(lineKey => {
        const boxLine = this.getboxContainer()[lineKey]
        const intersectionPoint = Public.getLineIntersection(boxLine, tempLine)
        log(intersectionPoint)
        if(!intersectionPoint)return
        intersectionPoint.lineKey = lineKey
        if (Public.getPointIsInsideBox(intersectionPoint, this.boxContainer.side)) points.push(intersectionPoint)
        // if (Public.getPointIsInsideBox(intersectionPoint, this.boxContainer.side)) log(intersectionPoint)
      })
      return {
        beginPoint: points[0] || {x:0,y:0},
        endPoint: points[1] || {x:0,y:0}
      }
    }

    this.mousePressEventStack = {
      mousePressOnRotateGrip: {
        evaluate: (mousePressPoint, isLineReferenced, grip = this.rotateGrip ) => {
          if(isLineReferenced)return
          const result = grip.verifyMousePress(mousePressPoint)
          if (!result) return
          result.grip = grip
          return result
        },
        execute: (info) => { //log('mousePressOnRotateGrip')
          const center = info.grip.centerPoint
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              this.rotateGrip.dragRotate(mouseDragPoint)
              
              const pt2 = Public.getEndPoint(center, 100, this.rotateGrip.angle)
              const beginPointSnapShot = this.beginPoint.xy
              tempLine = {
                beginPoint: center,
                endPoint: pt2
              }
              conformToLineReference(tempLine)
              // tempLine = getPoints()
              // if(!tempLine) return
              // const d1 = Public.getDistanceTwoPoints(beginPointSnapShot, tempLine.beginPoint)
              // const d2 = Public.getDistanceTwoPoints(beginPointSnapShot, tempLine.endPoint)
              // const needsPointsFlipped = d1 > d2
              // if (needsPointsFlipped) tempLine = {
              //   beginPoint: tempLine.endPoint,
              //   endPoint: tempLine.beginPoint
              // }
              
              // this.beginPoint.xy = tempLine.beginPoint
              // this.endPoint.xy = tempLine.endPoint

              // this.beginPoint.lineKey = tempLine.beginPoint.lineKey
              // this.endPoint.lineKey = tempLine.endPoint.lineKey
              refreshArcPoints()
            },
            mouseRelease: () => {
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
            }
          })
        }
      },

      mousePressOnBeginPoint: {
        evaluate: (mousePressPoint, beginPoint = this.beginPoint, isLineReferenced) => {
          if(isLineReferenced)return
          const hit = Public.getUserMouseClickOnPoint(mousePressPoint, 10, [beginPoint.xy])
          if (hit) return {
            point: beginPoint,
            mousePressPoint
          }
        },
        execute: () => {
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              const lineKeys = ['rightLine', 'topLine', 'leftLine', 'bottomLine'].filter(key => key !== this.endPoint.lineKey)
              let newBeginPoint
              const newCutLine = {
                beginPoint: mouseDragPoint,
                endPoint: this.endPoint.xy
              }
              lineKeys.forEach(lineKey => {
                const boxLine = this.boxContainer[lineKey]
                const intersectionPoint = Public.getLineIntersection(boxLine, newCutLine)
                const length = Public.getLineLength({
                  beginPoint: intersectionPoint,
                  endPoint: this.endPoint.xy
                })
                intersectionPoint.lineKey = lineKey
                intersectionPoint.length = length
                if (Public.getPointIsInsideBox(intersectionPoint, this.boxContainer.side)) newBeginPoint = intersectionPoint
              })
              if (!newBeginPoint)return
              this.beginPoint.xy = newBeginPoint
              this.beginPoint.lineKey = newBeginPoint.lineKey
              this.rotateGrip.angle = Public.getAngle(this.beginPoint,this.endPoint)
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
            },
            mouseRelease: () => {
              refreshArcPoints()
            }
          })
        }
      },

      mousePressOnEndPoint: {
        evaluate: (mousePressPoint, isLineReferenced) => {
          if(isLineReferenced)return
          const hit = Public.getUserMouseClickOnPoint(mousePressPoint, 10, [this.endPoint.xy])
          if (hit) return {
            point: this.endPoint,
            mousePressPoint
          }
        },
        execute: () => { //refreshArcPoints
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              const lineKeys = ['rightLine', 'topLine', 'leftLine', 'bottomLine'].filter(key => key !== this.beginPoint.lineKey)
              let newEndPoint
              const newCutLine = {
                endPoint: mouseDragPoint,
                beginPoint: this.beginPoint.xy
              }
              lineKeys.forEach(lineKey => {
                const boxLine = this.boxContainer[lineKey]
                const intersectionPoint = Public.getLineIntersection(boxLine, newCutLine)
                try {
                  intersectionPoint.lineKey = lineKey
                }
                catch(err) {
                  myConsole.innerHTML = 'console: ' +  err.message;
                  console.error(err)
                }
                if (Public.getPointIsInsideBox(intersectionPoint, this.boxContainer.side)) newEndPoint = intersectionPoint
              })
              this.endPoint.xy = newEndPoint
              this.endPoint.lineKey = newEndPoint.lineKey
              this.rotateGrip.angle = Public.getAngle(this.beginPoint,this.endPoint)
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
            },
            mouseRelease: () => {
              refreshArcPoints()
            }
          })
        }
      },
      mouseClickedOnRotateArcGrip : {
        evaluate: (mousePressPoint, shape = this.shapePen, isLineReferenced) => {
          if(isLineReferenced)return
          const result = shape.sendMousePress(mousePressPoint)
          if (!result) return
          if(!result.childEventInfo)return
          if (result.childEventInfo.eventKey !== "mouseClickedOnRotateArcGrip") return
          if (shape) return {
            shape,
            mousePressPoint,
          }
        },
        execute: (info) => { //* mouseClickedOnRotateArcGrip
          
          this.rotateGrip.beginRotate(info.mousePressPoint)
          const center =info.shape.centerPoint
          this.rotateGrip.setGripPoint(center)
          const startAngle = this.rotateGrip.angle
          info.shape.sendMouseRelease()
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => { 
              this.rotateGrip.dragRotate(mouseDragPoint)
              return
              //TODO MAKE ROTATE FUNCTION
            },
            mouseRelease: (mouseReleasePoint) => {
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
              this.rotateGrip.angle = startAngle
              
            },
          })
        }
      },

      mouseClickOnShape: {
        evaluate: (mousePressPoint, shape = this.shapePen, isLineReferenced) => {
          if(isLineReferenced)return
          const result = shape.sendMousePress(mousePressPoint)
          if (!result) return
          if (result.eventKey === "mouseClickOnLine") return
          if (shape) return {
            shape,
            mousePressPoint,
            childEventInfo: result
          }
        },
        execute: (info) => { 
          const {
            shape
          } = info

          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              shape.sendMouseDrag(mouseDragPoint)
             
              refreshArcPoints()
            },
            mouseRelease: (mouseReleasePoint) => {
              shape.sendMouseRelease(mouseReleasePoint)
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
            },
          })
        }
      },

      mouseClickOnLine: {
        evaluate: (mousePressPoint, shape = this.shapePen, proximityDistance = this.proximityDistance, isLineReferenced) => {
          if(isLineReferenced)return
          const result = Public.getUserMouseClickOnLine(mousePressPoint, proximityDistance, [shape.line])
          if (!result) return
          const nearestLinePoint = Public.getPerpendicularPoint(shape.line, mousePressPoint)
          return {
            mousePressPoint,
            lineAngle: Math.round(Public.getLineAngle(shape.line) * 10) / 10,
            nearestLinePoint
          }
        },
        execute: (info) => {
          const endPoint = Public.getEndPoint(info.nearestLinePoint, 100, info.lineAngle)
          tempLine = {
            beginPoint: info.nearestLinePoint,
            endPoint
          }
          const startAngle = Math.round(Public.getAngle(this.beginPoint, this.endPoint))
          this.lineIsSelected = true

          //TODO USE OTHER FUNCTION OF SAME NAME GETPOINTS
          const getPoints = () => {
            let lineKeys = ['topLine', 'rightLine', 'bottomLine', 'leftLine']
            const points = []
            lineKeys.forEach(lineKey => {
              const boxLine = this.boxContainer[lineKey]
              const intersectionPoint = Public.getLineIntersection(boxLine, tempLine)
              intersectionPoint.lineKey = lineKey

              if (Public.getPointIsInsideBox(intersectionPoint, this.boxContainer.side)) points.push(intersectionPoint)
            })
            if(points.length === 0)return null
            const newAngle = Math.round(Public.getAngle(points[0], points[1]))
            return startAngle === newAngle ? points : [points[1], points[0]]
          }

          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(info.mousePressPoint, mouseDragPoint, [tempLine.beginPoint, tempLine.endPoint])
              const points = getPoints()
              if(!points)return
              this.beginPoint.xy = points[0]
              if (!points[1]) console.error('error')
              this.beginPoint.lineKey = points[0].lineKey
              this.endPoint.xy = points[1]
              this.endPoint.lineKey = points[1].lineKey
              this.rotateGrip.setGripPoint()
              refreshArcPoints()
            },
            mouseRelease: () => {
              refreshArcPoints()
              this.lineIsSelected = false
            }
          })
        }
      },
    }
    this.conformToLineReference = conformToLineReference
  } //** CLOSE CONSTRUCTOR */

  get boxCenterPoint() {
    return {
      x: this.context.width / 2,
      y: this.context.height / 2
    }
  }
  get shapeMidPoint() {
    return this.shapePen.midPoint
  }

  get midPoint() {
    return this.shapePen.midPoint
  }

  get angle() {
    return this.shapePen.angle
  }

  get boxContainer (){
    return this.getboxContainer()
  }
  get line (){
    return this.shapePen.line
  }

}