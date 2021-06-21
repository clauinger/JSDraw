import {
  Public
} from './Public.js'
import {
  State
} from './State.js'

const {
  log
} = console

export const CursorLineSwiper = (
  context,
  mousePressPoint,
  ln, penDrift = 5,
  swipeHasGrabbedPointFunction = () => {},
  swipeBrokenPathFunction = () => {},
) => {
  let swipePathIsBroken = false
  let swipeHasGrabbedPoint = false
  let returnSnapIsEngaged = false
  let modifiedCursorPoint = Public.getPerpendicularPoint(ln, mousePressPoint)
  const coLinearMousePressPoint = Public.getPerpendicularPoint(ln, mousePressPoint)
  let returnSnapPoint


  mousePressPoint = { // MAKE mousePressPoint INTO AN INDEPENDANT COPY OF POINT PASSED IN
    x: mousePressPoint.x,
    y: mousePressPoint.y
  }

  const lineData = function () {
    const beginDist = Public.getLengthTwoPoints(ln.beginPoint, mousePressPoint)
    const endDist = Public.getLengthTwoPoints(ln.endPoint, mousePressPoint)
    const angleOppositeOfBeginPoint = Public.getLineAngle({
      beginPoint: coLinearMousePressPoint,
      endPoint: ln.endPoint
    })
    const angleOppositeOfEndPoint = Public.getLineAngle({
      beginPoint: coLinearMousePressPoint,
      endPoint: ln.beginPoint
    })
    if (beginDist < endDist) {
      return {
        startDistance: beginDist,
        oppositeDistance: endDist,
        oppositeAngle: angleOppositeOfBeginPoint,
        closestLinePoint: ln.beginPoint,
        oppositeEndPoint: ln.endPoint,
      }
    } else {
      /** endDist < beginDist === true */
      return {
        startDistance: endDist,
        oppositeDistance: beginDist,
        oppositeAngle: angleOppositeOfEndPoint,
        closestLinePoint: ln.endPoint,
        oppositeEndPoint: ln.beginPoint,
      }
    }
  }()

  const {
    closestLinePoint,
    oppositeEndPoint,
    oppositeAngle,
    oppositeDistance
  } = lineData
  let {
    startDistance
  } = lineData


  const closestLinePointClone = {
    x: closestLinePoint.x,
    y: closestLinePoint.y,
  }
  const drawMousePressPoint = () => {
    context.line(modifiedCursorPoint.x - 4, modifiedCursorPoint.y, modifiedCursorPoint.x + 4, modifiedCursorPoint.y)
    context.line(modifiedCursorPoint.x, modifiedCursorPoint.y - 4, modifiedCursorPoint.x, modifiedCursorPoint.y + 4)
  }

  const drawReturnSnapEngaged = () => {
    if (returnSnapPoint) {} else {
      return
    }
    if (returnSnapIsEngaged) {
      State.drawPointCaptureHalo(context, returnSnapPoint, 'rgba(0%, 70%, 0%, 0.5)', 12, 2)
    } else {
      State.drawPointCaptureHalo(context, returnSnapPoint, 'rgba(0%, 70%, 0%, 0.5)', 7, 1)
    }
  }

  let percentageOfDrift // = currentPenDriftDist / penDrift

  const drawPenDriftIndicator = () => { //percentageOfDrift
    if (swipePathIsBroken || swipeHasGrabbedPoint || percentageOfDrift === undefined) {
      return
    }
    // const 
    length = percentageOfDrift * oppositeDistance
    const endPoint = Public.getEndPoint(modifiedCursorPoint, length, oppositeAngle)
    context.stroke('rgba(100%, 0%, 0%, .15)')
    context.noFill()
    context.strokeWeight(penDrift * 2);
    context.line(modifiedCursorPoint.x, modifiedCursorPoint.y, endPoint.x, endPoint.y)
  }

  return {
    getModifiedCursorPoint: (cursorPoint) => {

      modifiedCursorPoint = Public.getPerpendicularPoint(ln, cursorPoint)
      const currentPenDriftDist = Public.getLengthTwoPoints(closestLinePointClone, cursorPoint)
      const delta = startDistance - currentPenDriftDist
      const distFromMousePressPoint = Public.getLengthTwoPoints(mousePressPoint, cursorPoint)
      const swipeGrabPointIsAtReturnSnap = swipeHasGrabbedPoint && currentPenDriftDist < penDrift
      const swipeGrabPointIsFree = swipeHasGrabbedPoint && currentPenDriftDist > penDrift
      const swipeBrokenPathIsAtReturnSnap = swipePathIsBroken && distFromMousePressPoint < penDrift
      const swipeBrokenPathIsFree = swipePathIsBroken && distFromMousePressPoint > penDrift


      if (swipeGrabPointIsAtReturnSnap) {
        modifiedCursorPoint = returnSnapPoint
        returnSnapIsEngaged = true
        return modifiedCursorPoint
      } else if (swipeGrabPointIsFree) {
        returnSnapIsEngaged = false
        return modifiedCursorPoint
      } else if (swipeBrokenPathIsAtReturnSnap) {

        modifiedCursorPoint = returnSnapPoint
        returnSnapIsEngaged = true
        return modifiedCursorPoint
      } else if (swipeBrokenPathIsFree) {
        modifiedCursorPoint = cursorPoint
        returnSnapIsEngaged = false
        return modifiedCursorPoint
      }
      const currentPenDriftDistance = Public.getLengthTwoPoints(modifiedCursorPoint, cursorPoint)
      percentageOfDrift = currentPenDriftDistance / penDrift
      const currentLineDrift = Public.getLengthTwoPoints(modifiedCursorPoint, cursorPoint)
      swipePathIsBroken = delta < -1 || currentLineDrift > penDrift
      swipeHasGrabbedPoint = currentPenDriftDist < penDrift

      if (swipePathIsBroken) {
        mousePressPoint = {
          x: modifiedCursorPoint.x,
          y: modifiedCursorPoint.y
        }
        returnSnapPoint = Public.getPerpendicularPoint(ln, cursorPoint)
        swipeBrokenPathFunction()
      } else if (swipeHasGrabbedPoint) {
        returnSnapPoint = {
          x: closestLinePointClone.x,
          y: closestLinePointClone.y
        }
        swipeHasGrabbedPointFunction()
      }
      return modifiedCursorPoint
    },
    getPreviousModifiedCursorPoint: () => {
      return modifiedCursorPoint
    },
    getReturnSnapPoint: () => {
      return returnSnapPoint
    },
    getGrabPoint: () => {
      if (swipeHasGrabbedPoint) {
        return closestLinePoint
      }
      return null
    },
    getSelectedLine: () => {
      if (swipePathIsBroken) {
        return ln
      }
      return null
    },
    closestLinePoint: closestLinePoint,
    draw: () => {
      drawReturnSnapEngaged()
      drawMousePressPoint()
      drawPenDriftIndicator()
      if (swipePathIsBroken) {
        return
      }
      context.stroke('rgba(100%, 0%, 0%, .15)')
      context.noFill()
      context.strokeWeight(penDrift * 2);
      context.line(closestLinePoint.x, closestLinePoint.y, modifiedCursorPoint.x, modifiedCursorPoint.y)
      State.drawTickCrossMark(context, coLinearMousePressPoint, 'rgba(0%, 70%, 0%, 0.5)', 3, .5)
      context.stroke('rgba(100%, 0%, 0%, 1)')
      context.strokeWeight(.5);
      State.drawTickCrossMark(context, modifiedCursorPoint, 'rgba(100%, 0%, 0%, 1)', 3, .5)

    },
  }
}

