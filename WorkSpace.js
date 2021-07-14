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
  State
} from './State.js';

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

export const JSDraw = (parentContainerId, canvasWidth = 300, canvasHeight = 300) => {
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
    }
  }
  const penSet = createPenSet()

  const grayScale = 100
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
        const mousePoint = {
          x: context.mouseX,
          y: context.mouseY
        }
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
  const session = new p5(s, parentContainerId)

  function recordUserPenAction(_pen = currentPen) {
    const _record = [{penKey :currentPenKey}]
    const _key = currentPenKey
    const startTime = Date.now()
    return {
      isRecordPen: true,
      sendMousePress: (mousePoint) => {
        _record.push({
          type: 'press',
          mousePoint,
          time: Date.now() - startTime,
        })
        _pen.sendMousePress(mousePoint)
      },
      sendMouseDrag: (mousePoint) => { 
        _record.push({
          type: _pen.mouseIsPressed ? 'drag' : 'hover',
          mousePoint,
          time: Date.now() - startTime,
        })
        _pen.sendMouseDrag(mousePoint)
      },
      sendMouseRelease: (mousePoint) => { //sendMouseRelase
        _record.push({
          type: 'release',
          mousePoint,
          time: Date.now() - startTime,
        })
        _pen.sendMouseRelease(mousePoint)
      },
      getRecord: () => {
        return _record
      },
      getPen: () => {
        return _pen
      },
      get record() {
        return _record
      },
      get pen() {
        return _pen
      },
      get penKey(){ 
        return _key
      },
      drawLoop: () => {
        State.drawPointMark(_context, {
          x: 200,
          y: 123
        })
        _pen.drawLoop()
      }
    }
  }

  let record
  let playBackPen
  const getRecord = ()=>{return record}
  let isPlaying = false
  function playBackRecord(record , loopRepeat = true){ 
    if(isPlaying)return 
    isPlaying = true
    const penkey = record[0].penKey
    playBackPen = null
    playBackPen = createPenSet()[penkey]
    currentPen = {
      draw: () => {},
      drawLoop:  () => { 
        _context.clear()
        if (currentEvent) State.drawCross(
          _context,
          currentEvent.mousePoint || {
            x: 0,
            y: 0
          },
          currentEvent.type === 'hover' ? 1 : 2
        )
        if(playBackPen)playBackPen.drawLoop()
      },
      context: null,
      isNULL_OBJECT: true,
      sendMousePress: () => {},
      sendMouseDrag: () => {},
      sendMouseRelease: () => {}
    }
    let currentEvent = null
    record.forEach((event, i) => {
      setTimeout(() => {
        currentEvent = event
        if(event.type === 'press') {
          playBackPen.sendMousePress(event.mousePoint)
        } else  if(event.type === 'drag') {
          playBackPen.sendMouseDrag(event.mousePoint)
        } else  if(event.type === 'release') {
          playBackPen.sendMouseRelease(event.mousePoint)
        }
        if((i === record.length - 1) && loopRepeat) {
          isPlaying = false
          playBackRecord(record , loopRepeat)
        }
        // if((i === record.length - 1) && loopRepeat) log(record[0])
      }, event.time)
    })
    // let go = true
    // let i = 0
    // while (go) { 
    //   const event = record[i]
    //   setTimeout(() => {
    //     currentEvent = event
    //     if(event.type === 'press') {
    //       playBackPen.sendMousePress(event.mousePoint)
    //     } else  if(event.type === 'drag') {
    //       playBackPen.sendMouseDrag(event.mousePoint)
    //     } else  if(event.type === 'release') {
    //       playBackPen.sendMouseRelease(event.mousePoint)
    //     }
    //   }, event.time)


    //   i++
    //   const isAtEndOfEventLoop = i === (record.length - 1)
    //   if (isAtEndOfEventLoop && loopRepeat){ 
    //     i = 0
    //     go = false
    //   } else if(isAtEndOfEventLoop) go = false
    // }

  }

  //** BELOW IS TO DETECT IF MOUSE LEFT BUTTON IS RELEASED OUTSIDE OF CANVAS */
  document.getElementById(parentContainerId).addEventListener('mouseenter', (e) => {
    const leftBtn = detectLeftButton(e)
    if (!leftBtn) {
      currentPen.sendMouseRelease()
    }
  })

  return {
    get JSONRecord(){
      let lastRecord = getRecord()
      if(lastRecord)lastRecord = JSON.stringify(lastRecord)
      return lastRecord || JSONRecord
    },
    playBackJSONRecord : (JSONString = JSONRecord)=>{  

      playBackRecord(JSON.parse(JSONString))
    },
    playBackRecord : (record)=>{  
      playBackRecord(record)
    },
    startRecording : () => {
      currentPen = recordUserPenAction(currentPen)
    },

    stopRecording : () => {
      record = currentPen.record
      currentPen = currentPen.pen
    },

    playRecording : ()=>{
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

    get backgroundColor (){
      return _backgroundColor
    },
    set backgroundColor (clr){
      _backgroundColor = clr
    },
  }
}

