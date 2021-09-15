/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import { Public } from './Public.js';
import { State } from './State.js';

import { PenConstruct } from './PenConstruct.js';
import { Joint } from './ReactiveModules/Joint.js';
import { startMousePressPointTimer , LinePointSnapTool } from './PenTools.js'
import { MultiShapePen_01 } from './MultiShapePen_01.js'
import {
  DrawMark
} from './DrawMarks.js';


const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},setGripPoint:()=>{}, isNULL_OBJECT: true}
const GHOST_COLOR = 'rgba(0,0,0,.1)'

const{log} = console

export class CompositeShapePen extends PenConstruct {
  constructor(
    context,
  ) {
    super()
    this.context = context
    this.linePointSnapTool = LinePointSnapTool(this.context)

    this.jointCollection = new Set()
    const makeNewJoint = (point1,point2)=>{
      if(point1.jointReference)return
      if(point2.jointReference)return
      const newJoint = new Joint(point1,point2) 


      newJoint.context = this.context
      this.jointCollection.add(newJoint)
      return newJoint
    }

    this.shapeCollection = new Set()
    this.cursorTimer = NULL_OBJECT

    this.drawLoop = ()=>{
      ;[...this.shapeCollection].forEach(shape=>shape.drawLoop())
      ;[...this.jointCollection].forEach(joint=>{
          DrawMark.pointCaptureHalo(this.context, joint, 'rgba(123,123,0,.6)', 20, 1)
        }
      )
      this.cursorTimer.drawLoop()
      this.linePointSnapTool.draw()
      this.unConnectedPoints.forEach(pt=>{
        DrawMark.pointMark(this.context,pt)
      })
    }

    this.mousePressEventStack = {
      mousePressOnJoint : {
        evaluate:(mousePressPoint)=>{
          const joint  = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance + 4,[...this.jointCollection])
          if(joint) return {mousePressPoint,joint}
        },
        execute:(info)=>{
          this.defineEventFunctions({
            mouseDragContinue:(mouseDragPoint) =>{
              State.movePoints(info.mousePressPoint,mouseDragPoint,[info.joint])
            },
          })
        }
      },

      mousePressOnEndPoint : { //TODO RENAME TO mousePressOnConnectPoint
        evaluate:(mousePressPoint)=>{
          const point  = Public.getUserMouseClickOnPoint(mousePressPoint,this.proximityDistance,this.endPoints)
          if(point) return {mousePressPoint,contactPoint : point}
        },
        execute:(info)=>{ //DRAG TO MAKE NEW LINE-SHAPE OR SWITCH TO SELECT POINT TO MOVE ON DRAG
          let newShape,newJoint
          const {mousePressPoint,contactPoint} = info
          let unConnectedPoints
          
          this.cursorTimer =  startMousePressPointTimer({
            context : this.context,
            mousePressPoint,
            targetPoint : contactPoint,
            
            runFunction : ()=>{
              contactPoint.referenceLine.setSelectPoint(contactPoint)
              //* DELETE SHAPE AND NODE JUST CREATED
              this.shapeCollection.delete(newShape)
              this.jointCollection.delete(newJoint)
              newShape = undefined
              newJoint = undefined
              delete contactPoint.jointReference
              unConnectedPoints = this.unConnectedPoints.filter(pt=> pt !== contactPoint)
              this.linePointSnapTool.setup(contactPoint,[], this.context)
              this.defineEventFunctions({
                mouseDragContinue: (mouseDragPoint) => {
                  State.movePoints(mousePressPoint,mouseDragPoint, contactPoint)
                },
                mouseRelease: () => {
                  this.cursorTimer = NULL_OBJECT
                }
              })
            }
          })

          this.defineEventFunctions({
            mouseDragBegin:(mouseDragPoint) =>{
              newShape = new MultiShapePen_01(this.context)
              this.shapeCollection.add(newShape)
              newShape.sendMousePress(contactPoint)
              newShape.sendMouseDrag(mouseDragPoint)
              newJoint = makeNewJoint(contactPoint,newShape.beginPoint )
              newJoint.context = this.context
              ;[...this.jointCollection].push(newJoint)
              this.cursorTimer.sendMouseDrag(mouseDragPoint)
              unConnectedPoints = this.unConnectedPoints.filter(pt=> pt !== newShape.endPoint )
              this.linePointSnapTool.setup(newShape.endPoint,unConnectedPoints, this.context)
            },
            mouseDragContinue:(mouseDragPoint) =>{
              newShape.sendMouseDrag(mouseDragPoint)
              this.cursorTimer.sendMouseDrag(mouseDragPoint)
              this.linePointSnapTool.verifyMouseContact(mouseDragPoint)
            },
            mouseReleaseAfterDrag:(mousePoint) =>{
              newShape.sendMouseRelease(mousePoint)
              this.cursorTimer = NULL_OBJECT
              newShape.beginPoint.shapeReference = newShape
              newShape.endPoint.shapeReference = newShape
              newShape.didSetShapeBeginPoint = ()=>{ 
                newJoint.x = newShape.beginPoint.x
                newJoint.y = newShape.beginPoint.y
              }

              newShape.didSetShapeBeginPoint = ()=>{ 
                newJoint.xy = newShape.beginPoint.xy
              }

              const contactShape = contactPoint.shapeReference
              const contactIsBeginPoint = contactShape.beginPoint === contactPoint

              if(contactIsBeginPoint){
                contactShape.didSetShapeBeginPoint = ()=>{ 
                  newJoint.xy = contactShape.beginPoint.xy
                }
              } else {
                contactShape.didSetShapeEndPoint = ()=>{ 
                  newJoint.xy = contactShape.endPoint.xy
                }
              }
          if(this.linePointSnapTool.snapToPoint) makeNewJoint( this.linePointSnapTool.snapToPoint , this.linePointSnapTool.linePoint  ) 
            this.linePointSnapTool.cancel()
            },
            mouseReleaseWithoutDrag:(mousePoint) =>{
              this.cursorTimer = NULL_OBJECT
            }
          })
        }
      },

      mousePressOnShapeLine : {
        evaluate:(mousePressPoint)=>{
          let shapeHit, info
          ;[... this.shapeCollection].forEach(shape=>{
            const hit = shape.sendMousePress(mousePressPoint)
            if(hit){
              shapeHit = shape
              info = hit
            }
          })
          
          if(!shapeHit) return 
          if(info.eventKey !== 'mouseClickOnLine')return
          return {mousePressPoint,shape: shapeHit}
        },
        execute:(info)=>{

          const {mousePressPoint,shape} = info
          const lineIsAlreadySelected = shape.lineIsSelected
          shape.beginPointIsSelected = true
          shape.endPointIsSelected = true
          const beginpoint = shape.beginPoint.jointReference ? shape.beginPoint.jointReference : shape.beginPoint
          const endpoint = shape.endPoint.jointReference ? shape.endPoint.jointReference : shape.endPoint

          this.defineEventFunctions({
            mouseDragBegin:(mouseDragPoint) =>{
              State.movePoints(mousePressPoint,mouseDragPoint,[beginpoint, endpoint])
            },
            mouseDragContinue:(mouseDragPoint) =>{
              State.movePoints(mousePressPoint,mouseDragPoint,[beginpoint, endpoint])
            },
            mouseReleaseAfterDrag:(mousePoint) =>{
               if(!lineIsAlreadySelected){
                shape.beginPointIsSelected = false
                shape.endPointIsSelected = false
               }
            },
            mouseReleaseWithoutDrag:() =>{
               shape.beginPointIsSelected = lineIsAlreadySelected === false
               shape.endPointIsSelected = lineIsAlreadySelected === false
           }
          })
        }
      },

      mousePressOnShape : { 
        evaluate:(mousePressPoint)=>{
          let shapeHit , info
          ;[...this.shapeCollection].forEach(shape=>{
            const hit = shape.sendMousePress(mousePressPoint)
            if(hit){
              shapeHit = shape
              info = hit
            }
          })
          if(!shapeHit) return 
          return {mousePressPoint,shape: shapeHit}
        },
        execute:(info)=>{
          this.defineEventFunctions({
            mouseDragContinue:(mouseDragPoint) =>{
              info.shape.sendMouseDrag(mouseDragPoint)
            },
            mouseRelease:(mousePoint) =>{
              info.shape.sendMouseRelease(mousePoint)
            }
          })
        }
      },


      mousePressOnOpenCanvas : {
        evaluate:(mousePressPoint)=>{
          return {mousePressPoint}
        },
        execute:(info)=>{
          let newShape
          this.defineEventFunctions({
            mouseDragBegin:(mouseDragPoint) =>{
              newShape = new MultiShapePen_01(this.context)
              this.shapeCollection.add(newShape)
              newShape.sendMousePress(info.mousePressPoint)
              newShape.sendMouseDrag(mouseDragPoint)
            },
            mouseDragContinue:(mouseDragPoint) =>{
              newShape.sendMouseDrag(mouseDragPoint)
            },
            mouseReleaseAfterDrag:(mousePoint) =>{
              newShape.sendMouseRelease(mousePoint)
              newShape.beginPoint.shapeReference = newShape
              newShape.endPoint.shapeReference = newShape
              if(newShape.lineLength <= 5){
                this.shapeCollection.delete(newShape)
              }
            }
          })
        }
      }
    }


  }//** CLOSE CONSTRUCTOR */

  get endPoints (){
    const points = []
    ;[...this.shapeCollection].forEach(shape => {
      points.push(shape.beginPoint)
      points.push(shape.endPoint)
    })
    return points
  }

  get unConnectedPoints (){
    return this.endPoints.filter(pt=> pt.jointReference === undefined)
  }

}