export class SelectionSet extends Set {
  constructor() {
    super()
    this.event = {}
    this.event.itemHasBeenAppended = () => {} //{log('itemHasBeenAppended')}
    this.event.itemHasBeenRemoved = () => {} //{log('itemHasBeenRemoved')}
    this.event.allHaveBeenRemoved = () => {} //{log('allHaveBeenRemoved')}
    this.event.setHasBeenReplaced = () => {} //{log('setHasBeenReplaced')}
  }
  append(item) {
    if (this.has(item)) {
      return
    }
    this.add(item)
    this.event.itemHasBeenAppended()

  }
  remove(item) {
    if (this.has(item) === false) {
      return
    }
    this.delete(item)
    this.event.itemHasBeenRemoved()
  }

  removeAll() {
    if (this.size > 0) {
      this.clear()
      this.event.allHaveBeenRemoved()
    }
  }
  replaceSet(newArray) {
    this.clear()
    newArray.forEach(item => this.add(item))
    this.event.setHasBeenReplaced()
  }
}

export const startMousePressPointTimer = ( inputs ) => {
  let {context, 
    mousePressPoint,
    targetPoint,
    timeDuration = 700, 
    startTime = Date.now(),
    penDrift = 5, 
    runFunction = ()=>{log('Switch Command')},
    isOutOfBounds = false
  } = inputs
  let isCanceled = false
  const _timeDuration  = timeDuration

  if(!targetPoint && mousePressPoint )targetPoint = {
    x: mousePressPoint.x,
    y: mousePressPoint.y
  }
  const getTimeFraction = () => {
    const diff = Date.now() - startTime
    return diff / timeDuration
  }
  function getMarkSize(){
    return (1 - getTimeFraction()) * 40
  }
  return {
    sendMouseDrag: (mouseDragPoint)=> {
      const dist = Public.getDistanceTwoPoints(targetPoint, mouseDragPoint)
      const dragIsOutside = dist > penDrift
      const mouseOut = !isOutOfBounds && dragIsOutside
      const mouseIn = isOutOfBounds && !dragIsOutside

      if(mouseIn) /** RESTART THE TIMER, IN SLOW TIME MODE*/ {
        isOutOfBounds = false
        timeDuration = _timeDuration * 1.5
        startTime = Date.now()
      } else if(mouseOut) /** KILL THE TIMER */ {
        isOutOfBounds = true
      }
    },

    drawLoop: () => {
      if(isCanceled)return
      if(isOutOfBounds) return
      const timefac  = getTimeFraction()

      if(timefac >= 1){
        isCanceled = true
        runFunction(targetPoint)
      }
      context
        .stroke('rgba(100%, 0%, 0%, 1)')
        .noFill()
        .strokeWeight(1)
        .circle(targetPoint.x, targetPoint.y, getMarkSize())
    },
  }
}


