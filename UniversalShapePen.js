//TODO FILE AND OBJECT TO BE DISCONTINUED AND REMOVED FROM PROJECT

/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  LineShapePen
} from './LineShapePen.js'

import { Public } from './Public.js';
import { grip} from './PenTools.js';
import { ArcShapePen} from './ArcShapePen.js'
import { BezierShapePen} from './BezierShapePen.js'
import { NodeConnection } from './ReactiveModules/NodeConnection.js';

const {log} = console
const NULL_OBJECT = {
  draw:()=>{},
  drawLoop:()=>{},
  setGripPoint:()=>{}, 
  isNULL_OBJECT: true,
  sendMouseRelease:()=>{}, 
  sendMousePress:()=>{}, 
  sendMouseDrag:()=>{}, 
}
const GHOST_COLOR = 'rgba(0,0,0,.1)'

export class UniversalShapePen extends LineShapePen {
  constructor(
    context,
    beginPoint = null,
    endPoint = null,
  ) {
    super(context, beginPoint, endPoint)

    this.beginNode = new NodeConnection()
    this.endNode = new NodeConnection()

    const beginBezierGrip = grip(this.context,()=>{
      return Public.getEndPoint(this.beginPoint,20,this.angle)
    })
    const endBezierGrip = grip(this.context,()=>{
      return Public.getEndPoint(this.endPoint,20,this.angle - 180)
    })

    const centerGrip = grip(this.context,()=>{
      return this.midPoint
    })
    this.currentShape = this

    const drawLoop = this.drawLoop
    this.drawLoop = () => {
      drawLoop()
      beginBezierGrip.draw(this.context)
      endBezierGrip.draw(this.context)
      centerGrip.draw(this.context)

      // this.bezier.drawLoop()
      // this.arc.drawLoop()
      const shapeToRender = this.currentShape === this ? NULL_OBJECT : this.currentShape
      shapeToRender.drawLoop()
    }

    // this.setParameters = ()=>{
    //   beginBezierGrip.setGripPoint()
    //   endBezierGrip.setGripPoint()
    //   centerGrip.setGripPoint()
    // }

    this.didInitBeginPoint = ()=>{
      this.beginPoint.appendDidSet(()=>{
        beginBezierGrip.setGripPoint()
        endBezierGrip.setGripPoint()
        centerGrip.setGripPoint()
      })
this.beginNode.addPoint(this.beginPoint)
      
    }

    this.didInitEndPoint = ()=>{
      this.endPoint.appendDidSet(()=>{
        beginBezierGrip.setGripPoint()
        endBezierGrip.setGripPoint()
        centerGrip.setGripPoint()
      })

      // this.beginPoint.appendDidSet(()=>{
      //   if(!this.bezier.isNULL_OBJECT)this.bezier.beginPoint.xy = this.beginPoint.xy
      //   if(!this.arc.isNULL_OBJECT)this.arc.beginPoint.xy = this.beginPoint.xy
      // })
      // this.endPoint.appendDidSet(()=>{
      //   if(!this.bezier.isNULL_OBJECT)this.bezier.endPoint.xy = this.endPoint.xy
      //   if(!this.arc.isNULL_OBJECT)this.arc.endPoint.xy = this.endPoint.xy
      // })
      beginBezierGrip.setGripPoint()
      endBezierGrip.setGripPoint()
      centerGrip.setGripPoint()
this.endNode.addPoint(this.endPoint)
    }
    this.init = ()=>{ 
      this.didInitBeginPoint()
      this.didInitEndPoint()
    }

    this.bezier = NULL_OBJECT
    this.arc = NULL_OBJECT

    const makeBezier = ()=>{
      if(!this.bezier.isNULL_OBJECT)return
      this.bezier = new BezierShapePen(this.context,this.beginPoint.xy,this.endPoint.xy)
      this.bezier.init()
      this.beginNode.addPoint(this.bezier.beginPoint)
      this.endNode.addPoint(this.bezier.endPoint)
      beginBezierGrip.hidden = true
      endBezierGrip.hidden = true
    }

    this.mousePressEventStack.mouseClickedOnBezierGrip = {
      evaluate:(
        mousePressPoint,
        _beginBezierGrip = beginBezierGrip,
        _endBezierGrip = endBezierGrip,
        arcShapeIsActiveObject =  this.arc.isNULL_OBJECT ? false : true
      )=>{
        if(arcShapeIsActiveObject)return
        if(_beginBezierGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, beginBezierGrip: _beginBezierGrip}
        if(_endBezierGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, endBezierGrip: _endBezierGrip}
      },
      execute: (info) => {  log(info.eventKey)
        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => { 
            //** MAKE BEZIER SHAPE */

            makeBezier()
this.currentShape = this.bezier
this.bezier.reset()
            // this.bezier = new BezierShapePen(this.context,this.beginPoint.xy,this.endPoint.xy)
            // this.bezier.init()
            // beginBezierGrip.hidden = true
            // endBezierGrip.hidden = true
            this.bezier.sendMousePress(info.mousePressPoint)
            this.bezier.sendMouseDrag(mouseDragPoint)
this.beginNode.addPoint(this.bezier.beginPoint)
this.endNode.addPoint(this.bezier.endPoint)
          },

          mouseDragContinue: (mouseDragPoint) => {      
            this.bezier.sendMouseDrag(mouseDragPoint)
          },

          mouseRelease: (mouseReleasePoint) => {
            this.bezier.sendMouseRelease(mouseReleasePoint)
          }
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnBezierGrip')

    this.mousePressEventStack.mouseClickedOnBezierShape = {
      evaluate:(
        mousePressPoint,
        bezierShape = this.bezier
      )=>{
        if(!bezierShape) return
        if(bezierShape.isNULL_OBJECT) return
        const info = bezierShape.sendMousePress(mousePressPoint)

        if(!info) return
        if(info.eventKey === 'mouseClickedOnLine') return
        if(info.eventKey === 'mouseClickedOnPoint') return
        //mouseClickedOnLine
        if(info)return info
      },
      execute: (info) => {log(info.eventKey)

        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => {      
            this.bezier.sendMouseDrag(mouseDragPoint)
          },
          mouseDragContinue: (mouseDragPoint) => {      
            this.bezier.sendMouseDrag(mouseDragPoint)
          },
          mouseRelease: (mouseReleasePoint) => {      
            this.bezier.sendMouseRelease(mouseReleasePoint)
          },
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnBezierShape')

    this.mousePressEventStack.mouseClickedOnCenterGripAsBezierShape = {
      evaluate:(
        mousePressPoint,
        bezierShape = this.bezier,
        _centerGrip = centerGrip
      )=>{
        if(!bezierShape) return
        if(bezierShape.isNULL_OBJECT) return
        if(_centerGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, centerGrip:_centerGrip}
      },
      execute: (info) => {log(info.eventKey)
        // this.bezier = NULL_OBJECT
this.currentShape = this
        beginBezierGrip.hidden = false
        endBezierGrip.hidden = false
        // this.renderOutput = true

        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => {      
            // this.bezier.sendMouseDrag(mouseDragPoint)

            makeArkShape()
this.currentShape = this.arc
this.arc.reset()
centerGrip.hidden = true
            this.arc.sendMousePress(info.mousePressPoint)
            this.arc.sendMouseDrag(mouseDragPoint)
          },
          mouseDragContinue: (mouseDragPoint) => {      
            this.arc.sendMouseDrag(mouseDragPoint)
          },
          mouseRelease: (mouseReleasePoint) => {      
            // this.bezier.sendMouseRelease(mouseReleasePoint)
          },
        })

      }
    }
    this.setMousePressEventToFirst('mouseClickedOnCenterGripAsBezierShape')

    const makeArkShape = ()=>{
      if(!this.arc.isNULL_OBJECT)return
      this.arc = new ArcShapePen(this.context,this.beginPoint.xy,this.endPoint.xy)
      this.arc.init()
      beginBezierGrip.hidden = false
      endBezierGrip.hidden = false
      centerGrip.hidden = true
      this.beginNode.addPoint(this.arc.beginPoint)
      this.endNode.addPoint(this.arc.endPoint)
    }

    this.mousePressEventStack.mouseClickedOnCenterGripAsLineShape = {
      evaluate:(
        mousePressPoint,
        bezierShape = this.bezier,
        arcShape = this.arc,
        _centerGrip = centerGrip
      )=>{
        if(!bezierShape.isNULL_OBJECT) return
        if(!arcShape.isNULL_OBJECT) return
        if(_centerGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, centerGrip:_centerGrip}
      },
      execute: (info) => { log(info.eventKey)
        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => { 
            // ** MAKE ARC

            makeArkShape()
this.currentShape = this.arc
this.arc.reset()
centerGrip.hidden = true


            // this.arc = new ArcShapePen(this.context,this.beginPoint.xy,this.endPoint.xy)
            // this.arc.init()
            // beginBezierGrip.hidden = false
            // endBezierGrip.hidden = false
            // centerGrip.hidden = true
            // this.beginNode.addPoint(this.arc.beginPoint)
            // this.endNode.addPoint(this.arc.endPoint)

            this.arc.sendMousePress(info.mousePressPoint)

            this.arc.sendMouseDrag(mouseDragPoint)
          },

          mouseDragContinue: (mouseDragPoint) => {      
            this.arc.sendMouseDrag(mouseDragPoint)
          },

          mouseRelease: (mouseReleasePoint) => {
            this.arc.sendMouseRelease(mouseReleasePoint)
          }
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnCenterGripAsLineShape')

    this.mousePressEventStack.mouseClickedOnArcShape = {
      evaluate:(
        mousePressPoint,
        arcShape = this.arc
      )=>{
        if(arcShape.isNULL_OBJECT) return
        const info = arcShape.sendMousePress(mousePressPoint)
        if(!info) return
        if(info.eventKey === 'mouseClickedOnLine') return
        if(info.eventKey === 'mouseClickedOnPoint') return
        if(info)return info
      },
      execute: (info) => {log(info.eventKey)

        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => {      
            this.arc.sendMouseDrag(mouseDragPoint)
          },
          mouseDragContinue: (mouseDragPoint) => {      
            this.arc.sendMouseDrag(mouseDragPoint)
          },
          mouseRelease: (mouseReleasePoint) => {      
            this.arc.sendMouseRelease(mouseReleasePoint)
          },
        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnArcShape')

    this.mousePressEventStack.mouseClickedOnEndGripAsArcShape = { 
      evaluate:(
        mousePressPoint,
        arcShapeIsCurrent = this.arc.isNULL_OBJECT ? false : this.currentShape === this.arc,
        beginGrip = beginBezierGrip,
        endGrip = endBezierGrip
      )=>{
        // log({arcShapeIsCurrent})
        if(!arcShapeIsCurrent) return

        if(beginGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, beginGrip}
        if(endGrip.verifyMousePress(mousePressPoint))return {mousePressPoint, endGrip}

        // const info = arcShape.sendMousePress(mousePressPoint)
        // if(!info) return
        // if(info.eventKey === 'mouseClickedOnLine') return
        // if(info.eventKey === 'mouseClickedOnPoint') return
        // if(info)return info
      },
      execute: (info) => { log(info.eventKey)
        //TODO REVIEW AND MODIFY FOR OPTIMAL MEMORY MANAGEMENT
        //** DELETE ARC */
        // this.arc = NULL_OBJECT

        centerGrip.hidden = false
        this.renderOutput = true

        this.currentShape = this
log('convert to line')

        this.defineEventFunctions({
          mouseDragBegin: (mouseDragPoint) => {   
            log('convert to bezier')
            makeBezier()
            this.currentShape = this.bezier 
            endBezierGrip.hidden = true
            beginBezierGrip.hidden = true
            this.bezier.reset()
            this.bezier.sendMousePress(info.mousePressPoint)  
            this.bezier.sendMouseDrag(mouseDragPoint)
          },
          mouseDragContinue: (mouseDragPoint) => {      
            this.bezier.sendMouseDrag(mouseDragPoint)
          },
          mouseReleaseAfterDrag: (mouseReleasePoint) => {      
            this.bezier.sendMouseRelease(mouseReleasePoint)
            // beginBezierGrip.hidden = false
            // endBezierGrip.hidden = false
          },
          //mouseReleaseWithoutDrag
          mouseReleaseWithoutDrag: (mouseReleasePoint) => {      log('mouseReleaseWithoutDrag')

            beginBezierGrip.hidden = false
            endBezierGrip.hidden = false
            centerGrip.hidden = false
          },

        })
      }
    }
    this.setMousePressEventToFirst('mouseClickedOnEndGripAsArcShape')


//makeArkShape


  }
}