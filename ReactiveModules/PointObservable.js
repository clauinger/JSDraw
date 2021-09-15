

//**------------------------------------------------------------------------------------------ */
//** POINT CLASS WITH DID-SET AND WILL-SET FUNCTIONALITY WHICH TRIGGERS WHEN X OR Y IS CHANGED */
//**------------------------------------------------------------------------------------------- */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const {
  log
} = console
const EMPTY_FUNCTION = () => {}
export class PointObservable {
  constructor(referencedPoint = {
    x: 0,
    y: 0,
  }, referenceLine) {
    const initializedPoint = referencedPoint.xy || referencedPoint
    this.getInitializedPoint = () => {
      return initializedPoint
    }
    this.getMainPoint = () => {
      return referencedPoint.xy || referencedPoint
    }
    this.referenceLine = referenceLine
    //** BELOW IS TO PREVENT RECUSION INTO INFINITE LOOP WHEN TRIGGERED FIRST FROM POINT OBSERVABLE*/
    this.doNotRunNode = false
    this.setPointValuesWithoutObserverFunctionsRunning = (toMatchPointValues) => {
      if (this.nodeReference && this.doNotRunNode === false) {
        //** THIS WAS TRIGGERED BY DIRECT CHANGE OF NODE BOUND POINT; ROUTE TO ITS COORDINATION NODE */
        this.nodeReference.xy = toMatchPointValues
      } else {
        this.oldValue.x = referencedPoint.x
        this.oldValue.y = referencedPoint.y
        referencedPoint.x = toMatchPointValues.x
        referencedPoint.y = toMatchPointValues.y
      }
    }

    this.oldValue = {
      x: referencedPoint.x,
      y: referencedPoint.y
    }
    this.willSet = EMPTY_FUNCTION //()=>{}
    this.didSet = EMPTY_FUNCTION //()=>{}
    //** DID SET ARRAY WILL RUN EACH FUNCTION IN ORDER AFTER PRIMARY DID SET FUNCTION RUNS */
    this.didSetArray = []
    this.appendDidSet = (addedFunc) => {
      this.didSetArray.push(addedFunc)
    }
    this.removeDidSetFunction = (removeFunc) => {
      this.didSetArray = this.didSetArray.filter(func => func !== removeFunc)
    }
    this.nodeReference = null
  }
  get x() {
    return this.getMainPoint().x
  }
  set x(newVal) {
    const currentValueOfY = this.getMainPoint().y
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning({
      x: newVal,
      y: currentValueOfY
    })
    this.didSet()
    this.didSetArray.forEach(func => func())
  }
  get y() {
    return this.getMainPoint().y
  }
  get clone() {
    return {
      x: this.x,
      y: this.y
    }
  }

  set y(newVal) {
    const currentValueOfX = this.getMainPoint().x
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning({
      x: currentValueOfX,
      y: newVal
    })
    this.didSet()
    this.didSetArray.forEach(func => func())

  }
  /**
   * @param {{ x: any; y: any; }} newPoint
   */
  get xy() {
    return {
      x: this.x,
      y: this.y
    }
  }
  set xy(newPoint) {
    this.willSet()
    this.setPointValuesWithoutObserverFunctionsRunning({
      x: newPoint.x,
      y: newPoint.y
    })
    this.didSet()
    this.didSetArray.forEach(func => func())

  }
}