export const CursorTimer = (context, timeDuration = 2000, penDrift = 5, runFunction) => {
  let mousePressPoint
  let timer
  let isOutOfBounds = false
  let functionAlive = false
  let startTime
  let counter = 1
  const _runFunction = () => { 
    if (functionAlive) {
      runFunction()
      functionAlive = false
      clearTimeout(timer)
    }
  }
  const timeFraction = () => {
    const diff = Date.now() - startTime
    // log((diff / timeDuration))
    return (diff / timeDuration) - 1.5
  }
  return {

    reset: (newMousePressPoint) => {
      mousePressPoint = newMousePressPoint
      // log('setTimeout')
      timer = setTimeout(_runFunction, timeDuration)
      startTime = Date.now()
      functionAlive = true
    },

    currentPenPoint: (newPoint) => { 
      if (functionAlive === false) return
      const distance = Public.getLengthTwoPoints(mousePressPoint, newPoint)
      if (isOutOfBounds) {
        isOutOfBounds = distance > penDrift
        if ( /**STILL*/ isOutOfBounds === false) {
          /**RESET*/
          timer = setTimeout(_runFunction, timeDuration)
          startTime = Date.now()
        }
      } else if (distance > penDrift) {
        clearTimeout(timer)
        isOutOfBounds = true
        counter += 1
        if (counter === 3) {
          penDrift *= 0.3333
          timeDuration *= 3
        }
      }
    },
    mousePressPoint: () => {
      return mousePressPoint
    },

        isActive : ()=>{return functionAlive && isOutOfBounds === false },
    draw: () => {
      if(!functionAlive) return
      if(!mousePressPoint)return
      if(isOutOfBounds) return
      // log(timeFraction())
      context
        .stroke('rgba(100%, 0%, 0%, 1)')
        .noFill()
        .strokeWeight(1)
        .circle(mousePressPoint.x, mousePressPoint.y, (timeFraction() * 10))
    },
    cancel: () => { 
      if (functionAlive) {
        clearTimeout(timer)
        functionAlive = false
      }
    }

  }
}


