//**-----------------------------------------------------------  */
//** BASE "PEN" CLASS FOR CUSTOM MOUSE-PRESS/DRAG/RELEASE EVENTS */
//**-----------------------------------------------------------  */

/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

const DEV_LOG_ON = false
const {
  log
} = DEV_LOG_ON ? console : {
  log: () => {}
}

function getReOrderedObject(thisObject, toKeyOrder) { 
  // RETURNS REORDERED COPY OF OBJECT
  const newReOrderedObject = {}
  toKeyOrder.map(key => {
    newReOrderedObject[key] = thisObject[key]
  })
  return newReOrderedObject
}

let mousePressFoundSomethingTimeStamp

export class PenConstruct {
  constructor() { 
    this.mouseWasDragged = false;
    this.returnSnap = null
    this.proximityDistance = 5

    this.eventID = null
    const eventFunction = {
      mousePress: (
        mousePressPoint,
        specifiedEventKeys = Object.keys(this.mousePressEventStack)
      ) => {
        this.mousePressSetup(mousePressPoint)
        const needsInitialation = this.userInitializer.evaluateRequirements()

        if (needsInitialation) {
          this.lastEventKey = 'userInitializer'
          // const tt = this.userInitializer.execute(mousePressPoint)
          this.userInitializer.execute(mousePressPoint)
          return
        }
        this.userMousePressInfo = null
        if (typeof specifiedEventKeys === 'string') {
          specifiedEventKeys = [specifiedEventKeys]
        }
        const mousePressEventStackKeys = Object.keys(this.mousePressEventStack)
        let stopEvaluation = false
        specifiedEventKeys.forEach(specifiedEvent => { 
          // if(stopEvaluation)return 
      
          if (mousePressEventStackKeys.includes(specifiedEvent) === false) {
            throw new Error(specifiedEvent + ' is not a valid member of mousePressEventStack')
          } else if (this.userMousePressInfo)return

          let findings = this.mousePressEventStack[specifiedEvent].evaluate(
            mousePressPoint
          )
          if (!findings) {
            return
          } else if ((typeof findings) !== 'object') {
            findings = {
              data: findings
            }
            // mousePressFoundSomethingTimeStamp = Date.now()
            // console.log(mousePressFoundSomethingTimeStamp)
          }
          findings.eventKey = specifiedEvent
          if (findings.eventKey === '') {
            findings.eventKey = specifiedEvent
            log(specifiedEvent + 'specifiedEvent was empty string \"\": has been set to ' + specifiedEvent)
            // mousePressFoundSomethingTimeStamp = Date.now()
            // console.log(mousePressFoundSomethingTimeStamp)
          }
          this.userMousePressInfo = findings
          // for (const key in findings) {
          //   log('\t' + key + ': ' + findings[key])
          // }
        })

        if (this.userMousePressInfo) {
          this.lastEventKey = this.userMousePressInfo.eventKey
          this.mousePressEventStack[this.userMousePressInfo.eventKey].execute(this.userMousePressInfo)
          return this.userMousePressInfo //true
        }
        return false
      },
      mouseDragBegin: () => {
        log('mouseDragBegin')
      },
      mouseDragContinue: () => {
        log('mouseDragContinue')
      },
      mouseReleaseAfterDrag: () => {
        log('mouseReleaseAfterDrag')
      },
      mouseReleaseWithoutDrag: () => {
        log('mouseReleaseWithoutDrag')
      },
      mouseRelease: () => {
        log('mouseRelease')
      },
      mouseHover : () => {
        log('mouseHover')
      },

    }
    this.eventFunction = eventFunction
    const NULL_EVENT_CALLBACK = ()=>{}
    const clearEventFunctions = () => {
      eventFunction.mouseDragBegin = NULL_EVENT_CALLBACK
      eventFunction.mouseDragContinue = NULL_EVENT_CALLBACK
      eventFunction.mouseReleaseAfterDrag = NULL_EVENT_CALLBACK
      eventFunction.mouseReleaseWithoutDrag = NULL_EVENT_CALLBACK
      eventFunction.mouseRelease = NULL_EVENT_CALLBACK
    }


    //**TODO EVALUATE BELOW AS TO WHERE IT IS CALLED. DELETE IF NOT USED */
    // this.evaluateMousePoint = (
    //   mousePressPoint,
    //   specifiedEventKeys = Object.keys(this.mousePressEventStack)) => {
    //   if (typeof specifiedEventKeys === 'string') {
    //     specifiedEventKeys = [specifiedEventKeys]
    //   }
    //   const mousePressEventStackKeys = Object.keys(this.mousePressEventStack)
    //   let userMousePressInfo = null
    //   specifiedEventKeys.forEach(specifiedEvent => {
    //     if (mousePressEventStackKeys.includes(specifiedEvent) === false) {
    //       throw new Error(specifiedEvent + ' is not a valid member of mousePressEventStack')
    //     } else if (userMousePressInfo) {
    //       return
    //     }
    //     // console.log(9999)
    //     const findings = this.mousePressEventStack[specifiedEvent].evaluate(
    //       mousePressPoint,
    //       specifiedEvent
    //     )
    //     if (findings) {
    //       userMousePressInfo = findings
    //       for (const key in findings) {
    //         log('\t' + key + ': ' + findings[key])
    //       }
    //     }
    //   })
    //   return userMousePressInfo
    // }


    this.defineEventFunction = function (keyedFunctionPair) { 
      const key = Object.keys(keyedFunctionPair)[0]
      switch (key) {
        case 'mouseRelease': {
          eventFunction.mouseReleaseAfterDrag = NULL_EVENT_CALLBACK
          eventFunction.mouseReleaseWithoutDrag = NULL_EVENT_CALLBACK
        }
        break
        case 'mouseReleaseWithoutDrag': {
          eventFunction.mouseRelease = NULL_EVENT_CALLBACK
        }
        break
        case 'mouseReleaseAfterDrag': {
          eventFunction.mouseRelease = NULL_EVENT_CALLBACK
        }
      }
      eventFunction[key] = keyedFunctionPair[key]
    }

    this.defineEventFunctions =  (keyedFunctionPairs)=> { 
      for (const key in keyedFunctionPairs) {
        if (keyedFunctionPairs.hasOwnProperty(key)) {
          const eventCallback = keyedFunctionPairs[key];
          const singleKeyValuePair = {}
          singleKeyValuePair[key] = eventCallback
          this.defineEventFunction(singleKeyValuePair)
        }
      }
    }

    //**------------------------------------------------------ */
    //** CREATE A DOUBLE CLICK EVENT STREAM */
    let mouseClickTimeStamp

    this.onMouseDoubleClick = NULL_EVENT_CALLBACK
    const getDoubleEvent = ()=>{
      const lastTimeStamp = mouseClickTimeStamp
      mouseClickTimeStamp = Date.now()
      if(!lastTimeStamp)return
      const timeDurationBetweenClicks = mouseClickTimeStamp - lastTimeStamp
      if(timeDurationBetweenClicks < 200) this.onMouseDoubleClick()
    }
    //**------------------------------------------------------ */

    this.sendMousePress = (mousePressPoint) => {

      getDoubleEvent()
      const {x,y} = mousePressPoint
      mousePressPoint = {x,y}
      clearEventFunctions()
      this.mouseWasDragged = false
      const mousePressInfo = eventFunction.mousePress(mousePressPoint)
      this.mouseDidPress(mousePressPoint)
      this.mouseIsPressed = true
      return mousePressInfo
    }
    this.mouseDidPress = NULL_EVENT_CALLBACK
    //**------------------------------------------------------ */
    this.sendMouseDrag = (mouseDragPoint) => {
      const {x,y} = mouseDragPoint
      mouseDragPoint = {x,y}
      if (this.mouseWasDragged === false) {
        eventFunction.mouseDragBegin(mouseDragPoint)
        this.mouseWasDragged = true
      }

      if(!this.mouseIsPressed) eventFunction.mouseHover(mouseDragPoint)

      eventFunction.mouseDragContinue(mouseDragPoint)
      this.mouseDidDrag(mouseDragPoint)
    }
    this.mouseDidDrag = NULL_EVENT_CALLBACK
    //**------------------------------------------------------ */
    this.sendMouseRelease = (mouseReleasePoint) => {
      if(mouseReleasePoint){
        const {x,y} = mouseReleasePoint
        mouseReleasePoint = {x,y}
      }

      if (this.mouseWasDragged) {
        eventFunction.mouseReleaseAfterDrag(mouseReleasePoint)
      } else {
        eventFunction.mouseReleaseWithoutDrag(mouseReleasePoint)
      }
      eventFunction.mouseRelease(mouseReleasePoint)
      this.mouseDidRelease(mouseReleasePoint)
      clearEventFunctions()
      this.mouseIsPressed = false
    }
    this.mouseDidRelease = NULL_EVENT_CALLBACK
    //**-------------------------------------------------*/
    this.userMousePressInfo
    this.lastEventKey = null
    //**--------------------OPTIONAL --------------------*/
    this.mousePressSetup = () => {
      /**
      ANY PROCEDURAL CODE PROVIDED HERE 
      WILL RUN IMEADIATELY UPON MOUSE PRESS
      */
    }
    //**--------------------OPTIONAL --------------------*/
    this.userInitializer = {
      /** EXAMPLE
      evaluateRequirements : ()=>{},  //   PURE FUNCTION
      execute  : ()=>{},              //   STATE CHANGE FUNCTION
      */
      evaluateRequirements: () => {
        return false
      }, //   PURE FUNCTION
      execute: () => {}, //   STATE CHANGE FUNCTION
    }
    //**--------------------BELOW MUST BE DEFINED IN SUBCLASS --------------------*/
    this.mousePressEventStack = {
      /** EXAMPLE
      mouseClickedOnSomething :{        //   EVENT KEY: NAME IT SOMETHING DESCRIBING THE USER MOUSE PRESS
          evaluate : ()=>{},          //   PURE FUNCTION
          execute  : ()=>{},          //   STATE CHANGE FUNCTION
      },
      */
    }

    this.setMousePressEventToFirst = (eventKey)=>{ 
      const keyList = this.mousePressEventStackOrder.filter(key => key !== eventKey )
      keyList.unshift(eventKey)
      // console.log(keyList)
      // return
      this.mousePressEventStackOrder = keyList //.unshift(eventKey)
      // console.log(this.mousePressEventStackOrder)
    }


  }//** END CONSTRUCTOR */

  get className() {
    return this.constructor.name
  }
  get mousePressEventStackOrder() {
    return Object.keys(this.mousePressEventStack)
  }

  set mousePressEventStackOrder (setToThisOrder){
      this.mousePressEventStack = getReOrderedObject(this.mousePressEventStack,setToThisOrder)
  }


}



//git remote add origin https://github.com/clauinger/PenConstruct.git

// this.defineEventFunctions({
//   mouseDragBegin: (mouseDragPoint) => {
      //* YOUR EVENT CODE
//   },
//   mouseDragContinue: (mouseDragPoint) => {
      //* YOUR EVENT CODE
//   },
//   mouseRelease: (mouseReleasePoint) => {
      //* YOUR EVENT CODE
//   },
// })