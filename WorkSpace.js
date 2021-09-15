/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */


import {
  LineShapePen
} from './LineShapePen.js'
import {
  ArcLineShapePen
} from './ArcLineShapePen.js'
import {
  LineSeriesPen
} from './LineSeriesPen.js'
import {
  CircleSeriesPen
} from './CircleSeriesPen.js'
import {
  BezierShapePen
} from './BezierShapePen.js'
import {
  ArcShapePen
} from './ArcShapePen.js'

import {
  UniversalShapePen
} from './UniversalShapePen.js'
import {
  MultiShapePen_01
} from './MultiShapePen_01.js'
import {
  CompositeShapePen
} from './CompositeShapePen.js'
import {
  BoxCutShapePen
} from './BoxCutShapePen.js'

import {
  LineArrayPen
} from './LineArrayPen.js'

import {
  PenConstruct
} from './PenConstruct.js'
import { Public } from './Public.js';

const {
  log
} = console


function detectLeftButton(evt) {
  evt = evt || window.event;
  if ("buttons" in evt) {
    return evt.buttons == 1;
  }
  const button = evt.which || evt.button;
  return button == 1;
}


export const JSDraw = (parentContainerId, canvasWidth = 600, canvasHeight = 600) => {
  const NULL_OBJECT = {
    draw: () => {},
    drawLoop: () => {},
    context: null,
    isNULL_OBJECT: true,
    sendMousePress: () => {},
    sendMouseDrag: () => {},
    sendMouseRelease: () => {}
  }
  let currentPen = NULL_OBJECT
  let _context

  // let arrayPen

  const createPenSet = () => {
    const loadedPen = {}
    return {
      get lineShapePen() {
        if (!loadedPen.lineShapePen) loadedPen.lineShapePen = new LineShapePen(_context)
        return loadedPen.lineShapePen
      },
      get lineSeriesPen() {
        if (!loadedPen.lineSeriesPen) loadedPen.lineSeriesPen = new LineSeriesPen(_context)
        loadedPen.lineSeriesPen.constructAsSeries = true
        return loadedPen.lineSeriesPen
      },
      get lineCollectionPen() {
        if (!loadedPen.lineCollectionPen) loadedPen.lineCollectionPen = new LineShapePen(_context)
        return loadedPen.lineCollectionPen
      },
      get circleSeriesPen() {
        if (!loadedPen.circleSeriesPen) loadedPen.circleSeriesPen = new CircleSeriesPen(_context)
        return loadedPen.circleSeriesPen
      },
      get arcLineShapePen() {
        if (!loadedPen.arcLineShapePen) loadedPen.arcLineShapePen = new ArcLineShapePen(_context)
        return loadedPen.arcLineShapePen
      },
      get bezierShapePen() {
        if (!loadedPen.bezierShapePen) loadedPen.bezierShapePen = new BezierShapePen(_context)
        return loadedPen.bezierShapePen
      },
      get arcShapePen() {
        if (!loadedPen.arcShapePen) loadedPen.arcShapePen = new ArcShapePen(_context)
        return loadedPen.arcShapePen
      },
      get compositePen() {
        if (!loadedPen.compositePen) loadedPen.compositePen = new CompositeShapePen(_context)
        return loadedPen.compositePen
      },
      get universalShapePen() {
        if (!loadedPen.universalShapePen) loadedPen.universalShapePen = new UniversalShapePen(_context)
        return loadedPen.universalShapePen
      },
      get multiShapePen_01() {
        if (!loadedPen.multiShapePen_01) loadedPen.multiShapePen_01 = new MultiShapePen_01(_context)
        return loadedPen.multiShapePen_01
      },
      get multiShapePen_01() {
        if (!loadedPen.multiShapePen_01) loadedPen.multiShapePen_01 = new MultiShapePen_01(_context)
        return loadedPen.multiShapePen_01
      },
      get shapeCutLinePen() {
        if (!loadedPen.shapeCutLinePen) { 
          //TODO REFACTORING NEEDED. BOX CUT NEEDS TO HAVE WAY TO PASS A SHAPE PEN
          const boxCutShapePen = new BoxCutShapePen(_context)
          const arrayPen = new LineArrayPen(_context , boxCutShapePen)//, {x:22,y:4}, {x:5,y:4})
          arrayPen.pointCountDidChange = ()=>{
            if(boxCutShapeArray.length < arrayPen.arrayCount){
              for (let i = boxCutShapeArray.length; i < arrayPen.arrayCount  ; i++) {
                const boxCutShape = new BoxCutShapePen(_context, null, null, arrayPen.arrayLines[i] )
                boxCutShapeArray.push(boxCutShape)
              }
            }
            //TODO REFACTORING NEEDED. BELOW IS PART OF A MESS IN CODE
            boxCutShapeArray.forEach(boxCut =>{if(boxCut.shapePen)boxCut.shapePen.hideShapeTypeGrip = true})


          }

          let boxCutShapeArray = []
          
          const penStack = new PenConstruct()
          loadedPen.shapeCutLinePen = penStack
          // const beginPoint = new PointObservable({x:300,y:90})
          // const endPoint = new PointObservable({x:580,y:400})

          // const beginPoint = {x:200,y:50}
          // const endPoint = {x:550,y:400}

          // testLine.conformToLineReference()

          penStack.drawLoop = ()=>{
            boxCutShapePen.drawLoop()
            arrayPen.drawLoop()
            boxCutShapeArray.forEach((boxCutShape, i) => {
              if(i < arrayPen.arrayCount )boxCutShape.drawLoop()
            })

          }
          penStack.mousePressEventStack = {
            mousePressOnLineArrayPen : {
              evaluate : (mousePressPoint, _arrayPen = arrayPen)=>{
                const result = _arrayPen.sendMousePress(mousePressPoint)
                if (result) return {arrayPen : _arrayPen , mousePressPoint}
              },
              execute : (info)=>{ 
                const {arrayPen , mousePressPoint} = info
                penStack.defineEventFunctions({
                  mouseDragContinue: (mouseDragPoint) => { 
                    arrayPen.sendMouseDrag(mouseDragPoint)// sendMouseDrag
                  },
                  mouseRelease: (mouseReleasePoint) => {
                    arrayPen.sendMouseRelease(mouseReleasePoint)
                  }
                })
              }
            },
            mousePressOnBoxCutShape : {
              evaluate : (mousePressPoint, pen = boxCutShapePen)=>{
                return pen.sendMousePress(mousePressPoint)
              },
              execute : ()=>{
                loadedPen.shapeCutLinePen.defineEventFunctions({
                  mouseDragContinue: (mouseDragPoint) => {
                    boxCutShapePen.sendMouseDrag(mouseDragPoint)
                  },
                  mouseRelease: (mouseReleasePoint) => {
                    boxCutShapePen.sendMouseRelease(mouseReleasePoint)
                  }
                })
              }
            },
            
          }
        }
        return loadedPen.shapeCutLinePen
      },
    }
  }
  const penSet = createPenSet()
  const grayScale = 200
  let _backgroundColor = `rgb(${grayScale},${grayScale},${grayScale})`

  const s = (context) => {
    _context = context
    context.setup = function () {
      const ctx = context.createCanvas(canvasWidth, canvasHeight);
      ctx.touchStarted((e) => {
        /** 
        NOTE: p5js touchStarted method does not update mouseX & mouseY for the context, for some reason. 
        Below is another way to get those values to create mousePoint
        */
        const box = e.target.getBoundingClientRect()
        const x = e.targetTouches[0].clientX - box.x
        const y = e.targetTouches[0].clientY - box.y
        const mousePoint = {
          x,
          y
        }
        currentPen.sendMousePress(mousePoint)
        return false
      })
      ctx.mousePressed(() => {
        // TODO IMPLIMENT RETURN SNAP FUNCTION LAYER HERE, IN FULL ISOLATION WITH PENS AND REACTIVE MODULES
        const mousePoint = {
          x: context.mouseX,
          y: context.mouseY
        }
        myConsole.innerHTML = `console: mousePressPoint: {x:${mousePoint.x}, y:${mousePoint.y}}`
        currentPen.sendMousePress(mousePoint)
      })
      ctx.touchMoved(() => {
        currentPen.sendMouseDrag({
          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.mouseMoved(() => {
        currentPen.sendMouseDrag({
          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.touchEnded(() => {
        currentPen.sendMouseRelease({
          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.mouseReleased(() => {
        currentPen.sendMouseRelease({
          x: context.mouseX,
          y: context.mouseY
        })
      })
    };

    context.draw = function () {
      context.background(_backgroundColor);
      if (currentPen) currentPen.drawLoop()
    };
  };
  let currentPenKey
  const session = new p5(s, parentContainerId);


  return {
    get JSONRecord() {
      let lastRecord = getRecord()
      if (lastRecord) lastRecord = JSON.stringify(lastRecord)
      return lastRecord || JSONRecord
    },
    playBackJSONRecord: (JSONString = JSONRecord) => {

      playBackRecord(JSON.parse(JSONString))
    },
    playBackRecord: (record) => {
      playBackRecord(record)
    },
    startRecording: () => {
      currentPen = recordUserPenAction(currentPen)
    },

    stopRecording: () => {
      record = currentPen.record
      currentPen = currentPen.pen
    },

    playRecording: () => {
      playBackRecord(getRecord())
    },

    get currentPen() {
      return currentPenKey
    },

    set currentPen(key) {
      currentPenKey = key
      if (penSet[key]) currentPen = penSet[key]
      currentPen.key = key
    },

    get backgroundColor() {
      return _backgroundColor
    },
    set backgroundColor(clr) {
      _backgroundColor = clr
    },
  }
}

const JSONRecord = '[{"penKey":"compositePen"},{"type":"release","time":105},{"type":"hover","mousePoint":{"x":48,"y":314.1333312988281},"time":106},{"type":"hover","mousePoint":{"x":50,"y":295.1333312988281},"time":139},{"type":"hover","mousePoint":{"x":52,"y":272.1333312988281},"time":172},{"type":"hover","mousePoint":{"x":53,"y":254.13333129882812},"time":205},{"type":"hover","mousePoint":{"x":52,"y":240.13333129882812},"time":238},{"type":"hover","mousePoint":{"x":52,"y":238.13333129882812},"time":272},{"type":"press","mousePoint":{"x":52,"y":237.13333129882812},"time":409},{"type":"drag","mousePoint":{"x":52,"y":237.13333129882812},"time":439},{"type":"drag","mousePoint":{"x":54,"y":232.13333129882812},"time":472},{"type":"drag","mousePoint":{"x":73,"y":188.13333129882812},"time":505},{"type":"drag","mousePoint":{"x":85,"y":149.13333129882812},"time":538},{"type":"drag","mousePoint":{"x":94,"y":124.13333129882812},"time":572},{"type":"drag","mousePoint":{"x":99,"y":114.13333129882812},"time":606},{"type":"drag","mousePoint":{"x":99,"y":113.13333129882812},"time":639},{"type":"drag","mousePoint":{"x":100,"y":112.13333129882812},"time":672},{"type":"drag","mousePoint":{"x":100,"y":111.13333129882812},"time":704},{"type":"drag","mousePoint":{"x":103,"y":108.13333129882812},"time":738},{"type":"drag","mousePoint":{"x":105,"y":105.13333129882812},"time":772},{"type":"release","mousePoint":{"x":105,"y":103.13333129882812},"time":855},{"type":"press","mousePoint":{"x":105,"y":103.13333129882812},"time":1243},{"type":"drag","mousePoint":{"x":105,"y":103.13333129882812},"time":1305},{"type":"drag","mousePoint":{"x":131,"y":132.13333129882812},"time":1338},{"type":"drag","mousePoint":{"x":169,"y":173.13333129882812},"time":1372},{"type":"drag","mousePoint":{"x":202,"y":207.13333129882812},"time":1405},{"type":"drag","mousePoint":{"x":227,"y":229.13333129882812},"time":1438},{"type":"drag","mousePoint":{"x":240,"y":240.13333129882812},"time":1471},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":1505},{"type":"release","mousePoint":{"x":241,"y":241.13333129882812},"time":1649},{"type":"press","mousePoint":{"x":241,"y":241.13333129882812},"time":2132},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2172},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2205},{"type":"drag","mousePoint":{"x":199,"y":241.13333129882812},"time":2238},{"type":"drag","mousePoint":{"x":156,"y":241.13333129882812},"time":2272},{"type":"release","mousePoint":{"x":154,"y":241.13333129882812},"time":2517},{"type":"hover","mousePoint":{"x":154,"y":241.13333129882812},"time":2705},{"type":"hover","mousePoint":{"x":167,"y":255.13333129882812},"time":2739},{"type":"hover","mousePoint":{"x":189,"y":287.1333312988281},"time":2772},{"type":"hover","mousePoint":{"x":191,"y":291.1333312988281},"time":2805},{"type":"hover","mousePoint":{"x":191,"y":292.1333312988281},"time":2838},{"type":"hover","mousePoint":{"x":190,"y":292.1333312988281},"time":2872},{"type":"hover","mousePoint":{"x":189,"y":293.1333312988281},"time":2905},{"type":"hover","mousePoint":{"x":187,"y":293.1333312988281},"time":2938},{"type":"hover","mousePoint":{"x":186,"y":293.1333312988281},"time":2971},{"type":"hover","mousePoint":{"x":185,"y":293.1333312988281},"time":3005},{"type":"hover","mousePoint":{"x":183,"y":293.1333312988281},"time":3038},{"type":"hover","mousePoint":{"x":182,"y":293.1333312988281},"time":3072},{"type":"hover","mousePoint":{"x":180,"y":293.1333312988281},"time":3105},{"type":"hover","mousePoint":{"x":177,"y":294.1333312988281},"time":3139}]'