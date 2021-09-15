//**------------------------------------------------------------------------------------------ */
//** THIS CONNECTS 2 POINTS TOGETHER IN REACTIVE STACK                                          */
//**------------------------------------------------------------------------------------------- */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const {
  log
} = console

export class Joint {
  //** JOINT IS A MEANS TO CONNECT MIN-MAX 2 POINTS */
  //** JOINT IS PRIMARY FOR CONSTRUCTING SHAPES*/
  //** JOINT HAS NOTHING AT ALL TO DO WITH THE NODE-POINT RUN CYCLE */
  constructor(point1, point2) {
    this.setPoint1 = (point) => {
      point.jointReference = this
      point1 = point
    }
    this.setPoint2 = (point) => {
      //** MAKE POINT2 MATCH XY OF POINT1 */
      point.jointReference = this
      point2 = point
      point2.xy = point1.xy
    }
    this.getPoint1 = () => {
      return point1
    }
    this.getPoint2 = () => {
      return point2
    }
    // let ctx
    // this.setContext = (context) => {
    //   ctx = context
    // }
    // this.getContext = () => {
    //   return ctx
    // }
    // this.draw = () => {
    //   if (!ctx) return
    //   DrawMark.pointCaptureHalo(ctx, point1, 'rgba(123,123,0,.6)', 20, 1)
    // }
    if (point1) this.setPoint1(point1)
    if (point2) this.setPoint2(point2)
  }
  // get context() {
  //   return this.getContext()
  // }
  // set context(ctx) {
  //   this.setContext(ctx)
  // }
  get x() {
    return this.getPoint1().x
  }
  set x(newVal) {
    this.getPoint1().x = newVal
    this.getPoint2().x = newVal
  }
  get xy() {
    const {
      x,
      y
    } = this.getPoint1()
    return {
      x,
      y
    }
  }

  set xy(newPoint) {
    const {
      x,
      y
    } = newPoint
    this.getPoint1().xy = {
      x,
      y
    }
    this.getPoint2().xy = {
      x,
      y
    }
  }

  get y() {
    return this.getPoint1().y
  }
  set y(newVal) {
    this.getPoint1().y = newVal
    this.getPoint2().y = newVal
  }

  get point1() {
    this.getPoint1
  }
  set point1(newPoint) {
    this.setPoint1(newPoint)
  }
  get point2() {
    return this.getPoint2
  }

  set point2(newPoint) {
    this.setPoint2(newPoint)
  }
}