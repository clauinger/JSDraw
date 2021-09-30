/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  Public
} from './Public.js';

import {
  RectCutShapePen
} from './RectCutShapePen.js';

import {
  PenConstruct
} from './PenConstruct.js'

import {
  LineArrayPen
} from './LineArrayPen.js'

const {log} = console

export class RectCutArrayPen extends PenConstruct {
  constructor(
    context,
    rect
  ) {
    super()
    this.context = context
    this.rectCutShapePen = new RectCutShapePen(this.context, null, rect)
    this.getMainRectShapePen = ()=>{
      return this.rectCutShapePen
    }

    this.lineArrayPen = new LineArrayPen(this.context , this.rectCutShapePen)

    this.lineArrayPen.pointCountDidChange = ()=>{ 
      if(rectCutShapeArray.length < this.lineArrayPen.arrayCount){
        for (let i = rectCutShapeArray.length; i < this.lineArrayPen.arrayCount  ; i++) {
          const rectCutShape = new RectCutShapePen(this.context, null, rect, this.lineArrayPen.arrayLines[i] )
          rectCutShape.didInitEndPoint = refreshClosedShapeCollection
          rectCutShapeArray.push(rectCutShape)
        }
      }
      // log(rectCutShapeArray[0].endPoint.xy)
      //TODO: REFACTORING NEEDED. BELOW IS PART OF A MESS IN CODE
      rectCutShapeArray.forEach(rectCut =>{if(rectCut.shapePen)rectCut.shapePen.hideShapeTypeGrip = true})
      refreshClosedShapeCollection()
    }
    let rectCutShapeArray = []
    this.getClosedShapeCollection = ()=>{return closedShapeCollection}
    const rectCutShapePenDidInitEndPoint = this.rectCutShapePen.didInitEndPoint
    let closedShapeCollection = []
    const refreshClosedShapeCollection = ()=>{
      const arrayIsOnRightSide  = this.lineArrayPen.side === 'right' 
      const arrayIsOnLeftSide = arrayIsOnRightSide === false
      const getShape =  (
        rectCutShape, 
        newClosedShape =  this.lineArrayPen.side === 'left' ? rectCutShape.rightSideOfCutRect : rectCutShape.leftSideOfCutRect 
        )=> {
        newClosedShape.unshift(rectCutShape.endPoint.xy)
        newClosedShape.push(rectCutShape.beginPoint.xy)
        return newClosedShape
      }
      closedShapeCollection = [getShape(this.rectCutShapePen)]
      if(arrayIsOnLeftSide){// *REVERSE END POINTS OF FIRST SHAPE
        const firstShape = closedShapeCollection[0]
        const first = firstShape[0] 
        const lastIndex = firstShape.length - 1
        const last = firstShape[lastIndex]
        firstShape[0] = last
        firstShape[lastIndex] = first
      }
      let closedShapeSide = [this.rectCutShapePen.endPoint.xy, this.rectCutShapePen.beginPoint.xy]
      let lastClosedShape = closedShapeSide
      rectCutShapeArray.forEach((rectCut,i)=>{
        if(i >= this.lineArrayPen.arrayCount)return
        if(!rectCut.beginPoint) return 
        if(Public.getDistanceTwoPoints(rectCut.beginPoint,rectCut.endPoint) === 0)return
        const secondarySideShapePoints = arrayIsOnLeftSide ? rectCut.rightSideOfCutRect : rectCut.leftSideOfCutRect
        const line1 = {beginPoint:lastClosedShape[0],endPoint:lastClosedShape[lastClosedShape.length - 1]}
        const firstPoint = secondarySideShapePoints[0]
        const lastPoint = secondarySideShapePoints[secondarySideShapePoints.length - 1]
        function insertPointIntoThisShapeOutput (point, normalDirection){
          if(normalDirection)closedShapeSide.unshift(point)
            else closedShapeSide.push(point)
        }
        if(Public.getPointIsBetweenTwoParallelLines( firstPoint, line1, rectCut ))insertPointIntoThisShapeOutput(firstPoint,arrayIsOnRightSide)
        if(Public.getPointIsBetweenTwoParallelLines( lastPoint, line1, rectCut ))insertPointIntoThisShapeOutput(lastPoint,arrayIsOnLeftSide)
        closedShapeCollection.push(getShape(rectCut, closedShapeSide))
        closedShapeSide = [ rectCut.endPoint.xy, rectCut.beginPoint.xy]
        lastClosedShape = arrayIsOnRightSide ? rectCut.rightSideOfCutRect : rectCut.leftSideOfCutRect
        lastClosedShape.unshift(arrayIsOnRightSide? rectCut.beginPoint.xy : rectCut.endPoint.xy)
        lastClosedShape.push(arrayIsOnRightSide ? rectCut.endPoint.xy : rectCut.beginPoint.xy)
      })
      closedShapeCollection.push(lastClosedShape)
    }

    this.rectCutShapePen.didInitEndPoint = ()=>{ 
      rectCutShapePenDidInitEndPoint()
      this.beginPoint = this.rectCutShapePen.beginPoint
      this.endPoint = this.rectCutShapePen.endPoint
      // this.beginPoint.xy = {x:14,y:90}
      // this.endPoint.xy = {x:334,y:390}
      // this.rectCutShapePen.conformToLineReference()
      // this.lineArrayPen.arrayGripPoint.xy = {x:150,y:60}
      this.rectCutShapePen.beginPoint.appendDidSet(refreshClosedShapeCollection)
      this.rectCutShapePen.endPoint.appendDidSet(refreshClosedShapeCollection)
      this.didInit()
    }

    this.didInit = ()=>{}

    this.drawLoop = ()=>{
      this.rectCutShapePen.drawLoop()
      this.lineArrayPen.drawLoop()
      rectCutShapeArray.forEach((rectCutShape, i) => {
        if(i < this.lineArrayPen.arrayCount )rectCutShape.drawLoop()
      })
    }
    this.mousePressEventStack = {
      mousePressOnLineArrayPen : {
        evaluate : (mousePressPoint, _arrayPen = this.lineArrayPen)=>{
          const result = _arrayPen.sendMousePress(mousePressPoint)
          if (result) return {arrayPen : _arrayPen , mousePressPoint}
        },
        execute : (info)=>{ 
          const {arrayPen , mousePressPoint} = info
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => { 
              arrayPen.sendMouseDrag(mouseDragPoint)
            },
            mouseRelease: (mouseReleasePoint) => {
              arrayPen.sendMouseRelease(mouseReleasePoint)
            }
          })
        }
      },
      mousePressOnRectCutShape : {
        evaluate : (mousePressPoint, pen = this.rectCutShapePen)=>{
          return pen.sendMousePress(mousePressPoint)
        },
        execute : ()=>{
          this.defineEventFunctions({
            mouseDragContinue: (mouseDragPoint) => {
              this.rectCutShapePen.sendMouseDrag(mouseDragPoint)
            },
            mouseRelease: (mouseReleasePoint) => {
              this.rectCutShapePen.sendMouseRelease(mouseReleasePoint)
            }
          })
        }
      },
    }
  }
  get arrayGripPoint (){
    return this.lineArrayPen.arrayGripPoint
  }
  // set arrayGripPoint (xy){
  //    this.lineArrayPen.arrayGripPoint.xy = xy
  // }

  get conformToLineReference(){
    return this.rectCutShapePen.conformToLineReference
  }

}