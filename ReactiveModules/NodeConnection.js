
//**------------------------------------------------------------------------------------------ */
//** THIS CONNECTS MULTIPLE POINTS TOGETHER IN REACTIVE STACK                                  */
//**------------------------------------------------------------------------------------------ */

import {
  PointObservable
} from './PointObservable.js'


/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const {
  log
} = console

export class NodeConnection {
  //** NODE IS A MEANS TO CONNECT 3 OR MORE POINTS */
  constructor(pointRefernces) {
    this.nodePoint = new PointObservable({
      x: 0,
      y: 0
    })
    this.pointRefernces = []

    //REMOVED DRAWING/RENDERING/CANVAS REFERENCES AND METHODS 
    // this.context
    // this.draw = () => {
    //   if (!this.context) return
    //   DrawMark.pointCaptureHalo(this.context, this.nodePoint, 'rgba(123,123,0,.6)', 20, 1)
    // }
    this.nodePoint.didSet = () => {
      this.pointRefernces.forEach(point => {
        //** TELL POINT TO NOT COORDINATE WITH NODE */
        point.doNotRunNode = true
        //** COORDINATE POINT */
        point.xy = this.nodePoint.xy
        //** RESET */
        point.doNotRunNode = false
      })
    }
    this.addPoint = (newPoint) => {
      const pointIsAlreadyMember = (() => {
        let val = false
        this.pointRefernces.forEach(pr => {
          if (pr === newPoint) val = true
        })
        return val
      })()
      if (pointIsAlreadyMember) return
      const emptyList = this.pointRefernces.length === 0
      if (emptyList) this.nodePoint.xy = newPoint.xy
      else newPoint.xy = this.nodePoint.xy
      this.pointRefernces.push(newPoint)
      newPoint.nodeReference = this
    }
    this.detachPoint = (point) => {
      delete point.nodeReference
      this.pointRefernces = this.pointRefernces.filter(pt => pt !== point)
    }
    if (pointRefernces) {
      this.nodePoint.x = pointRefernces[0].x
      this.nodePoint.y = pointRefernces[0].y
      pointRefernces.forEach(pt => this.addPoint(pt))
    }
  } //** END CONSTRUCTOR */
  get x() {
    return this.nodePoint.x
  }
  set x(newVal) {
    this.nodePoint.x = newVal
  }
  get y() {
    return this.nodePoint.y
  }
  set y(newVal) {
    this.nodePoint.y = newVal
  }
  get xy() {
    return {
      x: this.nodePoint.x,
      y: this.nodePoint.y
    }
  }
  set xy(newPoint) {
    this.nodePoint.xy = {
      x: newPoint.x,
      y: newPoint.y
    } //newPoint
  }
}
