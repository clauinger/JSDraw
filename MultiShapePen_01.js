//TODO :RENAME TO MULTI SHAPE PEN

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
  PenConstruct
} from './PenConstruct.js'
import {
  PointObservable ,
} from './ReactiveModules/PointObservable.js'
import {
  NodeConnection ,
} from './ReactiveModules/NodeConnection.js'
//NodeConnection

import {
  BezierShapePen
} from './BezierShapePen.js'

import {
  ArcShapePen
} from './ArcShapePen.js'

import { grip} from './PenTools.js';

const LINE_SHAPE_PEN = 'LineShapePen'
const ARC_SHAPE_PEN = 'ArcShapePen'
const BEZIER_SHAPE_PEN = 'BezierShapePen'
const GROUP_SHAPE_PEN = 'GroupShapePen'

const GHOST_COLOR = 'rgba(0,0,0,.1)'
const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},context:null, isNULL_OBJECT:true}

const LINE = 'line'
const ARC = 'arc'
const BEZIER = 'bezier'

const {
  log
} = console

export class MultiShapePen_01 extends PenConstruct {
  constructor(
    context,
    //TODO MAKE INIT ROUTINE FOR POINTS SPECIFIED
    beginPoint,
    endPoint,
    currentShapeType = LINE_SHAPE_PEN,
    inputs

  ) {
    super()
    this.context = context
    this.lineWid = 1;
    this.pointColor = 'rgba(20%, 20%, 100%, .9)';
    this.pointRadius = 3
    this.lineColor = 'rgba(0%, 0%, 0%, .4)';
    this.selectedColor = 'rgba(100%, 0%, 0%, .8)'
    this.selectedPointColor = 'rgba(100%, 0%, 0%, .8)'

    this.shapeCollection = []

    // this.
    this.showShapeTypeGrip = true

    this.didSetShapeBeginPoint = ()=>{}
    this.didSetShapeEndPoint = ()=>{}

    this.beginPointIsSelected = false
    this.endPointIsSelected = false
    this.setSelectPoint = (point)=>{
      if(point === this.beginPoint) this.beginPointIsSelected = true
      if(point === this.endPoint) this.endPointIsSelected = true
    }
    this.getCurrentShapeType = ()=>{
      if(this.currentShape === bezierShapePen)return BEZIER_SHAPE_PEN
      if(this.currentShape === arcShapePen)return ARC_SHAPE_PEN
      if(this.currentShape === lineShapePen)return LINE_SHAPE_PEN
    }



    let bezierShapePen
    this.getBezierShapePen = ()=>{
      if(!bezierShapePen) {
        bezierShapePen = new BezierShapePen(this.context)
        bezierShapePen.sendMousePress(this.beginPoint)
        bezierShapePen.sendMouseDrag(this.endPoint)
        bezierShapePen.sendMouseRelease()
        this.appendShape(bezierShapePen)
      }
      bezierShapePen.context = this.context

      return bezierShapePen
    }

    let arcShapePen
    this.getArcShapePen = ()=>{
      if(!arcShapePen) {
        arcShapePen = new ArcShapePen(this.context)
        arcShapePen.sendMousePress(this.beginPoint)
        arcShapePen.sendMouseDrag(this.endPoint)
        arcShapePen.sendMouseRelease()
        this.appendShape(arcShapePen)
      }
      arcShapePen.context = this.context
      return arcShapePen
    }

    let lineShapePen
    this.getLineShapePen = ()=>{

      if(!lineShapePen) {
        lineShapePen = new PenConstruct()
        lineShapePen.isLineShapePen = true
        lineShapePen.beginPoint = new PointObservable(this.beginPoint.xy)
        lineShapePen.endPoint = new PointObservable(this.endPoint.xy)
        lineShapePen.init = ()=>{}
        lineShapePen.drawLoop = ()=>{
          this.context.strokeWeight(2);
          this.context.stroke( 'white')
          this.context.line(this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y);
        }
        lineShapePen.reset = ()=>{}
        lineShapePen.clearSelectedPoints = ()=>{} 
        this.appendShape(lineShapePen)
      }
      lineShapePen.context = this.context
      return lineShapePen
    }
    this.currentShape = NULL_OBJECT

    const cycleSwitchChangeShape = ()=>{ log('cycleSwitchChangeShape')
      if(this.currentShape === lineShapePen) this.currentShape = this.getArcShapePen()
      else if(this.currentShape === arcShapePen) this.currentShape = this.getBezierShapePen()
      else if(this.currentShape === bezierShapePen) this.currentShape = this.getLineShapePen()
    }

    this.appendShape = (newShape)=>{ 
      if(!this.hasLineDrawn)return
      this.beginNode.addPoint(newShape.beginPoint)
      this.endNode.addPoint(newShape.endPoint)
      this.shapeCollection.push(newShape)
    }

    this.resetShape = ()=>{
      this.currentShape.reset()
    }

    this.shapeTypeGrip = NULL_OBJECT

    // this.currentShapeType = currentShapeType
    this.beginNode = new NodeConnection()
    this.endNode = new NodeConnection()

    this.drawLoop=()=>{ 
      if(!this.context)return
      if(!this.hasLineDrawn)return
      this.context.stroke(this.lineColor)

      this.context.strokeWeight(1);
      this.context.stroke( this.lineIsSelected ? 'red' :   GHOST_COLOR)
      this.context.line(this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y);
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

      this.currentShape.drawLoop()
      if(this.showShapeTypeGrip) this.shapeTypeGrip.draw()
    }

    this.mousePressEventStack = {
      
      mouseClickOnShapeTypeGrip :{
        evaluate: (mousePressPoint, grip = this.shapeTypeGrip)=>{ 
          if(this.shapeTypeGrip.isNULL_OBJECT)return
          const result = this.shapeTypeGrip.verifyMousePress(mousePressPoint)
          if(result)return {mousePressPoint}
        },
        execute: (info)=>{
          let dragSteps = 0
          this.defineEventFunctions({

            mouseDragContinue: (mouseDragPoint) => {
              dragSteps++
              State.movePoints(info.mousePressPoint,mouseDragPoint,[this.shapeTypeGrip.gripPoint])
            },
            mouseReleaseAfterDrag: (mousePoint) => {
              this.shapeTypeGrip.setGripPoint()

              if(dragSteps < 4) cycleSwitchChangeShape()// log('switch shape 0')
            },
            mouseReleaseWithoutDrag: (mousePoint) => {
              cycleSwitchChangeShape()
              // log('switch shape 1')
            },
          })
        }
      },

      mouseClickOnShape : {
        evaluate: (mousePressPoint, shape = this.currentShape)=>{ 
          const result = this.currentShape.sendMousePress(mousePressPoint)
          if(!result)return
          if(result.eventKey === "mouseClickedOnLine") return
          if(result.eventKey === "mouseClickedOnPoint") return
          if(shape)return {shape, mousePressPoint, childEventInfo : result}
        },
        execute: (info)=>{ 
          const {shape} = info
          const shapeBeginPointSnapShot = shape.beginPoint.xy
          let  shapeEndPointSnapShot 
          const checkPointChange = (pointSnapShot , pointStateNow, runFunc)=>{
            if ((Math.abs(pointStateNow.x - pointSnapShot.x ) + Math.abs(pointStateNow.y - pointSnapShot.y )) > 0)runFunc()
          }

          this.defineEventFunctions({
            mouseDragBegin: (mouseDragPoint) => {
              shape.sendMouseDrag(mouseDragPoint)
              shapeEndPointSnapShot = shape.endPoint.xy
              checkPointChange(shapeBeginPointSnapShot, shape.beginPoint, this.didSetShapeBeginPoint )
              checkPointChange(shapeEndPointSnapShot, shape.endPoint, this.didSetShapeEndPoint )
            },
            mouseDragContinue: (mouseDragPoint) => {
              shape.sendMouseDrag(mouseDragPoint)
              checkPointChange(shapeBeginPointSnapShot, shape.beginPoint, this.didSetShapeBeginPoint )
              checkPointChange(shapeEndPointSnapShot, shape.endPoint, this.didSetShapeEndPoint )
            },
            mouseRelease: (mouseDragPoint) => {
              shape.sendMouseRelease(mouseDragPoint)
            },
          })
        }
      },

      mouseClickOnPoint : {
        evaluate: (mousePressPoint, hasLineDrawn = this.hasLineDrawn)=>{
          if(!hasLineDrawn)return
          const result = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance, [this.beginPoint, this.endPoint])
          if(result) return {point: result, mousePressPoint}
        },
        execute: (info)=>{ 
          const {mousePressPoint, point} = info
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(mousePressPoint,mouseDragPoint,[point])
            },
          })
        }
      },
      mouseClickOnLine : {
        evaluate: (mousePressPoint, hasLineDrawn = this.hasLineDrawn)=>{
          if(!hasLineDrawn)return
          const result = Public.getUserMouseClickOnLine(mousePressPoint,this.proximityDistance, [this.line])
          if(result)return {line: result, mousePressPoint}
        },
        execute: (info)=>{
          // this.shapeTypeGrip.hidden = true
          const lineIsAlreadySelected = this.lineIsSelected
          const {mousePressPoint, line} = info
          this.currentShape.clearSelectedPoints()
          this.defineEventFunctions({
            mouseDragBegin: (mouseDragPoint) => {
              this.beginPointIsSelected = true
              this.endPointIsSelected = true
              State.movePoints(mousePressPoint,mouseDragPoint,[line.beginPoint, line.endPoint])
            },
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(mousePressPoint,mouseDragPoint,[line.beginPoint, line.endPoint])
            },
            mouseReleaseWithoutDrag: ()=>{
              this.beginPointIsSelected = lineIsAlreadySelected === false
              this.endPointIsSelected = lineIsAlreadySelected === false
            },
            mouseReleaseAfterDrag: ()=>{
              this.beginPointIsSelected = false
              this.endPointIsSelected = false
              this.shapeTypeGrip.hidden = false
            }
          })
        }
      },

    }//*  */
    this.userInitializer = {
      evaluateRequirements: (hasLineDrawn = this.hasLineDrawn) => hasLineDrawn === false, //   PURE FUNCTION

      execute: (mousePressPoint) => {
        this.beginPoint = new PointObservable(mousePressPoint,this)
        this.beginNode.addPoint(this.beginPoint)
        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => {
            this.endPoint = new PointObservable(mouseDragPoint,this)
          },
          mouseDragContinue: (mouseDragPoint) => {
            this.endPoint.xy = mouseDragPoint
          },

          mouseReleaseAfterDrag: () => { 
            const newShape = this.getArcShapePen()
            this.currentShape = newShape
            this.endNode.addPoint(this.endPoint)
            this.currentShape = this.getLineShapePen()
            this.init()
          }
        })
      }
    }
    
    this.init = ()=>{
      this.shapeType = LINE
      this.shapeTypeGrip =  grip(
        this.context,
        //** SET GRIP LOCATION */
        ()=>{   
          const len = this.lineLength / 4
          return Public.getEndPoint(this.beginPoint, len, this.angle)
        }
      )
      this.shapeTypeGrip.drawParameters.radius = 5
      this.shapeTypeGrip.drawParameters.lineWidth = 5
      this.shapeTypeGrip.drawParameters.color = 'rgba(90%,90%,90%,.7)'
      this.shapeTypeGrip.setGripPoint()
      this.beginPoint.appendDidSet(this.shapeTypeGrip.setGripPoint)
      this.endPoint.appendDidSet(this.shapeTypeGrip.setGripPoint)
    }

    if(!beginPoint || !endPoint)return
    // log(beginPoint)

    if(beginPoint)this.beginPoint = new PointObservable(beginPoint)
    if(endPoint)this.endPoint = new PointObservable(endPoint)

    this.beginNode.addPoint(this.beginPoint)
    this.endNode.addPoint(this.endPoint)

    switch (currentShapeType) {
      case LINE_SHAPE_PEN: {
        this.currentShape = this.getLineShapePen()
      }
      break;
      case ARC_SHAPE_PEN: {
        this.currentShape = this.getArcShapePen()
        if(inputs.radius)this.currentShape.setRadius(inputs.radius)
      }
      break;
      case BEZIER_SHAPE_PEN: {
        this.currentShape = this.getBezierShapePen()
        if(inputs.beginControlPoint ) this.currentShape.beginControlPoint.xy = inputs.beginControlPoint
        if(inputs.endControlPoint ) this.currentShape.endControlPoint.xy = inputs.endControlPoint
      }
      break;
      case GROUP_SHAPE_PEN: {
        this.currentShape = this.getLineShapePen()
        // this.currentShape = this.getBezierShapePen()
      }
      break;
    }


    this.init()
    // this.init()
    

  }//* CLOSE CONSTRUCTOR */
  get shapeTypeGripHidden (){
    if(!this.shapeTypeGrip)return
    return this.shapeTypeGrip.hidden
  }
  set shapeTypeGripHidden (bool){
    if(!this.shapeTypeGrip)return

    this.shapeTypeGrip.hidden = false //bool
  }

  get line (){
    return {beginPoint: this.beginPoint, endPoint: this.endPoint}
  }

  get hasLineDrawn (){ 
    return this.beginPoint && this.endPoint ? true : false
  }

  get lineLength (){
    return Public.getLineLength(this.line)
  }

  get lineIsSelected (){
    return this.beginPointIsSelected && this.endPointIsSelected
  }

  get angle (){
    if (this.hasLineDrawn === false)return null
    return Public.getLineAngle(this.line)
  }

  get centerPoint (){
    // if(this.currentShape !== this.getArcShapePen()) return null
    return this.currentShape.centerPoint
  }

  get midPoint() {
    if (this.hasLineDrawn === false)return null
    return Public.getLineMidPoint(this.line)
  }

  get currentShapeType (){
    return this.getCurrentShapeType()
  }

  get shapeOutput (){
    if(this.currentShape.isLineShapePen) return ['line', this.beginPoint.x,  this.beginPoint.y, this.endPoint.x,  this.endPoint.y]
    return this.currentShape.shapeOutput
  }

  get direction (){
    return this.currentShape.direction
  }

  get radius(){
    return this.currentShape.radius
  }

  get hideShapeTypeGrip (){
    return this.showShapeTypeGrip === false
  }
  set hideShapeTypeGrip (bool){
    this.showShapeTypeGrip = bool ? false : true
  }

}