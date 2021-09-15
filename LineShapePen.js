/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

import {
  Public
} from './Public.js'
import {
  State
} from './State.js'
import {
  DrawMark
} from './DrawMarks.js';


import {
  PenConstruct
} from './PenConstruct.js'
import {
  PointObservable
} from './ReactiveModules/PointObservable.js'


const {
  log
} = console

export class LineShapePen extends PenConstruct {
  constructor(
    context,
    beginPoint = null,
    endPoint = null,
    inputs = {}
  ) {

    super()
    this.context = context


    //TODO NEED TO FIND WAY TO ACTIVATE AN INIT WHEN A PLACEHOLDER BEGIN POINT AND END POINT HAVE THIER VALUES SET
    if (beginPoint) {
      this.beginPoint = new PointObservable(beginPoint,this)
    } else {
      this.beginPoint = null
    }
    if (endPoint) {
      this.endPoint = new PointObservable(endPoint,this)
    } else {
      this.endPoint = null
    }

    //TODO DONT THINK BELOW IS BEING CALLED; SHALL CHECK
    this.init = ()=>{
      if(this.beginPoint)this.didInitBeginPoint()
      if(this.endPoint)this.didInitEndPoint()
      this.beginPoint.appendDidSet(this.didSetBeginPoint)
      this.endPoint.appendDidSet(this.didSetEndPoint)
      loadPointObservers()
    }

    this.loadPointObservers = ()=>{
      loadPointObservers()
    }

    let beginPointOrbitAnchoredPointsTool, endPointOrbitAnchoredPointsTool
    this.didSetBeginPoint = () => {}
    this.didSetEndPoint = () => {}
    this.didInitBeginPoint = () => {}
    this.didInitEndPoint = () => {}
    this.didSetLineRotation = () => {}
    this.initialDragAppendFunction = () => {}
    this.minimumNewLineLength = 5

    this.pointsAnchoredToBeginPoint = []
    this.pointsAnchoredToEndPoint = []
    this.rotatePointsAnchoredToBeginPoint = true
    this.rotatePointsAnchoredToEndPoint = true

    this.lineIsSelected = false
    this.beginPointIsSelected = false
    this.endPointIsSelected = false
    this.clearSelectedPoints = () => { 
      this.beginPointIsSelected = false
      this.endPointIsSelected = false
    }

    /**-------------------- DRAW STUFF BELOW ------------------------*/
    this.renderOutput = true
    
    this.lineWid = 1;
    this.pointColor = 'rgba(20%, 20%, 100%, .9)';
    this.pointRadius = 3
    this.lineColor = 'rgba(0%, 0%, 0%, .4)';
    this.selectedColor = 'rgba(100%, 0%, 0%, .8)'
    this.selectedPointColor = 'rgba(100%, 0%, 0%, .8)'
    this.drawLine = function () {
      if (this.hasLineDrawn) {} else {
        return
      }
      if (this.beginPointIsSelected && this.endPointIsSelected) {
        this.context.stroke(this.selectedColor)
      } else {
        this.context.stroke(this.lineColor)
      }
      this.context.strokeWeight(this.lineWid);
      this.context.line(this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y);
    }

    this.drawPoints = () => {
      if (this.hasLineDrawn) {} else {
        return
      }
      this.context
        .fill(this.pointColor)
        .stroke(this.pointColor)
        .strokeWeight(1)
        .stroke('white')
        .circle(this.beginPoint.x, this.beginPoint.y, this.pointRadius)
        .stroke(this.pointColor)
        .circle(this.endPoint.x, this.endPoint.y, this.pointRadius)

      if (this.beginPointIsSelected) {
        DrawMark.pointCaptureHalo(
          this.context,
          /*  atPoint         */
          this.beginPoint,
          /*  rgbColorString  */
          this.selectedPointColor,
          /*  haloRadius      */
          this.pointRadius,
          /*  haloLineWeight  */
          1.5,
        )
      }
      if (this.endPointIsSelected) {
        DrawMark.pointCaptureHalo(
          this.context,
          /*  atPoint         */
          this.endPoint,
          /*  rgbColorString  */
          this.selectedPointColor,
          /*  haloRadius      */
          this.pointRadius,
          /*  haloLineWeight  */
          1.5
        )
      }

    }
    this.drawLinePen = () => {
      if (this.cursorLineSwiper) {
        this.cursorLineSwiper.draw()
      }
      this.drawPoints()
      this.drawLine()
    }
    this.drawLoop = () => {
      if(!this.context)return
      if(!this.beginPoint || !this.endPoint ) return
      if(this.renderOutput && Public.whatThisIs(this) === 'LineShapePen')this.drawOutput(this.context)
      this.drawLinePen()
    }
    /**--------------------CONSTRUCTOR SCOPED VARIABLES/FUNCTIONS DEFINED BELOW------------------------*/
    this.userInitializer = {
      evaluateRequirements: (hasLineDrawn = this.hasLineDrawn) => hasLineDrawn === false, //   PURE FUNCTION

      execute: (mousePressPoint) => { 
        // console.log('init case: user to initialize single line')
        this.beginPoint = new PointObservable({
          x: mousePressPoint.x,
          y: mousePressPoint.y
        },this)
 
        this.beginPoint.didSet = this.didSetBeginPoint
        this.didInitBeginPoint()
        
        this.defineEventFunctions({ 
          mouseDragBegin: (mouseDragPoint) => {
            this.endPoint = new PointObservable({
              x: mouseDragPoint.x,
              y: mouseDragPoint.y
            },this)
            this.endPoint.didSet = this.didSetEndPoint
          },
          mouseDragContinue: (mouseDragPoint) => {
            this.endPoint.xy = mouseDragPoint
            this.initialDragAppendFunction()
            
          },
          mouseRelease: () => { 
            this.lineIsSelected = false
            this.didInitEndPoint()
            loadPointObservers()
          }
        })
      }
    }
    this.cursorLineSwiper = null

    const getPointsAnchoredToBeginPoint = ()=>{
      return this.pointsAnchoredToBeginPoint
    }
    const getPointsAnchoredToEndPoint = ()=>{
      return this.pointsAnchoredToEndPoint
    }

    let pointObserversAlreadyLoaded = false
    const loadPointObservers = ()=>{ 
      if(pointObserversAlreadyLoaded)return
      pointObserversAlreadyLoaded = true
      this.beginPoint.appendDidSet(()=>{ 
        State.movePoints(this.beginPoint.oldValue, this.beginPoint, getPointsAnchoredToBeginPoint())
        if(beginPointOrbitAnchoredPointsTool)beginPointOrbitAnchoredPointsTool.refresh()
        if(endPointOrbitAnchoredPointsTool)endPointOrbitAnchoredPointsTool.refresh()
      })
      this.endPoint.appendDidSet(()=>{ 
        State.movePoints(this.endPoint.oldValue, this.endPoint, getPointsAnchoredToEndPoint() )
        if(beginPointOrbitAnchoredPointsTool)beginPointOrbitAnchoredPointsTool.refresh()
        if(endPointOrbitAnchoredPointsTool)endPointOrbitAnchoredPointsTool.refresh()
      })
    }

    this.setAnchoredPoints = ()=>{ 
      beginPointOrbitAnchoredPointsTool = State.rotatePointsTool(this.line,this.beginPoint, this.pointsAnchoredToBeginPoint )
      endPointOrbitAnchoredPointsTool = State.rotatePointsTool(this.line,this.endPoint, this.pointsAnchoredToEndPoint )
    }

    this.mousePressEventStack = {
      mouseClickedOnPoint: {
        evaluate: (mousePressPoint,
          proximityDistance = this.proximityDistance,
          line = {
            beginPoint: this.beginPoint,
            endPoint: this.endPoint
          } 
        ) => {
          /**------------------GUARD STATEMENTS**/
          if (line === null) return
          /**------------------GET FINDINGS**/
          const findings = (() => {
            let result = {}
            const pointTapped = Public.getUserMouseClickOnPoint(
              mousePressPoint,
              proximityDistance,
              [line.beginPoint, line.endPoint])
            if (pointTapped) {
              const modifiedPressPoint = pointTapped
              result = {}
              result.point = pointTapped
              result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, modifiedPressPoint)
              result.modifiedPressPoint = mousePressPoint
              return result
            }
          })()
          return findings
        },
        execute: (mousePressInfo) => {
          logMessage('case 1: user to drag point')
          const mousePressPoint = mousePressInfo.modifiedPressPoint
          this.beginPointIsSelected = mousePressInfo.point === this.beginPoint
          this.endPointIsSelected = mousePressInfo.point === this.endPoint
          const pointToMove = this.beginPointIsSelected ? [this.beginPoint] : [this.endPoint]
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(mousePressPoint, mouseDragPoint, pointToMove)
            }
          })
          this.defineEventFunction({
            mouseRelease: () => {
              this.beginPointIsSelected = false
              this.endPointIsSelected = false
            }
          })
        },
      },
      mouseClickedOnLine: {
        evaluate: (mousePressPoint,
          proximityDistance = this.proximityDistance,
          line = this.line
        ) => {
          /**------------------GUARD STATEMENTS**/
          if (line === null)return
          
          /**------------------GET FINDINGS**/
          const findings = (() => {
            let result = {}
            const lineTapped = Public.getUserMouseClickOnLine(
              mousePressPoint,
              proximityDistance,
              [line])
            if (lineTapped) {
              const modifiedPressPoint = Public.getPerpendicularPoint(lineTapped, mousePressPoint)
              result = {}
              result.line = lineTapped
              result.distanceOffset = Public.getLineLength({beginPoint: mousePressPoint, endPoint:modifiedPressPoint } )
              result.modifiedPressPoint = modifiedPressPoint
              result.mousePressPoint = mousePressPoint
              return result
            }
          })()
          return findings
        },
        execute: (mousePressInfo) => { 
          const {mousePressPoint} = mousePressInfo
          const lineWasAlreadySelected = this.beginPointIsSelected && this.endPointIsSelected
          this.beginPointIsSelected = true
          this.endPointIsSelected = true
          this.defineEventFunctions({
            mouseDragBegin: () => {
            },
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(mousePressPoint,mouseDragPoint,this.selectedPoints)
            },
            mouseReleaseAfterDrag: () => {
              this.beginPointIsSelected = lineWasAlreadySelected ? true : false
              this.endPointIsSelected = lineWasAlreadySelected ? true : false
            },
            mouseReleaseWithoutDrag: () => {
              this.beginPointIsSelected = lineWasAlreadySelected ? false : true
              this.endPointIsSelected = lineWasAlreadySelected ? false : true
            }
          })

        },
      },
    }
    /**--------------------CONSTRUCTOR SCOPED VARIABLES/FUNCTIONS DEFINED BELOW------------------------*/
    const logMessage = (logString) => {
      if (this.logToConsole) {
        console.log(logString)
      }
    }
  } /** CLOSE CONSTRUCTOR */

  get selectedPoints (){
    const arr = []
    if(this.beginPointIsSelected) arr.push(this.beginPoint)
    if(this.endPointIsSelected) arr.push(this.endPoint)
    return arr
  }

  get lineLength (){
    if (this.hasLineDrawn === false)return null
    return Public.getLineLength(this.line)
  }

  get hasLineDrawn() {
    // if(this.endPoint.isNotInitialized) return null
    return this.endPoint !== null
  }

  get line() {
    if (this.hasLineDrawn === false)return null
    return {
      beginPoint: this.beginPoint,
      endPoint: this.endPoint
    }
  }

  get drawOutput (){
    return (context)=>{
      context.stroke('white')
      context.strokeWeight(2)
      context.line(this.beginPoint.x,this.beginPoint.y,this.endPoint.x,this.endPoint.y)
    }
  }

  get angle (){
    if (this.hasLineDrawn === false)return null
    return Public.getLineAngle(this.line)
  }

  get midPoint() {
    if (this.hasLineDrawn === false)return null
    return Public.getLineMidPoint(this.line)
  }
  
  get lineCollection() {
    return [this.line]
  }
  get selectedLinePoint() {
    if (this.beginPointIsSelected) {
      return this.beginPoint
    } else if (this.endPointIsSelected) {
      return this.endPoint
    }
    return null
  }

  setSelectPoint(point){
    if(point === this.beginPoint) this.beginPointIsSelected = true
    if(point === this.endPoint) this.endPointIsSelected = true
  }

  get hasSelectedPoints() {
    return this.beginPointIsSelected || this.endPointIsSelected
  }
  insertLine(line) {
    this.beginPoint = new PointObservable(line.beginPoint)
    this.endPoint = new PointObservable(line.endPoint)
  }
  get shapeOutput (){
    return [
      'line',
      this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y
    ]
  }

  toJSON() {

    if (this.hasLineDrawn) {
      const beginPoint = {
        x: this.beginPoint.x,
        y: this.beginPoint.y
      }
      const endPoint = {
        x: this.endPoint.x,
        y: this.endPoint.y
      }
      return {
        'beginPoint': JSON.stringify(beginPoint),
        'endPoint': JSON.stringify(endPoint),
        'proximityDistance': JSON.stringify(this.proximityDistance),
        'minimumNewLineLength': JSON.stringify(this.minimumNewLineLength),
      }
    } else {
      return {
        'beginPoint': 'null',
        'endPoint': 'null',
        'proximityDistance': JSON.stringify(this.proximityDistance),
        'minimumNewLineLength': JSON.stringify(this.minimumNewLineLength),
      }
    }
  }
}
