/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import {
  LineShapePen
} from './LineShapePen.js'

import {
  LineSeriesPen
} from './LineSeriesPen.js'

import { Public } from './Public.js';
import { State } from './State.js';
import { grip} from './PenTools.js';
import { PenConstruct } from './PenConstruct.js';
import { Node , Joint } from './PointObservable.js';
import { BezierShapePen } from './BezierShapePen.js';
import { ArcShapePen } from './ArcShapePen.js';
import {UniversalShapePen} from './UniversalShapePen.js'
import { startMousePressPointTimer } from './PenTools.js'

const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},setGripPoint:()=>{}, isNULL_OBJECT: true}
const GHOST_COLOR = 'rgba(0,0,0,.1)'

const{log} = console

export class CompositePen extends PenConstruct {
  constructor(
    context,
  ) {
    super()
    // log(context)
    this.ctx = context

    // this.node = new Node()
    this.jointCollection = []
    this.shapeCollection = []

    this.mousePressSetup = () => {}
    this.drawLoop = ()=>{ 
      if(!this.ctx)return
      this.shapeCollection.forEach(shape=>shape.drawLoop())

      this.jointCollection.forEach(node=>node.draw())
      this.cursorTimer.drawLoop()
    }

    this.cursorTimer = NULL_OBJECT 

    this.mousePressEventStack = {
  
/***
mouseClickedOn_____ : {
  evaluate:(mousePressPoint, jointCollection = this.jointCollection)=>{
    const node = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance,jointCollection)
    if(node)return {mousePressPoint, node}
  },
  exicute:(info)=>{ 

    this.defineEventFunction({
      mouseDragContinue: (mouseDragPoint) => {

      }
    })
    this.defineEventFunction({
      mouseRelease: () => {
      }
    })
  }
},
 */



      mouseClickedOnPoint : {
        evaluate:(mousePressPoint, lineCollection = this.lineCollection)=>{ log('mouseClickedOnPoint')
          const points = Public.filterNodelessMainPoints(this.shapeCollection)
          const contactPoint = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance,points)
          if(contactPoint) return {mousePressPoint ,contactPoint, node : contactPoint.nodeReference}
        },
        exicute:(info)=>{ log(info)
          const {contactPoint, mousePressPoint} = info
          this.cursorTimer =  startMousePressPointTimer({
            context : this.context,
            mousePressPoint,
            targetPoint : contactPoint,
            runFunction : ()=>{
              contactPoint.lineReference.setSelectPoint(contactPoint)
              //* DELETE SHAPE AND NODE JUST CREATED
              this.shapeCollection = this.shapeCollection.filter(shape=>shape !== newShape)
              this.jointCollection = this.jointCollection.filter(joint=>joint !== newJoint)
              newShape = undefined
              newJoint = undefined
              delete contactPoint.nodeReference

              this.defineEventFunction({
                mouseDragBegin: () => {}
              })
              this.defineEventFunction({
                mouseDragContinue: (mouseDragPoint) => {
                  State.movePoints(mousePressPoint,mouseDragPoint, contactPoint)
                }
              })
              this.defineEventFunction({
                mouseRelease: () => {
                  this.cursorTimer = NULL_OBJECT
                }
              })
            }
          })

          let newShape, newJoint
          this.defineEventFunction({
            mouseDragBegin: (mouseDragPoint) => {
              this.cursorTimer.sendMouseDrag(mouseDragPoint)
              newJoint = new Joint()
              newJoint.context = this.context
              this.jointCollection.push(newJoint)
              newJoint.addPoint(contactPoint)
              // newShape = new LineShapePen(this.context,contactPoint.xy,mouseDragPoint)
newShape = new UniversalShapePen(this.context,contactPoint.xy,mouseDragPoint)
newShape.init()

              // newJoint.addPoint(newShape.beginPoint)
newJoint.addPoint(newShape.beginNode)
              this.shapeCollection.push(newShape)
            }
          })
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint) => {

              this.cursorTimer.sendMouseDrag(mouseDragPoint)
              newShape.endPoint.xy = mouseDragPoint
            }
          })
          this.defineEventFunction({
            mouseReleaseAfterDrag: (mousePoint) => {
              this.cursorTimer = NULL_OBJECT
            }
          })
          this.defineEventFunction({
            mouseReleaseWithoutDrag: (mousePoint) => {
              contactPoint.lineReference.setSelectPoint(contactPoint)
              this.cursorTimer = NULL_OBJECT
            }
          })
        }
      },
    
      mouseClickedOnNode : {
        evaluate:(mousePressPoint, jointCollection = this.jointCollection)=>{
          const node = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance,jointCollection)
          if(node)return {mousePressPoint, node}
        },
        exicute:(info)=>{ 
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint) => {
              State.movePoints(info.mousePressPoint, mouseDragPoint,[info.node])
            }
          })
          this.defineEventFunction({
            mouseRelease: () => {
            }
          })
        }
      },

      mouseClickedOnShape : {
        evaluate:(mousePressPoint, shapeCollection = this.shapeCollection)=>{
          let result
          shapeCollection.forEach(shape=>{
            if(result)return
            const hit = shape.sendMousePress(mousePressPoint)
            if(hit)result = shape
          })
          return result
        },
        exicute:(result)=>{ 
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint) => {
              result.sendMouseDrag(mouseDragPoint)
            }
          })
          this.defineEventFunction({
            mouseRelease: () => {
              result.sendMouseRelease()
            }
          })
        }
      },
      mouseClickedOnOpenCanvas : {
        evaluate:(mousePressPoint)=>{
          return {mousePressPoint}
        },
        exicute:(result)=>{ 

          let dragPoint
          let newShape
          this.defineEventFunction({
            mouseDragBegin: (mouseDragPoint) => {
              // result.sendMouseDrag(mouseDragPoint
              //  newShape = new LineShapePen(this.context,result.mousePressPoint,mouseDragPoint)
newShape = new UniversalShapePen(this.context,result.mousePressPoint,mouseDragPoint)
newShape.init()
              dragPoint = newShape.endPoint
              this.shapeCollection.push(newShape)
            }
          })
          this.defineEventFunction({
            mouseDragContinue: (mouseDragPoint) => {
              dragPoint.xy = mouseDragPoint
            }
          })
          this.defineEventFunction({
            mouseRelease: () => {
              // shape.sendMouseRelease()
              
            }
          })
        }
      }

    }
   
  }//** CLOSE CONSTRUCTOR */
  get context (){
    return this.ctx
  }
  set context (ctx){ 
    this.ctx = ctx
  }


}