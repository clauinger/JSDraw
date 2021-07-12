

//**------------------------------------------------------------------------------------------ */
//** POINT CLASS WITH DID-SET AND WILL-SET FUNCTIONALITY WHICH TRIGGERS WHEN X OR Y IS CHANGED */
//**------------------------------------------------------------------------------------------- */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

import { State } from "./State.js";
import {Public} from './Public.js'

const {log} = console



export class PointObservable {
  constructor(referencedPoint , lineReference){
    const initializedPoint = referencedPoint
    this.getInitializedPoint = ()=>{
        return initializedPoint
    }
    this.getMainPoint = ()=>{
      return referencedPoint
    }
    this.lineReference = lineReference
    //** BELOW IS TO PREVENT RECUSION INTO INFINITE LOOP WHEN TRIGGERED FIRST FROM POINT OBSERVABLE*/
    this.doNotRunNode = false
    this.setPointValuesWithoutObserverFunctionsRunning = (toMatchPointValues)=>{ 

      if(this.nodeReference && this.doNotRunNode === false){ 
        //** THIS WAS TRIGGERED BY DIRECT CHANGE OF NODE BOUND POINT; ROUTE TO ITS COORDINATION NODE */
        this.nodeReference.xy = toMatchPointValues

      } else { 
        this.oldValue.x = referencedPoint.x
        this.oldValue.y = referencedPoint.y
        referencedPoint.x = toMatchPointValues.x
        referencedPoint.y = toMatchPointValues.y
      }
    }

    this.oldValue = {x:referencedPoint.x,y:referencedPoint.y}
    this.willSet = ()=>{}
    this.didSet = ()=>{}
    this.appendDidSet = (addedFunc)=>{
      const didSet = this.didSet
      this.didSet = ()=>{
        didSet()
        addedFunc()
      }
    }
    this.nodeReference = null
  }
  get x (){
      return this.getMainPoint().x
  }
  set x (newVal){
    const currentValueOfY = this.getMainPoint().y
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning ({x: newVal, y:currentValueOfY} )
    this.didSet()
  }
  get y (){
    return this.getMainPoint().y
  }
  get clone (){
    return {
      x : this.x,
      y : this.y
    }
  }

  set y (newVal){
    const currentValueOfX = this.getMainPoint().x
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning ({x:currentValueOfX, y: newVal} )
    this.didSet()
  }
  /**
   * @param {{ x: any; y: any; }} newPoint
   */
  get xy (){ 
    return {x:this.x, y: this.y}
  }
  set xy (newPoint){ 
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning ({x:newPoint.x, y: newPoint.y} )
    this.didSet()
  }
}

export class Node {
  //** NODE IS A MEANS TO CONNECT 3 OR MORE POINTS */
  constructor(pointRefernces){
    this.nodePoint = new PointObservable({x:0,y:0})
    this.pointRefernces = []
    this.context
    this.draw = ()=>{
      if(!this.context ) return
      State.drawPointCaptureHalo(this.context,this.nodePoint,'rgba(123,123,0,.6)',20,1)
    }

    this.nodePoint.didSet = ()=>{ 

      this.pointRefernces.forEach(point=>{ 
        //** TELL POINT TO NOT COORDINATE WITH NODE */
        point.doNotRunNode = true
        //** COORDINATE POINT */
        point.xy = this.nodePoint.xy 
        //** RESET */
        point.doNotRunNode = false
      })
    }
    this.addPoint = (newPoint)=>{
      const pointIsAlreadyMember = (()=>{
        let val = false
        this.pointRefernces.forEach(pr => {
          if(pr === newPoint) val = true
        })
        return val
      })()
      if(pointIsAlreadyMember)return
      const emptyList = this.pointRefernces.length === 0
      if(emptyList)this.nodePoint.xy = newPoint.xy
      else newPoint.xy = this.nodePoint.xy
      this.pointRefernces.push(newPoint)
      newPoint.nodeReference = this
    }
    this.detachPoint = (point)=>{
      delete point.nodeReference
      this.pointRefernces = this.pointRefernces.filter(pt=>pt !== point)
    }
    if(pointRefernces){
      this.nodePoint.x = pointRefernces[0].x
      this.nodePoint.y = pointRefernces[0].y
      pointRefernces.forEach(pt => this.addPoint(pt))
    }
  } //** END CONSTRUCTOR */
  get x (){
    return this.nodePoint.x
  }
  set x (newVal){
    this.nodePoint.x = newVal
  }
  get y (){
    return this.nodePoint.y
  }
  set y (newVal){
    this.nodePoint.y = newVal
  }
  get xy (){ 
    return {x:this.nodePoint.x, y: this.nodePoint.y}
  }
  set xy (newPoint){ 
    this.nodePoint.xy = {x:newPoint.x, y: newPoint.y}//newPoint
  }
}


export class Joint {
  //** JOINT IS A MEANS TO CONNECT MIN-MAX 2 POINTS */
  //** JOINT WOULD BE OFTEN USED IN CONSTRUCTING SHAPES*/
  //** JOINT HAS NOTHING AT ALL TO DO WITH THE NODE-POINT RUN CYCLE */
  constructor(point1,point2){ 
    this.setPoint1 = (point)=>{ 
      point.jointReference = this
      point1 = point
    }
    
    this.setPoint2 = (point)=>{ 
      //** MAKE POINT2 MATCH XY OF POINT1 */
      point.jointReference = this
      point2 = point
      point2.xy = point1.xy
    }
    this.getPoint1 = ()=>{return point1}
    this.getPoint2 = ()=>{return point2}
    let ctx
    this.setContext = (context)=>{ctx = context}
    this.getContext = ()=>{return ctx}
    this.draw = ()=>{ 
      if(!ctx ) return
      State.drawPointCaptureHalo(ctx,point1,'rgba(123,123,0,.6)',20,1)
    }
    if(point1)this.setPoint1(point1)
    if(point2)this.setPoint2(point2)
  }
  get context (){
    return this.getContext()
  }
  set context (ctx){
    this.setContext(ctx)
  }
  get x(){
    return this.getPoint1().x
  }
  set x(newVal){
    this.getPoint1().x = newVal
    this.getPoint2().x = newVal

  }

  get xy(){
    const{x,y} = this.getPoint1()
    return {x,y}
  }

  set xy(newPoint){
    const{x,y} = newPoint
    this.getPoint1().xy = {x,y} 
    this.getPoint2().xy = {x,y} 
  }

  get y(){
    return this.getPoint1().y
  }
  set y(newVal){
    this.getPoint1().y = newVal
    this.getPoint2().y = newVal
  }

  get point1(){
    this.getPoint1
  }
  set point1(newPoint){ 
    this.setPoint1(newPoint)
  }
  get point2(){
    return this.getPoint2
  }

  set point2(newPoint){
    this.setPoint2(newPoint)
  }
}