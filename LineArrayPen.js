//**-----------------------------------------------------------  */
//** LINE ARRAY PEN  */
//**-----------------------------------------------------------  */

/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  DrawMark
} from './DrawMarks.js';

//** IMPORT REACTIVE MODULES */
import {
  PointObservable,
} from './ReactiveModules/PointObservable.js';
import {
  LineAnchorPoint,
} from './ReactiveModules/LineAnchorPoint.js';
import {
  ParallelLineConstraint,
} from './ReactiveModules/ParallelLineConstraint.js';
import {
  LinearPointArray,
} from './ReactiveModules/LinearPointArray.js';
//** ----------------*/

import {
  PenConstruct
} from './PenConstruct.js';

const EMPTY_FUNCTION = () => {}
const TRACE_MARK_COLOR = 'rgba(0,0,255,.1)'

const {
  log
} = console
const NULL_OBJECT = {
  draw: () => {},
  drawLoop: () => {},
  setGripPoint: () => {},
  toggleOn: () => {}
}

const GHOST_COLOR = 'rgba(0,0,0,.1)'

export class LineArrayPen extends PenConstruct {
  constructor(
    context,
    anchorLinePen,
    beginPoint,
    endPoint,


  ) {
    super(context, endPoint, beginPoint)

    this.context = context
    this.lineColor = GHOST_COLOR
    this.dragExpandGrip = NULL_OBJECT

    this.arrayGrip = NULL_OBJECT
    let length = 1
    this.getLength = () => {
      return length
    }
    this.setLength = (newValue) => {
      length = newValue
    }

    let distance = 20
    this.anchorLinePen = anchorLinePen
    this.getAnchorLinePen = () => {
      return this.anchorLinePen
    }

    this.anchorLinePen.didInitEndPoint = () => {
      this.init()
    }
    this.context = context

    this.drawLoop = () => {
      if (this.lineAnchorPoint) DrawMark.pointCaptureHalo(this.context, this.lineAnchorPoint.xy, 'red', 12)
      if (!this.lineAnchorPoint) return
      if (this.lineAnchorPoint.colinearPoint)
        DrawMark.tickCrossMark(this.context, this.lineAnchorPoint.colinearPoint, 'black', 12, 1)
      if (this.lineAnchorPoint.distancePoint)
        DrawMark.tickCrossMark(this.context, this.lineAnchorPoint.distancePoint, TRACE_MARK_COLOR, 12, 1)

      if (this.testPoint)
        DrawMark.pointCaptureHalo(this.context, this.testPoint, 'purple', 15, 1)

      if (this.linearPointArray){
        this.linearPointArray.pointArray.forEach(pt => {
          DrawMark.tickCrossMark(this.context, pt.xy, TRACE_MARK_COLOR, 8, 1)
        })
      }
      arrayLines.forEach((line,i)=>{
        if (i >= this.linearPointArray.pointCount)return 
        // this.context.stroke(TRACE_MARK_COLOR)
        // this.context.line(line.beginPoint.x,line.beginPoint.y,line.endPoint.x,line.endPoint.y,)
      })
    }

    this.pointCountDidChange  = EMPTY_FUNCTION
    this.init = () => {
      this.lineAnchorPoint = new LineAnchorPoint(this.anchorLinePen)
      this.testPoint = new PointObservable(anchorLinePen.endPoint.xy)
      this.parallelLineConstraint = new ParallelLineConstraint(this.lineAnchorPoint.point, this.testPoint, this.anchorLinePen)
      this.linearPointArray = new LinearPointArray(this.anchorLinePen.beginPoint,this.lineAnchorPoint.distancePoint)
      this.linearPointArray.pointCountDidChange = refreshArrayLines
    }

    let arrayLines = []
    this.getArrayLines = ()=>{
      const count = this.linearPointArray.pointCount
      return arrayLines.filter((ln,i)=>i < count)
    }

    const refreshArrayLines = ()=>{
      if(this.linearPointArray.pointCount > arrayLines.length){
        const start = arrayLines.length 
        for (let i = start; i < this.linearPointArray.pointCount; i++) { //log(i)
          const pt2 = this.linearPointArray.pointArray[i].xy
          const newEndPoint = new PointObservable(pt2)
          const newPLine = new ParallelLineConstraint(this.linearPointArray.pointArray[i], newEndPoint, this.anchorLinePen)
          arrayLines.push(newPLine)
        }
      }
      this.pointCountDidChange()
    }


    this.mousePressEventStack.mousePressOnparallelLineConstraintEndPoint = {
      evaluate: (mousePressPoint, parallelLineConstraint = this.parallelLineConstraint) => {
        return parallelLineConstraint.sendMousePress(mousePressPoint)
      },
      execute: () => {
        this.defineEventFunctions({ 
          mouseDragContinue: (mouseDragPoint) => {
            this.parallelLineConstraint.sendMouseDrag(mouseDragPoint)
          },
          mouseRelease: () => {
            this.parallelLineConstraint.sendMouseRelease()
            // log(arrayLines.length)
          },
        })
      }
    }

    this.mousePressEventStack.mousePressOnAnchor = {
      evaluate: (mousePressPoint, lineAnchorPoint = this.lineAnchorPoint) => {
        return lineAnchorPoint.sendMousePress(mousePressPoint)
      },
      execute: (info) => {///log('anchor')
        this.defineEventFunctions({
          mouseDragContinue: (mouseDragPoint) => {
            this.lineAnchorPoint.sendMouseDrag(mouseDragPoint)
          },
          mouseRelease: () => {
            this.lineAnchorPoint.sendMouseRelease()
          },
        })
      }
    }
  } //** CLOSE CONSTRUCTOR */

  // get length() {
  //   return this.getLength()
  // }
  // set length(newValue) {
  //   this.setLength(newValue)
  // }

  get arrayLines (){
    return this.getArrayLines()
  }

  get arrayCount (){
    return this.linearPointArray.pointCount
  }

  

}
