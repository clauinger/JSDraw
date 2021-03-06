/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  LineShapePen
} from './LineShapePen.js'

import { Public } from './Public.js';
import { State } from './State.js';
import { grip} from './PenTools.js';

const {log} = console
const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},setGripPoint:()=>{},toggleOn:()=>{}}
const GHOST_COLOR = 'rgba(0,0,0,.1)'

export class ArcShapePen extends LineShapePen {
  constructor(
    context,
    beginPoint = null,
    endPoint = null,
    radius,
    direction ='clockwise',
  ) {
    super(context, beginPoint, endPoint)
    this.lineColor = GHOST_COLOR 
    this.centerLocationGrip = NULL_OBJECT
    this.crossAxisLengthGrip = NULL_OBJECT 
    this.rotateArcGrip = NULL_OBJECT
    this.mainAxisControlLine = NULL_OBJECT
    this.crossAxisControlLine = NULL_OBJECT

    this.centerPoint = null
    this.crossAxisRadius

    this.didInitEndPoint = ()=>{ 
      this.crossAxisLengthGrip = grip(
        this.context,
        //** SET GRIP LOCATION */
        ()=>{    
          if(this.line.endPoint === null) return null
          if(this.crossAxisControlLine === NULL_OBJECT) return Public.getLineMidPoint(this.line)
          return this.crossAxisControlLine.endPoint.xy
        }
      )
      this.beginPoint.appendDidSet(()=>{ 
        this.crossAxisLengthGrip.setGripPoint()
        this.centerLocationGrip.setGripPoint()
      })
      this.endPoint.appendDidSet(()=>{ 
        this.crossAxisLengthGrip.setGripPoint()
        this.centerLocationGrip.setGripPoint()
      })

      this.centerLocationGrip = grip(
        //** POINT && CONTEXT */
        this.context,
        //** SET GRIP LOCATION */
        ()=>{    
          if(this.crossAxisControlLine === NULL_OBJECT) return
          return Public.getLineMidPoint(this.crossAxisControlLine) // this.crossAxisControlLine.endPoint.xy
        }
      )

      this.rotateArcGrip = grip(
        //** POINT && CONTEXT */
        this.context,
        //** SET GRIP LOCATION */
        ()=>{
          if(this.crossAxisControlLine === NULL_OBJECT) return
          return Public.getEndPoint(this.centerPoint,this.crossAxisRadius + 20,this.angle + 90)
        }
      )
      this.crossAxisLengthGrip.setGripPoint()
      this.centerLocationGrip.setGripPoint()
      this.rotateArcGrip.setGripPoint()
    }
    const drawLoop = this.drawLoop
    this.drawLoop = () => { 
      if(!this.beginPoint)return
      drawLoop()
      if(this.centerPoint) { 
        this.context.noFill();
        this.context.strokeWeight(1)
        this.context.stroke(GHOST_COLOR)
        this.context.circle(this.centerPoint.x, this.centerPoint.y, this.crossAxisRadius * 2)
      }
      this.crossAxisLengthGrip.draw()
      if(this.arcIsEstablished){ 
        this.centerLocationGrip.draw()
        this.rotateArcGrip.draw()
      }

      this.crossAxisControlLine.drawLoop()
      this.mainAxisControlLine.drawLoop()

      //* DRAW ARC
      const arc = this.arc
      this.context.noFill();
      this.context.strokeWeight(2)
      this.context.stroke('white')
      if (arc) { 

        this.context.arc( arc.x, arc.y, arc.diameter, arc.diameter, arc.beginAngle, arc.endAngle)
      } else {
        this.context.line( this.beginPoint.x, this.beginPoint.y, this.endPoint.x, this.endPoint.y )
      }
    }

    let arcHeightAtMousePress
    let arcProportionAtMousePress
    this.mousePressSetup = () => {
      if (!this.arcIsEstablished) return
      arcHeightAtMousePress = this.arcHeight  
      const d1 = Public.getDistanceTwoPoints(this.midPoint, this.crossAxisControlLine.endPoint)
      arcProportionAtMousePress = d1 / this.lineLength
    }
    this.didSetBeginPoint = () => {
      coordinateCrossAxisLine()
      coordinateMainAxisLine()
      this.rotateArcGrip.setGripPoint()
      this.crossAxisLengthGrip.setGripPoint()
      this.centerLocationGrip.setGripPoint()
    }
    this.didSetEndPoint = () => {
      coordinateCrossAxisLine()
      coordinateMainAxisLine()
      this.rotateArcGrip.setGripPoint()
      this.crossAxisLengthGrip.setGripPoint()
      this.centerLocationGrip.setGripPoint()
    }

    this.reset = ()=>{
      if(!this.arcIsEstablished) return
      this.mainAxisControlLine = NULL_OBJECT
      this.crossAxisControlLine = NULL_OBJECT
      this.centerPoint = undefined
      this.radius = undefined
      this.crossAxisLengthGrip.setGripPoint()
      this.crossAxisLengthGrip.toggleOn(false)
    }


    const coordinateCrossAxisLine = () => {
      if (!this.arcIsEstablished) return
      if(this.centerLocationGrip.isToggledOn){
        coordinateCrossAxisForArcProportion()
        return
      }
      coordinateCrossAxisForArcHeight()
    }

    const coordinateCrossAxisForArcHeight = (arcHeight = arcHeightAtMousePress )=>{ 
      if(!arcHeight){
        //** ARC HEIGHT AT MOUSE PRESS WAS NEVER ESTABLISHED. SO WE WILL DO IT NOW */
        arcHeightAtMousePress = this.arcHeight
        arcHeight = arcHeightAtMousePress
      }
      const perpFactor =  this.direction === 'clockwise' ? -90 : 90
      const angle = Public.getLineAngle(this.line) + perpFactor 
      const newMainAxisEndPoint = Public.getEndPoint(this.midPoint, arcHeight, angle)
      this.centerPoint = Public.getCircleCenterFromThreePoints(
        this.beginPoint,
        newMainAxisEndPoint,
        this.endPoint)
      this.crossAxisRadius = Public.getLengthTwoPoints(this.centerPoint,newMainAxisEndPoint)
      const crossAxisLength = this.crossAxisRadius * 2
      this.crossAxisControlLine.endPoint.xy = newMainAxisEndPoint
      this.crossAxisControlLine.beginPoint.xy = Public.getEndPoint(this.crossAxisControlLine.endPoint.xy,crossAxisLength,angle + 180)
    }

    const coordinateCrossAxisForArcProportion = ()=>{
      const perpFactor =  this.direction === 'clockwise' ? 90 : -90
      const len = arcProportionAtMousePress * this.lineLength
      this.crossAxisControlLine.endPoint.xy = Public.getEndPoint(this.midPoint,len,this.angle - perpFactor)
      this.centerPoint = Public.getCircleCenterFromThreePoints(this.beginPoint,this.endPoint,this.crossAxisControlLine.endPoint)
      this.crossAxisRadius = Public.getLengthTwoPoints(this.centerPoint,this.crossAxisControlLine.endPoint)
      this.crossAxisControlLine.beginPoint.xy = Public.getEndPoint(this.centerPoint,this.crossAxisRadius,this.angle + perpFactor)
    }

    const coordinateMainAxisLine = () => { 
      if (!this.arcIsEstablished) return
      const radius = this.crossAxisRadius
      this.mainAxisControlLine.beginPoint.xy = Public.getEndPoint(this.centerPoint, radius,this.mainAxisAngle)
      this.mainAxisControlLine.endPoint.xy = Public.getEndPoint(this.centerPoint, radius,this.mainAxisAngle - 180)
    }

    const initArcParameters = ()=>{ 
      this.crossAxisControlLine = new LineShapePen(this.context,this.midPoint,this.midPoint)
      this.mainAxisControlLine = new LineShapePen(this.context,this.midPoint,this.midPoint)
      this.mainAxisControlLine.renderOutput = false
      this.crossAxisControlLine.renderOutput = false

      this.crossAxisControlLine.lineColor = GHOST_COLOR
      this.mainAxisControlLine.lineColor = GHOST_COLOR
      this.crossAxisControlLine.pointColor = GHOST_COLOR
      this.mainAxisControlLine.pointColor = GHOST_COLOR
    }

    this.mousePressEventStack.mouseClickedOnCrossAxisLengthGrip = { 
      evaluate:(
        mousePressPoint,
        grip = this.crossAxisLengthGrip ,
      )=>{ 
        if(!grip)return
        if(!grip.verifyMousePress)return
        if(grip.verifyMousePress(mousePressPoint))return {mousePressPoint, gripPoint : grip.gripPoint}
      },
      execute: (mousePressInfo) => {
        if(this.crossAxisControlLine === NULL_OBJECT) initArcParameters()
        this.crossAxisControlLine.endPointIsSelected = true
        const angle = this.angle + 90
        this.crossAxisLengthGrip.toggleOn(true)
        this.centerLocationGrip.toggleOn(false)
        this.defineEventFunction({
          mouseDragContinue: (mouseDragPoint = {
            x: mouseX,
            y: mouseY
          }) => {

            State.movePoints(
              mousePressInfo.mousePressPoint, 
              mouseDragPoint, 
              [mousePressInfo.gripPoint]
            )
            this.centerPoint = Public.getCircleCenterFromThreePoints(this.beginPoint,this.endPoint,mousePressInfo.gripPoint)
            this.crossAxisRadius = Public.getLengthTwoPoints(this.centerPoint,mousePressInfo.gripPoint)
            const crossAxisLength = this.crossAxisRadius * 2
            const gripDirection = Public.getDirection(mouseDragPoint,this.line)

            if(gripDirection === 'counterclockwise'){
              this.crossAxisControlLine.endPoint.xy = Public.getEndPoint(this.centerPoint,this.crossAxisRadius,angle)
              this.crossAxisControlLine.beginPoint.xy = Public.getEndPoint(this.crossAxisControlLine.endPoint.xy,crossAxisLength,angle + 180)
            } else {
              this.crossAxisControlLine.endPoint.xy = Public.getEndPoint(this.centerPoint,this.crossAxisRadius,angle + 180)
              this.crossAxisControlLine.beginPoint.xy = Public.getEndPoint(this.crossAxisControlLine.endPoint.xy,crossAxisLength,angle )
            }
            this.centerLocationGrip.setGripPoint()
            this.rotateArcGrip.setGripPoint()
            coordinateMainAxisLine()
          }
        })
        this.defineEventFunction({
          mouseRelease: () => {
            this.crossAxisControlLine.endPointIsSelected = false
            this.crossAxisLengthGrip.setGripPoint()
            this.centerLocationGrip.setGripPoint()
            this.rotateArcGrip.setGripPoint()
            arcHeightAtMousePress = this.arcHeight
          }
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnCrossAxisLengthGrip')

    this.mousePressEventStack.mouseClickedOnCenterPointGrip = {
      evaluate:(
        mousePressPoint,
        grip = this.centerLocationGrip ,
        arcIsEstablished = this.arcIsEstablished
      )=>{
        if(!arcIsEstablished)return
        if(!grip.verifyMousePress)return
        if(grip.verifyMousePress(mousePressPoint))return {mousePressPoint, grip}
      },
      execute: (mousePressInfo) => { 
        this.centerLocationGrip.toggleOn(true)
        this.crossAxisLengthGrip.toggleOn(false)
        const lineColor = this.lineColor
        this.defineEventFunction({
          mouseDragContinue: (mouseDragPoint = {
            x: mouseX,
            y: mouseY
          }) => { 
            //** MOVE GRIP  */
            State.movePoints(
              mousePressInfo.mousePressPoint, 
              mouseDragPoint, 
              [this.centerLocationGrip.gripPoint]
            )
            const dist = Public.getDistanceTwoPoints(this.centerLocationGrip.gripPoint, this.midPoint)
            if(dist < this.proximityDistance){
              this.centerLocationGrip.gripPoint.x = this.midPoint.x
              this.centerLocationGrip.gripPoint.y = this.midPoint.y
              this.lineColor = 'red'
            } else{
              this.lineColor = lineColor
            }
            //** MOVE AND ADJUST LENGTH OF MAIN AXIS AND CENTER POINT*/
            this.centerPoint = Public.getPerpendicularPoint(this.crossAxisControlLine,this.centerLocationGrip.gripPoint)
            this.crossAxisRadius = Public.getDistanceTwoPoints(this.centerPoint, this.beginPoint)
            const bAngle = Public.getAngle(this.centerPoint, this.crossAxisControlLine.beginPoint)
            this.crossAxisControlLine.beginPoint.xy = Public.getEndPoint(this.centerPoint,this.crossAxisRadius,bAngle)
            const eAngle = Public.getAngle(this.centerPoint, this.crossAxisControlLine.endPoint)
            this.crossAxisControlLine.endPoint.xy = Public.getEndPoint(this.centerPoint,this.crossAxisRadius,eAngle)
            coordinateMainAxisLine()
          }
        })

        this.defineEventFunction({
          mouseRelease: () => {
            this.crossAxisLengthGrip.setGripPoint()
            this.centerLocationGrip.setGripPoint()
            this.rotateArcGrip.setGripPoint()
            this.lineColor = lineColor
          }
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnCenterPointGrip')

    this.mousePressEventStack.mouseClickedOnRotateArcGrip = {
      evaluate:(
        mousePressPoint,
        grip = this.rotateArcGrip ,
        arcIsEstablished = this.arcIsEstablished
      )=>{
   
        if(!arcIsEstablished)return
        if(grip.verifyMousePress(mousePressPoint))return {mousePressPoint}
      },
      execute: (mousePressInfo) => { 
        const refernceLine = {beginPoint:this.centerPoint,endPoint:this.rotateArcGrip.gripPoint}
        const pointCollection = [
          this.beginPoint,
          this.endPoint,
        ]
        const rotatePointsTool = State.rotatePointsTool (refernceLine, this.centerPoint, pointCollection)
        this.defineEventFunctions({
          mouseDragContinue: (mouseDragPoint) => {

            //** MOVE GRIP  */
            State.movePoints(
              mousePressInfo.mousePressPoint,
              mouseDragPoint,
              [this.rotateArcGrip.gripPoint]
            )
            rotatePointsTool.refresh()
          },

          mouseRelease: () => {
            this.crossAxisLengthGrip.setGripPoint()
            this.centerLocationGrip.setGripPoint()
            this.rotateArcGrip.setGripPoint()
          }
        })
      } 
    }
    this.refreshArcPoints = (minArcLength = 10)=>{
      if(!this.direction) return
      const isClockwise  = this.direction  === 'clockwise'
      const beginAngle = Public.getAngle(this.centerPoint, this.beginPoint)
      let endAngle = Public.getAngle(this.centerPoint, this.endPoint)
      if(endAngle < beginAngle && isClockwise) endAngle += 360
      if(endAngle > beginAngle && isClockwise === false) endAngle -= 360
      const centerAngle =  isClockwise ? endAngle - beginAngle : beginAngle - endAngle
    
      const angleLength = Math.abs(centerAngle) * (Math.PI / 180) * this.radius
      const div = Math.abs(Math.round(angleLength / minArcLength))
      let segmentAngle = centerAngle / div 
      if(!isClockwise) segmentAngle *= -1
      arcPoints = []
      for (let index = 0; index < div; index++) {
        const ang = beginAngle + (index * segmentAngle)
        const pt = Public.getEndPoint(this.centerPoint,this.radius,ang)
        arcPoints.push(pt)
      }
    }
    if(endPoint) this.didInitEndPoint()

    this.setRadius = (radius)=>{
      if(!radius)return 
      const centerPoint = Public.getIntersectionPointsFromTwoCircles(this.beginPoint,radius,this.endPoint)[ direction === 'clockwise' ? 0 : 1 ]
      if(!centerPoint)return
      const angle = Public.getAngle(centerPoint,this.midPoint )
      const arcHt = radius - Public.getPerpendicularDistance(centerPoint,this.beginPoint,this.endPoint)
      const pt2 = Public.getEndPoint(this.midPoint,arcHt,angle)
      this.centerPoint = centerPoint
      initArcParameters()
      this.sendMousePress(this.midPoint)
      this.sendMouseDrag(pt2)
      this.sendMouseRelease()
    }
    this.setRadius(radius) 
    
  } //** CLOSE CONSTRUCTOR */

  get arcHeight() { 
    if (this.crossAxisControlLine === NULL_OBJECT) return 0
    return Public.getLineLength( {beginPoint: this.midPoint, endPoint: this.crossAxisControlLine.endPoint} )
  }

  get direction (){ 
    if (this.crossAxisControlLine === NULL_OBJECT) return null
    return Public.getDirection(this.crossAxisControlLine.endPoint,this.line)
  }

  get arcIsEstablished (){
    return this.crossAxisControlLine !== NULL_OBJECT
  }

  get mainAxisAngle (){
    if (this.crossAxisControlLine === NULL_OBJECT) return null
    return Public.getLineAngle(this.line)
  }

  get arc (){
    if(!this.arcIsEstablished)return null
    return Public.getArc(this.beginPoint, this.endPoint,this.centerPoint, this.direction)
  }
  get shapeOutput (){
    if(!this.arc)return 
    if(!this.arc.diameter)return 
    const arc = this.arc

    return [
      'arc', arc.x, arc.y, arc.diameter, arc.diameter, arc.beginAngle, arc.endAngle
    ]
  }

  get radius (){
    return this.crossAxisRadius
  }

}