export const cursorTracker = (totalDistanceBoundry = 20) => {
  let distance = 0
  let lastPoint
  return {
    totalDistance: (newPoint = null, reset = false) => {
      if (reset) {
        lastPoint = {
          x: newPoint.x,
          y: newPoint.y
        }
        distance = 0
      } else if (newPoint) {
        distance += Public.getLengthTwoPoints(lastPoint, newPoint)
        lastPoint = {
          x: newPoint.x,
          y: newPoint.y
        }
      }
      if (distance > totalDistanceBoundry) {
        return 'over'
      } else {
        return distance
      }

    }
  }
}

export function setMousePointToSnapPointIfInProximity (mousePoint, snapPerameter){
  /** 
   * CHECK IF mousePoint IS IN PROXIMITY OF snapPerameter
   * IF SO THEN MODIFY mousePoint AND snapPerameter.isEngaged
   * return bool
  */
  if (snapPerameter === null){
      return null
  }
  const cursorDist = Public.getLengthTwoPoints(snapPerameter.point, mousePoint)
  const snapIsEngaged = cursorDist < snapPerameter.proximityDistance
  if(snapIsEngaged){
      mousePoint.x = snapPerameter.point.x
      mousePoint.y = snapPerameter.point.y
      snapPerameter.isEngaged = true
      
      return true
  } else {
      snapPerameter.isEngaged = false
      return false
  }
} 

export function modifyMousePointIfSnapIsEngaged(mousePoint, returnSnapObject) {
  if (returnSnapObject == null) {
    return null
  }
  const cursorDist = Public.getLengthTwoPoints(returnSnapObject.point, mousePoint)
  const snapIsEngaged = cursorDist < returnSnapObject.proximityDistance
  if (snapIsEngaged) {
    mousePoint.x = returnSnapObject.point.x
    mousePoint.y = returnSnapObject.point.y
    returnSnapObject.isEngaged = true
  } else {
    returnSnapObject.isEngaged = false
  }
}



export function setSnapPointEngaged (mousePoint, returnSnapObject, modifyMousePointObject = null){
  /** return null or number (snap distance)
   *  modifyMousePointObject is optional; if provided (non null) then the state 
   *  of that object will be modified
  */
 if (returnSnapObject == null){
     return null
 }
  const cursorDist = Public.getLengthTwoPoints(returnSnapObject.point, mousePoint)
  const snapIsEngaged = cursorDist < returnSnapObject.proximityDistance
  if(snapIsEngaged == false){
      returnSnapObject.isEngaged = false
      // log(cursorDist)
      modifyMousePointObject.mouseX = mousePoint.x
      modifyMousePointObject.mouseY = mousePoint.y
      return null
  } else if (modifyMousePointObject){
      // log(333)
      modifyMousePointObject.mouseX = returnSnapObject.point.x
      modifyMousePointObject.mouseY = returnSnapObject.point.y
  } 
  returnSnapObject.isEngaged = true
  return cursorDist
} 