const JSONRecord = '[{"penKey":"compositePen"},{"type":"release","time":105},{"type":"hover","mousePoint":{"x":48,"y":314.1333312988281},"time":106},{"type":"hover","mousePoint":{"x":50,"y":295.1333312988281},"time":139},{"type":"hover","mousePoint":{"x":52,"y":272.1333312988281},"time":172},{"type":"hover","mousePoint":{"x":53,"y":254.13333129882812},"time":205},{"type":"hover","mousePoint":{"x":52,"y":240.13333129882812},"time":238},{"type":"hover","mousePoint":{"x":52,"y":238.13333129882812},"time":272},{"type":"press","mousePoint":{"x":52,"y":237.13333129882812},"time":409},{"type":"drag","mousePoint":{"x":52,"y":237.13333129882812},"time":439},{"type":"drag","mousePoint":{"x":54,"y":232.13333129882812},"time":472},{"type":"drag","mousePoint":{"x":73,"y":188.13333129882812},"time":505},{"type":"drag","mousePoint":{"x":85,"y":149.13333129882812},"time":538},{"type":"drag","mousePoint":{"x":94,"y":124.13333129882812},"time":572},{"type":"drag","mousePoint":{"x":99,"y":114.13333129882812},"time":606},{"type":"drag","mousePoint":{"x":99,"y":113.13333129882812},"time":639},{"type":"drag","mousePoint":{"x":100,"y":112.13333129882812},"time":672},{"type":"drag","mousePoint":{"x":100,"y":111.13333129882812},"time":704},{"type":"drag","mousePoint":{"x":103,"y":108.13333129882812},"time":738},{"type":"drag","mousePoint":{"x":105,"y":105.13333129882812},"time":772},{"type":"release","mousePoint":{"x":105,"y":103.13333129882812},"time":855},{"type":"press","mousePoint":{"x":105,"y":103.13333129882812},"time":1243},{"type":"drag","mousePoint":{"x":105,"y":103.13333129882812},"time":1305},{"type":"drag","mousePoint":{"x":131,"y":132.13333129882812},"time":1338},{"type":"drag","mousePoint":{"x":169,"y":173.13333129882812},"time":1372},{"type":"drag","mousePoint":{"x":202,"y":207.13333129882812},"time":1405},{"type":"drag","mousePoint":{"x":227,"y":229.13333129882812},"time":1438},{"type":"drag","mousePoint":{"x":240,"y":240.13333129882812},"time":1471},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":1505},{"type":"release","mousePoint":{"x":241,"y":241.13333129882812},"time":1649},{"type":"press","mousePoint":{"x":241,"y":241.13333129882812},"time":2132},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2172},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2205},{"type":"drag","mousePoint":{"x":199,"y":241.13333129882812},"time":2238},{"type":"drag","mousePoint":{"x":156,"y":241.13333129882812},"time":2272},{"type":"release","mousePoint":{"x":154,"y":241.13333129882812},"time":2517},{"type":"hover","mousePoint":{"x":154,"y":241.13333129882812},"time":2705},{"type":"hover","mousePoint":{"x":167,"y":255.13333129882812},"time":2739},{"type":"hover","mousePoint":{"x":189,"y":287.1333312988281},"time":2772},{"type":"hover","mousePoint":{"x":191,"y":291.1333312988281},"time":2805},{"type":"hover","mousePoint":{"x":191,"y":292.1333312988281},"time":2838},{"type":"hover","mousePoint":{"x":190,"y":292.1333312988281},"time":2872},{"type":"hover","mousePoint":{"x":189,"y":293.1333312988281},"time":2905},{"type":"hover","mousePoint":{"x":187,"y":293.1333312988281},"time":2938},{"type":"hover","mousePoint":{"x":186,"y":293.1333312988281},"time":2971},{"type":"hover","mousePoint":{"x":185,"y":293.1333312988281},"time":3005},{"type":"hover","mousePoint":{"x":183,"y":293.1333312988281},"time":3038},{"type":"hover","mousePoint":{"x":182,"y":293.1333312988281},"time":3072},{"type":"hover","mousePoint":{"x":180,"y":293.1333312988281},"time":3105},{"type":"hover","mousePoint":{"x":177,"y":294.1333312988281},"time":3139}]'