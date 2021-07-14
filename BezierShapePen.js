/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  LineShapePen
} from './LineShapePen.js'

import { Public } from './Public.js';
import { State } from './State.js';
import { grip } from './PenTools.js';

const {log} = console
const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},context:null}
const GHOST_COLOR = 'rgba(0,0,0,.1)'

export class BezierShapePen extends LineShapePen {
  constructor(
    context,
    beginPoint = null,
    endPoint = null
  ) {
    super(context, null ,null)
    this.lineColor = GHOST_COLOR
    let beginControlPointGrip = NULL_OBJECT
    let endControlPointGrip = NULL_OBJECT
    let beginPointControlLine = NULL_OBJECT
    let endPointControlLine = NULL_OBJECT

    const initParent = this.init
    this.init = ()=>{ 
      if(beginPoint)this.didInitBeginPoint()
      if(endPoint)this.didInitEndPoint()
      beginPointControlLine.context = this.context
      endPointControlLine.context = this.context
      beginControlPointGrip.setContext(this.context)
      endControlPointGrip.setContext(this.context)
      initParent()
    }

    this.didInitBeginPoint = ()=>{ 
      beginPointControlLine = new LineShapePen( this.context,this.beginPoint,{x:this.beginPoint.x,y:this.beginPoint.y})
      beginPointControlLine.lineColor = GHOST_COLOR
      beginPointControlLine.renderOutput = false
      this.beginControlPoint = beginPointControlLine.endPoint

      this.pointsAnchoredToBeginPoint.push(this.beginControlPoint)
      

      beginControlPointGrip = grip(
        this.context,
        //** REACH LOCATION */
        ()=>{ 
          if(this.line.endPoint === null) return null
          const angle = Public.getLineAngle(this.line)
          return Public.getEndPoint(this.line.beginPoint,20,angle)
        }
      )
    }
    this.didInitEndPoint = ()=>{ 
      endPointControlLine = new LineShapePen( this.context,this.endPoint,{x:this.endPoint.x,y:this.endPoint.y})
      endPointControlLine.lineColor = GHOST_COLOR
      endPointControlLine.renderOutput = false
      this.endControlPoint = endPointControlLine.endPoint

      this.pointsAnchoredToEndPoint.push(this.endControlPoint)

      endControlPointGrip = grip(
        this.context,
        //** REACH LOCATION */
        ()=>{
          if(this.line.endPoint === null) return null
          const angle = Public.getLineAngle(this.line) + 180
          return Public.getEndPoint(this.line.endPoint,20,angle)
        }
        //** CONDITIONAL */ // beginPointControlLine
        // ()=>{return Public.getLineLength(endPointControlLine.line) > 20},
      )

      beginControlPointGrip.setGripPoint()
      endControlPointGrip.setGripPoint()


      this.beginPoint.didSet = ()=>{
        beginControlPointGrip.setGripPoint();
        endControlPointGrip.setGripPoint()

      }
      this.endPoint.didSet = ()=>{
        beginControlPointGrip.setGripPoint();
        endControlPointGrip.setGripPoint()
      }
    }

    this.reset = ()=>{
      this.beginControlPoint.xy = beginControlPointGrip.gripPoint
      this.endControlPoint.xy = endControlPointGrip.gripPoint
    }

    const drawLoop = this.drawLoop
    this.drawLoop = () => {
      if (beginPointControlLine.context) beginPointControlLine.drawLoop()
      else beginPointControlLine.context = this.context
      if (endPointControlLine.context) endPointControlLine.drawLoop()
      else endPointControlLine.context = this.context
      //* DRAW BEZIER
      if (this.context && this.endControlPoint) {
        this.context.noFill();
        this.context.strokeWeight(2)
        this.context.stroke('white')
        this.context.bezier(
          this.bezier.beginPoint.x, this.bezier.beginPoint.y,
          this.bezier.beginControlPoint.x, this.bezier.beginControlPoint.y,
          this.bezier.endControlPoint.x, this.bezier.endControlPoint.y,
          this.bezier.endPoint.x, this.bezier.endPoint.y
        )
      }
      //* LINE SHAPE
      drawLoop()
      beginControlPointGrip.draw()
      endControlPointGrip.draw()
    }
    this.mousePressEventStack.mouseClickedOnControlPoint = {
      evaluate:(
        mousePressPoint,
        proximityDistance = this.proximityDistance,
        beginControlPoint = this.beginControlPoint,
        endControlPoint = this.endControlPoint
      )=>{

        const controlPointClicked = Public.getUserMouseClickOnPoint(mousePressPoint,proximityDistance,[beginControlPoint,endControlPoint])
        if(controlPointClicked){
          return {
            mousePressPoint,
            controlPointClicked
          }
        }
      },
      exicute: (mousePressInfo) => {
        const{mousePressPoint,
          controlPointClicked} = mousePressInfo
        const controlLinePen = controlPointClicked === this.beginControlPoint ? beginPointControlLine : endPointControlLine
        controlLinePen.endPointIsSelected = true

        this.defineEventFunction({
          mouseDragContinue: (mouseDragPoint) => {
            State.movePoints(mousePressPoint, mouseDragPoint, [controlPointClicked] )
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            controlLinePen.endPointIsSelected = false
            this.setAnchoredPoints()

          }
        })
      }
    }
    this.mousePressEventStack.mouseClickedOnGrip = {
      evaluate:(
        mousePressPoint,
        beginGrip = beginControlPointGrip ,
        endGrip = endControlPointGrip
      )=>{

        if(beginGrip.verifyMousePress(mousePressPoint)){
 
          return {mousePressPoint, gripPoint : beginGrip.gripPoint, controlPoint: this.beginControlPoint , controlLinePen : beginPointControlLine }
        } 
        else if(endControlPointGrip.verifyMousePress(mousePressPoint)){
          return {mousePressPoint, gripPoint : endGrip.gripPoint, controlPoint: this.endControlPoint , controlLinePen : endPointControlLine  }
        }
      },
      exicute: (mousePressInfo) => { 
        mousePressInfo.controlLinePen.endPointIsSelected = true
        this.defineEventFunction({
          mouseDragContinue: (mouseDragPoint = {
            x: mouseX,
            y: mouseY
          }) => {
            State.movePoints(
              mousePressInfo.mousePressPoint, 
              mouseDragPoint, 
              [mousePressInfo.gripPoint, mousePressInfo.controlPoint]
            )
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            beginControlPointGrip.setGripPoint();
            endControlPointGrip.setGripPoint()
            mousePressInfo.controlLinePen.endPointIsSelected = false
            this.setAnchoredPoints()
          }
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnGrip')
    if(beginPoint && endPoint){
      this.sendMousePress(beginPoint)
      this.sendMouseDrag(endPoint)
      this.sendMouseRelease(endPoint)
    }

  } /**CLOSE CONSTRUCTOR */
  
  get bezier(){
    return {
      beginPoint:this.beginPoint.xy,
      endPoint:this.endPoint.xy,
      beginControlPoint: this.beginControlPoint,
      endControlPoint: this.endControlPoint,
    }
  }

}