export const grip = (context, reachLocation, color = 'rgba(0%, 0%, 50%, 0.3)' )=>{ 
  let gripPoint = {x:0,y:0}
  function setGripPoint (){ 
    const gp = reachLocation()
    if(!gp) return
    gripPoint.x = gp.x
    gripPoint.y = gp.y
  }
  function verifyMousePress (mousePressPoint){
    if(_hidden)return false
    if(!gripPoint)return false
    if (Public.getUserMouseClickOnPoint(mousePressPoint,7,[gripPoint])) return true
    return false
  }
  const mark = {radius : 6, lineWidth : 2, color}

  let _hidden = false
  return {
    draw:(ctx = context)=>{
      if(!ctx)return
      if(!gripPoint)return
      if(_hidden)return
      State.drawPointCaptureHalo(ctx, gripPoint, mark.color, mark.radius, mark.lineWidth)
    },
    setContext :(ctx)=>{
      context = ctx
    },
    setGripPoint,
    verifyMousePress,
    get gripPoint(){
      return gripPoint
    },
    get isToggledOn(){
      return mark.radius === 8
    },
    get hidden (){
      return _hidden
    },
    set hidden (bool){
      _hidden = bool
    },
    get drawParameters(){
      return mark
    },


    toggleOn : (on)=>{
      if(on === undefined){
        on = mark.radius === 8? false : true
      }
      if(on){
        mark.radius = 8
        mark.lineWidth = 2
        // mark.color = 'rgba(100%, 0%, 100%, 0.9)'
      } else {
        mark.radius = 6
        mark.lineWidth = 2
        mark.color = color
      }
    }
  }
}

export const LinePointSnapTool = ( _context, _proximityDistance = 5)=>{ 
  let _snapPoint, _linePoint,_snapPointCollection , oppositePoint

  function setLinePoint(newPoint){
    _linePoint = newPoint
    // NOW FIND AN OPPOSITE POINT TO DRAW
    const parentReference = newPoint.lineReference || newPoint.shapeReference || null
    if(!parentReference)return
    oppositePoint = parentReference.beginPoint === _linePoint ? 
      parentReference.endPoint : 
      parentReference.beginPoint

  }
  return {
    verifyMouseContact : (mousePoint)=>{ 
      if(!_linePoint) return
      _snapPoint = Public.getUserMouseClickOnPoint(mousePoint,_proximityDistance,_snapPointCollection )
      return _snapPoint ? true : false
    },
    draw: ()=>{     
      if(!_snapPoint)return
      if(!_context)return
      _context.stroke('rgba(255,0,0,0.15)')
      _context.strokeWeight(4)
      _context.fill('rgba(255,0,0,0.25)')
      _context.circle(_snapPoint.x, _snapPoint.y, 13)
      if(oppositePoint){ //**THEN DRAW PREVIEW LINE */
        _context.strokeWeight(2)
        _context.stroke('white')
        _context.line(oppositePoint.x,oppositePoint.y,_snapPoint.x,_snapPoint.y)
      }
      _context.strokeWeight(1)
      _context.stroke('rgba(0,0,0,1)')
    },
    get linePoint(){
      return _linePoint
    },
    set linePoint(newPoint){
      setLinePoint(newPoint)
    },
    get context(){
      return _context
    },
    set context(ctx){
      _context = ctx
    },

    get snapPointCollection (){
      return _snapPointCollection
    },
    set snapPointCollection (arr){
      _snapPointCollection = arr
    },
    //_proximityDistance
    get proximityDistance (){
      return _proximityDistance
    },
    set proximityDistance (num){
      _proximityDistance = num
    },
    get snapToPoint (){
      return _snapPoint
    },
    setup : (linePoint, snapPointCollection, context)=>{
      setLinePoint(linePoint)
      _snapPointCollection = snapPointCollection
      _context = context
    },
    cancel : ()=>{
      _linePoint = null
      _snapPoint = null
    }

    
  }
}