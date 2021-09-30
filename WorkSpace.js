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
  RectCutShapePen
} from './RectCutShapePen.js'
import {
  RectCutArrayPen
} from './RectCutArrayPen.js'

import {
  LineArrayPen
} from './LineArrayPen.js'

import {
  PenConstruct
} from './PenConstruct.js'
import { Public } from './Public.js';

import {
  DrawMark
  
} from './DrawMarks.js'

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


export const JSDraw = (parentContainerId, canvasWidth = 400, canvasHeight = 400) => {
  const NULL_OBJECT = {
    draw: () => {},
    drawLoop: () => {},
    context: null,
    isNULL_OBJECT: true,
    sendMousePress: () => {},
    sendMouseDrag: () => {},
    sendMouseRelease: () => {}
  }
  let _currentPen = NULL_OBJECT
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

      get rectCutShapePen() { 
        if (!loadedPen.rectCutShapePen) loadedPen.rectCutShapePen = new RectCutShapePen(_context, null,{x:20,y:20, width:300,height:200})
        return loadedPen.rectCutShapePen
      },


      get rectCutArrayPen(){
        if (!loadedPen.rectCutArrayPen) loadedPen.rectCutArrayPen = new RectCutArrayPen(_context,{x:20,y:20, width:260,height:260})
        loadedPen.rectCutArrayPen.didInit = ()=>{
          // loadedPen.rectCutArrayPen.beginPoint.xy = {x:14,y:90}
          // loadedPen.rectCutArrayPen.endPoint.xy = {x:334,y:390}
          // loadedPen.rectCutArrayPen.conformToLineReference()
          // loadedPen.rectCutArrayPen.arrayGripPoint.xy = {x:150,y:60}
        }
        return loadedPen.rectCutArrayPen
      }
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
        const rect = e.target.getBoundingClientRect()
        const x = e.targetTouches[0].clientX - rect.x
        const y = e.targetTouches[0].clientY - rect.y
        const mousePoint = {
          x,
          y
        }
        _currentPen.sendMousePress(mousePoint)
        return false
      })
      ctx.mousePressed(() => {
        // TODO IMPLIMENT RETURN SNAP FUNCTION LAYER HERE, IN FULL ISOLATION WITH PENS AND REACTIVE MODULES
        const mousePoint = {
          x: context.mouseX,
          y: context.mouseY
        }
        myConsole.innerHTML = `console: mousePressPoint: {x:${mousePoint.x}, y:${mousePoint.y}}`
        _currentPen.sendMousePress(mousePoint)
        return false
      })
      ctx.mousePressed(() => {
        const mousePoint = {
          x: context.mouseX,
          y: context.mouseY
        }
        _currentPen.sendMousePress(mousePoint)
      })
      ctx.touchMoved(() => {
        _currentPen.sendMouseDrag({
          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.mouseMoved(() => {
        _currentPen.sendMouseDrag({
          x: context.mouseX,
          y: context.mouseY
        })
      })

      ctx.touchEnded(() => {
        _currentPen.sendMouseRelease({

          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.mouseMoved(() => {
        _currentPen.sendMouseDrag({
          x: context.mouseX,
          y: context.mouseY
        })
      })
      ctx.touchEnded(() => {
        _currentPen.sendMouseRelease({
          x: context.mouseX,
          y: context.mouseY
        })
      })

      ctx.mouseReleased(() => {
        _currentPen.sendMouseRelease({
          x: context.mouseX,
          y: context.mouseY
        })
      })
    };

    context.draw = function () {
      context.background(_backgroundColor);
      if (_currentPen) _currentPen.drawLoop()
    };
  };
  let _currentPenKey

  new p5(s, parentContainerId)

  //TODO: BREAK OFF BELOW FUCNTIONS INTO SEPARATE FILE
  function recordUserPenAction(_pen = _currentPen) {
    const _record = [{penKey :_currentPenKey}]
    const _key = _currentPenKey
    const startTime = Date.now()
    return {
      isRecordPen: true,
      getClosedShapeCollection: ()=>{ 
        if(_pen.getClosedShapeCollection) return _pen.getClosedShapeCollection()
      },
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
        DrawMark.pointMark(_context, {
          x: 200,
          y: 123
        })
        _pen.drawLoop()
      }
    }
  }

  let record
  let playBackPen
  const getRecord = ()=>{return record || JSON.parse( outputText.value)}
  let isPlaying = false
  let playBackToStop = false
  let timedFunction = []
  function playBackRecord(_record , loopRepeat = true){ 
    record = _record
    if(isPlaying)return 
    if(playBackToStop)return
    isPlaying = true
    const penkey = _record[0].penKey
    playBackPen = null
    playBackPen = createPenSet()[penkey]
    _currentPen = {
      draw: () => {},
      drawLoop:  () => { 
        _context.clear()
        if (currentEvent) DrawMark.tickCrossMark(
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
      sendMouseRelease: () => {},
      getClosedShapeCollection: ()=>{ 
        if(playBackPen.getClosedShapeCollection) return playBackPen.getClosedShapeCollection()
      },
      id:'playback pen'
    }

    let currentEvent = null

    _record.forEach((event, i) => {
      const func  = () => {
        if(playBackToStop)return
        currentEvent = event
        if(event.type === 'press') {
          playBackPen.sendMousePress(event.mousePoint)
        } else  if(event.type === 'drag') {
          playBackPen.sendMouseDrag(event.mousePoint)
        } else  if(event.type === 'release') {
          playBackPen.sendMouseRelease(event.mousePoint)
        }
        if((i === _record.length - 1) && loopRepeat) {
          isPlaying = false
          playBackRecord(_record , loopRepeat)
        }
      }
      // setTimeout(() => {
      //   if(playBackToStop)return
      //   currentEvent = event
      //   if(event.type === 'press') {
      //     playBackPen.sendMousePress(event.mousePoint)
      //   } else  if(event.type === 'drag') {
      //     playBackPen.sendMouseDrag(event.mousePoint)
      //   } else  if(event.type === 'release') {
      //     playBackPen.sendMouseRelease(event.mousePoint)
      //   }
      //   if((i === _record.length - 1) && loopRepeat) {
      //     isPlaying = false
      //     playBackRecord(_record , loopRepeat)
      //   }
      // }, event.time)
  
      // timedFunction = setTimeout(func,event.time)
      timedFunction.push(setTimeout(func,event.time))

      // log(timedFunction)
    })
  }
  //* CLOSE PLAY BACK RECORD

  function stopPlayBack(){
    if(isPlaying){
      playBackToStop = true
      isPlaying = false
      _currentPen = playBackPen
      // clearTimeout(timedFunction)
      timedFunction.forEach(id =>clearTimeout(id))
      timedFunction = []
      return
    }
    playBackToStop = false
  }

  function togglePlayBack (_record = record){
    if(isPlaying){
      stopPlayBack()
      return false
    }
    playBackToStop = false
    playBackRecord(_record)
    return true
  }

  //** BELOW IS TO DETECT IF MOUSE LEFT BUTTON IS RELEASED OUTSIDE OF CANVAS */
  //TODO: REVIEW IF ALL DOM REFERENCES CAN AND SHOULD BE REMOVED FROM THIS FILE. THIS IS THE ONLY ONE
  document.getElementById(parentContainerId).addEventListener('mouseenter', (e) => {
    const leftBtn = detectLeftButton(e)
    if (!leftBtn) {
      _currentPen.sendMouseRelease()
    }
  })

  return {
    get JSONRecord(){
      let lastRecord = getRecord()
      if(lastRecord)lastRecord = JSON.stringify(lastRecord)
      return lastRecord || JSONRecord
    },
    getJSONRecord : (atIndex)=>{
      return JSONRecords[atIndex]
    },
    // playBackJSONRecord : (JSONString = JSONRecord)=>{  
    //   playBackRecord(JSON.parse(JSONString))
    // },
    playBackRecord : (record)=>{  
      playBackRecord(record)
    },

    startRecording : () => {
      _currentPen = recordUserPenAction(_currentPen)
    },

    stopRecording : () => { 
      record = _currentPen.record
      outputText.value = JSON.stringify(record)
      _currentPen = _currentPen.pen
    },

    playRecording: () => {
      playBackRecord(getRecord())
    },
    stopPlayBack,
    togglePlayBack,

    get currentPenKey() {
      return _currentPenKey
    },

    set currentPenKey(key) {
      _currentPenKey = key
      if (penSet[key]) _currentPen = penSet[key]
      _currentPen.key = key
    },

    get backgroundColor() {
      return _backgroundColor
    },
    set backgroundColor(clr) {
      _backgroundColor = clr
    },

    get currentPen(){
      return _currentPen
    }
  }
}

const JSONRecord = '[{"penKey":"compositePen"},{"type":"release","time":105},{"type":"hover","mousePoint":{"x":48,"y":314.1333312988281},"time":106},{"type":"hover","mousePoint":{"x":50,"y":295.1333312988281},"time":139},{"type":"hover","mousePoint":{"x":52,"y":272.1333312988281},"time":172},{"type":"hover","mousePoint":{"x":53,"y":254.13333129882812},"time":205},{"type":"hover","mousePoint":{"x":52,"y":240.13333129882812},"time":238},{"type":"hover","mousePoint":{"x":52,"y":238.13333129882812},"time":272},{"type":"press","mousePoint":{"x":52,"y":237.13333129882812},"time":409},{"type":"drag","mousePoint":{"x":52,"y":237.13333129882812},"time":439},{"type":"drag","mousePoint":{"x":54,"y":232.13333129882812},"time":472},{"type":"drag","mousePoint":{"x":73,"y":188.13333129882812},"time":505},{"type":"drag","mousePoint":{"x":85,"y":149.13333129882812},"time":538},{"type":"drag","mousePoint":{"x":94,"y":124.13333129882812},"time":572},{"type":"drag","mousePoint":{"x":99,"y":114.13333129882812},"time":606},{"type":"drag","mousePoint":{"x":99,"y":113.13333129882812},"time":639},{"type":"drag","mousePoint":{"x":100,"y":112.13333129882812},"time":672},{"type":"drag","mousePoint":{"x":100,"y":111.13333129882812},"time":704},{"type":"drag","mousePoint":{"x":103,"y":108.13333129882812},"time":738},{"type":"drag","mousePoint":{"x":105,"y":105.13333129882812},"time":772},{"type":"release","mousePoint":{"x":105,"y":103.13333129882812},"time":855},{"type":"press","mousePoint":{"x":105,"y":103.13333129882812},"time":1243},{"type":"drag","mousePoint":{"x":105,"y":103.13333129882812},"time":1305},{"type":"drag","mousePoint":{"x":131,"y":132.13333129882812},"time":1338},{"type":"drag","mousePoint":{"x":169,"y":173.13333129882812},"time":1372},{"type":"drag","mousePoint":{"x":202,"y":207.13333129882812},"time":1405},{"type":"drag","mousePoint":{"x":227,"y":229.13333129882812},"time":1438},{"type":"drag","mousePoint":{"x":240,"y":240.13333129882812},"time":1471},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":1505},{"type":"release","mousePoint":{"x":241,"y":241.13333129882812},"time":1649},{"type":"press","mousePoint":{"x":241,"y":241.13333129882812},"time":2132},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2172},{"type":"drag","mousePoint":{"x":241,"y":241.13333129882812},"time":2205},{"type":"drag","mousePoint":{"x":199,"y":241.13333129882812},"time":2238},{"type":"drag","mousePoint":{"x":156,"y":241.13333129882812},"time":2272},{"type":"release","mousePoint":{"x":154,"y":241.13333129882812},"time":2517},{"type":"hover","mousePoint":{"x":154,"y":241.13333129882812},"time":2705},{"type":"hover","mousePoint":{"x":167,"y":255.13333129882812},"time":2739},{"type":"hover","mousePoint":{"x":189,"y":287.1333312988281},"time":2772},{"type":"hover","mousePoint":{"x":191,"y":291.1333312988281},"time":2805},{"type":"hover","mousePoint":{"x":191,"y":292.1333312988281},"time":2838},{"type":"hover","mousePoint":{"x":190,"y":292.1333312988281},"time":2872},{"type":"hover","mousePoint":{"x":189,"y":293.1333312988281},"time":2905},{"type":"hover","mousePoint":{"x":187,"y":293.1333312988281},"time":2938},{"type":"hover","mousePoint":{"x":186,"y":293.1333312988281},"time":2971},{"type":"hover","mousePoint":{"x":185,"y":293.1333312988281},"time":3005},{"type":"hover","mousePoint":{"x":183,"y":293.1333312988281},"time":3038},{"type":"hover","mousePoint":{"x":182,"y":293.1333312988281},"time":3072},{"type":"hover","mousePoint":{"x":180,"y":293.1333312988281},"time":3105},{"type":"hover","mousePoint":{"x":177,"y":294.1333312988281},"time":3139}]'
const JSONRecords = [
  '[{"penKey":"rectCutArrayPen"},{"type":"release","time":342},{"type":"hover","mousePoint":{"x":84,"y":406.6333312988281},"time":343},{"type":"hover","mousePoint":{"x":80,"y":379.6333312988281},"time":375},{"type":"hover","mousePoint":{"x":68,"y":342.6333312988281},"time":409},{"type":"hover","mousePoint":{"x":51,"y":297.6333312988281},"time":442},{"type":"hover","mousePoint":{"x":42,"y":259.6333312988281},"time":476},{"type":"hover","mousePoint":{"x":41,"y":206.63333129882812},"time":509},{"type":"hover","mousePoint":{"x":40,"y":192.63333129882812},"time":542},{"type":"hover","mousePoint":{"x":41,"y":190.63333129882812},"time":575},{"type":"hover","mousePoint":{"x":41,"y":186.63333129882812},"time":609},{"type":"hover","mousePoint":{"x":41,"y":185.63333129882812},"time":810},{"type":"hover","mousePoint":{"x":40,"y":182.63333129882812},"time":842},{"type":"hover","mousePoint":{"x":32,"y":171.63333129882812},"time":875},{"type":"hover","mousePoint":{"x":19,"y":155.63333129882812},"time":908},{"type":"hover","mousePoint":{"x":14,"y":150.63333129882812},"time":943},{"type":"hover","mousePoint":{"x":13,"y":149.63333129882812},"time":975},{"type":"hover","mousePoint":{"x":13,"y":148.63333129882812},"time":1009},{"type":"hover","mousePoint":{"x":13,"y":148.63333129882812},"time":1041},{"type":"hover","mousePoint":{"x":13,"y":147.63333129882812},"time":1143},{"type":"hover","mousePoint":{"x":12,"y":147.63333129882812},"time":1310},{"type":"hover","mousePoint":{"x":13,"y":147.63333129882812},"time":1343},{"type":"hover","mousePoint":{"x":14,"y":148.63333129882812},"time":1375},{"type":"hover","mousePoint":{"x":15,"y":148.63333129882812},"time":1410},{"type":"hover","mousePoint":{"x":16,"y":149.63333129882812},"time":1442},{"type":"hover","mousePoint":{"x":17,"y":149.63333129882812},"time":1476},{"type":"hover","mousePoint":{"x":17,"y":149.63333129882812},"time":1508},{"type":"hover","mousePoint":{"x":18,"y":150.63333129882812},"time":1543},{"type":"hover","mousePoint":{"x":18,"y":150.63333129882812},"time":1575},{"type":"hover","mousePoint":{"x":19,"y":150.63333129882812},"time":1609},{"type":"hover","mousePoint":{"x":20,"y":151.63333129882812},"time":1676},{"type":"hover","mousePoint":{"x":20,"y":151.63333129882812},"time":1683},{"type":"press","mousePoint":{"x":20,"y":151.63333129882812},"time":1683},{"type":"drag","mousePoint":{"x":20,"y":151.63333129882812},"time":1709},{"type":"drag","mousePoint":{"x":20,"y":151.63333129882812},"time":1742},{"type":"drag","mousePoint":{"x":25,"y":148.63333129882812},"time":1776},{"type":"drag","mousePoint":{"x":58,"y":112.63333129882812},"time":1809},{"type":"drag","mousePoint":{"x":85,"y":84.63333129882812},"time":1842},{"type":"drag","mousePoint":{"x":109,"y":61.633331298828125},"time":1876},{"type":"drag","mousePoint":{"x":117,"y":53.633331298828125},"time":1909},{"type":"drag","mousePoint":{"x":122,"y":46.633331298828125},"time":1942},{"type":"drag","mousePoint":{"x":122,"y":46.633331298828125},"time":1975},{"type":"drag","mousePoint":{"x":123,"y":45.633331298828125},"time":2209},{"type":"drag","mousePoint":{"x":121,"y":49.633331298828125},"time":2243},{"type":"drag","mousePoint":{"x":120,"y":51.633331298828125},"time":2275},{"type":"drag","mousePoint":{"x":120,"y":53.633331298828125},"time":2309},{"type":"release","mousePoint":{"x":120,"y":53.633331298828125},"time":2519},{"type":"hover","mousePoint":{"x":120,"y":53.633331298828125},"time":2642},{"type":"hover","mousePoint":{"x":141,"y":78.63333129882812},"time":2676},{"type":"hover","mousePoint":{"x":171,"y":113.63333129882812},"time":2710},{"type":"hover","mousePoint":{"x":171,"y":115.63333129882812},"time":2909},{"type":"hover","mousePoint":{"x":171,"y":115.63333129882812},"time":3010},{"type":"hover","mousePoint":{"x":169,"y":116.63333129882812},"time":3043},{"type":"hover","mousePoint":{"x":167,"y":117.63333129882812},"time":3076},{"type":"hover","mousePoint":{"x":165,"y":117.63333129882812},"time":3109},{"type":"hover","mousePoint":{"x":164,"y":117.63333129882812},"time":3142},{"type":"hover","mousePoint":{"x":164,"y":118.63333129882812},"time":3210},{"type":"hover","mousePoint":{"x":163,"y":118.63333129882812},"time":3241},{"type":"hover","mousePoint":{"x":162,"y":119.63333129882812},"time":3275},{"type":"hover","mousePoint":{"x":161,"y":120.63333129882812},"time":3309},{"type":"hover","mousePoint":{"x":158,"y":121.63333129882812},"time":3343},{"type":"hover","mousePoint":{"x":156,"y":122.63333129882812},"time":3376},{"type":"hover","mousePoint":{"x":153,"y":123.63333129882812},"time":3410},{"type":"hover","mousePoint":{"x":153,"y":123.63333129882812},"time":3609},{"type":"hover","mousePoint":{"x":153,"y":122.63333129882812},"time":3642},{"type":"hover","mousePoint":{"x":153,"y":122.63333129882812},"time":3676},{"type":"hover","mousePoint":{"x":154,"y":122.63333129882812},"time":3685},{"type":"press","mousePoint":{"x":154,"y":122.63333129882812},"time":3685},{"type":"drag","mousePoint":{"x":154,"y":122.63333129882812},"time":3709},{"type":"drag","mousePoint":{"x":155,"y":122.63333129882812},"time":3742},{"type":"drag","mousePoint":{"x":156,"y":122.63333129882812},"time":3776},{"type":"drag","mousePoint":{"x":161,"y":121.63333129882812},"time":3810},{"type":"drag","mousePoint":{"x":176,"y":118.63333129882812},"time":3843},{"type":"drag","mousePoint":{"x":205,"y":113.63333129882812},"time":3876},{"type":"drag","mousePoint":{"x":251,"y":109.63333129882812},"time":3910},{"type":"drag","mousePoint":{"x":279,"y":108.63333129882812},"time":3942},{"type":"drag","mousePoint":{"x":285,"y":108.63333129882812},"time":3976},{"type":"release","mousePoint":{"x":285,"y":108.63333129882812},"time":4417},{"type":"hover","mousePoint":{"x":285,"y":108.63333129882812},"time":4475},{"type":"hover","mousePoint":{"x":285,"y":108.63333129882812},"time":4510},{"type":"hover","mousePoint":{"x":278,"y":111.63333129882812},"time":4543},{"type":"hover","mousePoint":{"x":274,"y":115.63333129882812},"time":4576},{"type":"hover","mousePoint":{"x":265,"y":124.63333129882812},"time":4609},{"type":"hover","mousePoint":{"x":228,"y":156.63333129882812},"time":4641},{"type":"hover","mousePoint":{"x":211,"y":175.63333129882812},"time":4676},{"type":"hover","mousePoint":{"x":210,"y":177.63333129882812},"time":4709},{"type":"hover","mousePoint":{"x":210,"y":178.63333129882812},"time":4743},{"type":"hover","mousePoint":{"x":210,"y":178.63333129882812},"time":4809},{"type":"hover","mousePoint":{"x":210,"y":178.63333129882812},"time":4842},{"type":"hover","mousePoint":{"x":209,"y":181.63333129882812},"time":4876},{"type":"hover","mousePoint":{"x":196,"y":196.63333129882812},"time":4909},{"type":"hover","mousePoint":{"x":186,"y":207.63333129882812},"time":4943},{"type":"hover","mousePoint":{"x":185,"y":208.63333129882812},"time":4976},{"type":"hover","mousePoint":{"x":185,"y":208.63333129882812},"time":5076},{"type":"hover","mousePoint":{"x":185,"y":209.63333129882812},"time":5110},{"type":"hover","mousePoint":{"x":184,"y":209.63333129882812},"time":5143},{"type":"hover","mousePoint":{"x":184,"y":209.63333129882812},"time":5176},{"type":"hover","mousePoint":{"x":184,"y":210.63333129882812},"time":5210},{"type":"hover","mousePoint":{"x":184,"y":210.63333129882812},"time":5243},{"type":"hover","mousePoint":{"x":184,"y":210.63333129882812},"time":5276},{"type":"hover","mousePoint":{"x":183,"y":210.63333129882812},"time":5309},{"type":"hover","mousePoint":{"x":183,"y":211.63333129882812},"time":5343},{"type":"hover","mousePoint":{"x":182,"y":211.63333129882812},"time":5376},{"type":"hover","mousePoint":{"x":181,"y":212.63333129882812},"time":5409},{"type":"press","mousePoint":{"x":181,"y":212.63333129882812},"time":5605},{"type":"drag","mousePoint":{"x":181,"y":212.63333129882812},"time":5676},{"type":"drag","mousePoint":{"x":181,"y":213.63333129882812},"time":5710},{"type":"drag","mousePoint":{"x":179,"y":215.63333129882812},"time":5742},{"type":"drag","mousePoint":{"x":177,"y":218.63333129882812},"time":5776},{"type":"drag","mousePoint":{"x":167,"y":226.63333129882812},"time":5808},{"type":"drag","mousePoint":{"x":152,"y":234.63333129882812},"time":5843},{"type":"drag","mousePoint":{"x":147,"y":237.63333129882812},"time":5876},{"type":"drag","mousePoint":{"x":145,"y":238.63333129882812},"time":5910},{"type":"drag","mousePoint":{"x":144,"y":239.63333129882812},"time":5943},{"type":"drag","mousePoint":{"x":143,"y":239.63333129882812},"time":5975},{"type":"drag","mousePoint":{"x":142,"y":240.63333129882812},"time":6010},{"type":"drag","mousePoint":{"x":140,"y":240.63333129882812},"time":6042},{"type":"drag","mousePoint":{"x":138,"y":241.63333129882812},"time":6076},{"type":"drag","mousePoint":{"x":136,"y":243.63333129882812},"time":6109},{"type":"drag","mousePoint":{"x":130,"y":245.63333129882812},"time":6142},{"type":"drag","mousePoint":{"x":126,"y":247.63333129882812},"time":6176},{"type":"drag","mousePoint":{"x":126,"y":247.63333129882812},"time":6209},{"type":"drag","mousePoint":{"x":125,"y":248.63333129882812},"time":6243},{"type":"drag","mousePoint":{"x":125,"y":248.63333129882812},"time":6276},{"type":"drag","mousePoint":{"x":124,"y":248.63333129882812},"time":6310},{"type":"drag","mousePoint":{"x":123,"y":249.63333129882812},"time":6342},{"type":"drag","mousePoint":{"x":120,"y":249.63333129882812},"time":6376},{"type":"drag","mousePoint":{"x":120,"y":249.63333129882812},"time":6409},{"type":"release","mousePoint":{"x":119,"y":249.63333129882812},"time":6616},{"type":"hover","mousePoint":{"x":119,"y":249.63333129882812},"time":6676},{"type":"hover","mousePoint":{"x":119,"y":249.63333129882812},"time":6710},{"type":"hover","mousePoint":{"x":119,"y":248.63333129882812},"time":6809},{"type":"hover","mousePoint":{"x":121,"y":247.63333129882812},"time":6842},{"type":"hover","mousePoint":{"x":121,"y":247.63333129882812},"time":7009},{"type":"hover","mousePoint":{"x":121,"y":245.63333129882812},"time":7043},{"type":"hover","mousePoint":{"x":127,"y":237.63333129882812},"time":7076},{"type":"hover","mousePoint":{"x":138,"y":227.63333129882812},"time":7109},{"type":"hover","mousePoint":{"x":138,"y":227.63333129882812},"time":7309},{"type":"hover","mousePoint":{"x":138,"y":226.63333129882812},"time":7343},{"type":"hover","mousePoint":{"x":139,"y":224.63333129882812},"time":7376},{"type":"hover","mousePoint":{"x":139,"y":224.63333129882812},"time":7642},{"type":"hover","mousePoint":{"x":149,"y":207.63333129882812},"time":7676},{"type":"hover","mousePoint":{"x":157,"y":182.63333129882812},"time":7709},{"type":"hover","mousePoint":{"x":159,"y":159.63333129882812},"time":7742},{"type":"hover","mousePoint":{"x":159,"y":153.63333129882812},"time":7776},{"type":"hover","mousePoint":{"x":159,"y":151.63333129882812},"time":7808},{"type":"hover","mousePoint":{"x":159,"y":148.63333129882812},"time":7843},{"type":"hover","mousePoint":{"x":160,"y":145.63333129882812},"time":7876},{"type":"hover","mousePoint":{"x":160,"y":143.63333129882812},"time":7908},{"type":"hover","mousePoint":{"x":161,"y":140.63333129882812},"time":7943},{"type":"hover","mousePoint":{"x":161,"y":136.63333129882812},"time":7976},{"type":"hover","mousePoint":{"x":161,"y":133.63333129882812},"time":8010},{"type":"hover","mousePoint":{"x":161,"y":131.63333129882812},"time":8042},{"type":"hover","mousePoint":{"x":160,"y":128.63333129882812},"time":8076},{"type":"hover","mousePoint":{"x":158,"y":125.63333129882812},"time":8109},{"type":"hover","mousePoint":{"x":155,"y":121.63333129882812},"time":8143},{"type":"hover","mousePoint":{"x":153,"y":118.63333129882812},"time":8176},{"type":"hover","mousePoint":{"x":151,"y":114.63333129882812},"time":8210},{"type":"hover","mousePoint":{"x":149,"y":109.63333129882812},"time":8243},{"type":"hover","mousePoint":{"x":149,"y":108.63333129882812},"time":8276},{"type":"hover","mousePoint":{"x":149,"y":108.63333129882812},"time":8309},{"type":"hover","mousePoint":{"x":150,"y":107.63333129882812},"time":8341},{"type":"hover","mousePoint":{"x":150,"y":107.63333129882812},"time":8408},{"type":"hover","mousePoint":{"x":150,"y":107.63333129882812},"time":8443},{"type":"hover","mousePoint":{"x":150,"y":106.63333129882812},"time":8476},{"type":"hover","mousePoint":{"x":151,"y":105.63333129882812},"time":8509},{"type":"hover","mousePoint":{"x":151,"y":103.63333129882812},"time":8542},{"type":"hover","mousePoint":{"x":151,"y":102.63333129882812},"time":8575},{"type":"hover","mousePoint":{"x":151,"y":102.63333129882812},"time":8608},{"type":"hover","mousePoint":{"x":151,"y":101.63333129882812},"time":8642},{"type":"hover","mousePoint":{"x":151,"y":100.63333129882812},"time":8675},{"type":"hover","mousePoint":{"x":151,"y":99.63333129882812},"time":8709},{"type":"hover","mousePoint":{"x":151,"y":98.63333129882812},"time":8743},{"type":"hover","mousePoint":{"x":150,"y":97.63333129882812},"time":8776},{"type":"hover","mousePoint":{"x":150,"y":95.63333129882812},"time":8809},{"type":"hover","mousePoint":{"x":150,"y":94.63333129882812},"time":8843},{"type":"hover","mousePoint":{"x":151,"y":91.63333129882812},"time":8876},{"type":"hover","mousePoint":{"x":151,"y":90.63333129882812},"time":8909},{"type":"hover","mousePoint":{"x":151,"y":90.63333129882812},"time":8943},{"type":"press","mousePoint":{"x":152,"y":90.63333129882812},"time":8984},{"type":"drag","mousePoint":{"x":152,"y":90.63333129882812},"time":9009},{"type":"drag","mousePoint":{"x":152,"y":90.63333129882812},"time":9042},{"type":"drag","mousePoint":{"x":152,"y":90.63333129882812},"time":9075},{"type":"drag","mousePoint":{"x":153,"y":90.63333129882812},"time":9143},{"type":"drag","mousePoint":{"x":150,"y":94.63333129882812},"time":9176},{"type":"drag","mousePoint":{"x":142,"y":100.63333129882812},"time":9210},{"type":"drag","mousePoint":{"x":120,"y":117.63333129882812},"time":9242},{"type":"drag","mousePoint":{"x":89,"y":136.63333129882812},"time":9275},{"type":"drag","mousePoint":{"x":58,"y":157.63333129882812},"time":9310},{"type":"drag","mousePoint":{"x":46,"y":168.63333129882812},"time":9343},{"type":"drag","mousePoint":{"x":44,"y":175.63333129882812},"time":9376},{"type":"drag","mousePoint":{"x":39,"y":189.63333129882812},"time":9409},{"type":"drag","mousePoint":{"x":36,"y":199.63333129882812},"time":9442},{"type":"drag","mousePoint":{"x":36,"y":202.63333129882812},"time":9475},{"type":"drag","mousePoint":{"x":35,"y":203.63333129882812},"time":9509},{"type":"drag","mousePoint":{"x":35,"y":205.63333129882812},"time":9542},{"type":"drag","mousePoint":{"x":35,"y":206.63333129882812},"time":9575},{"type":"drag","mousePoint":{"x":35,"y":207.63333129882812},"time":9608},{"type":"drag","mousePoint":{"x":35,"y":207.63333129882812},"time":9775},{"type":"drag","mousePoint":{"x":34,"y":209.63333129882812},"time":9810},{"type":"drag","mousePoint":{"x":32,"y":212.63333129882812},"time":9843},{"type":"drag","mousePoint":{"x":31,"y":214.63333129882812},"time":9876},{"type":"drag","mousePoint":{"x":29,"y":215.63333129882812},"time":9909},{"type":"drag","mousePoint":{"x":29,"y":215.63333129882812},"time":9943},{"type":"drag","mousePoint":{"x":29,"y":216.63333129882812},"time":9976},{"type":"drag","mousePoint":{"x":29,"y":216.63333129882812},"time":10009},{"type":"drag","mousePoint":{"x":29,"y":218.63333129882812},"time":10042},{"type":"drag","mousePoint":{"x":29,"y":219.63333129882812},"time":10075},{"type":"drag","mousePoint":{"x":29,"y":220.63333129882812},"time":10110},{"type":"drag","mousePoint":{"x":29,"y":221.63333129882812},"time":10142},{"type":"drag","mousePoint":{"x":29,"y":222.63333129882812},"time":10176},{"type":"drag","mousePoint":{"x":29,"y":222.63333129882812},"time":10209},{"type":"drag","mousePoint":{"x":29,"y":223.63333129882812},"time":10243},{"type":"drag","mousePoint":{"x":29,"y":225.63333129882812},"time":10275},{"type":"drag","mousePoint":{"x":26,"y":231.63333129882812},"time":10309},{"type":"drag","mousePoint":{"x":26,"y":232.63333129882812},"time":10343},{"type":"drag","mousePoint":{"x":25,"y":233.63333129882812},"time":10710},{"type":"drag","mousePoint":{"x":24,"y":235.63333129882812},"time":10742},{"type":"drag","mousePoint":{"x":23,"y":237.63333129882812},"time":10776},{"type":"drag","mousePoint":{"x":23,"y":238.63333129882812},"time":10842},{"type":"drag","mousePoint":{"x":22,"y":240.63333129882812},"time":10876},{"type":"drag","mousePoint":{"x":20,"y":243.63333129882812},"time":10909},{"type":"release","mousePoint":{"x":20,"y":243.63333129882812},"time":11320},{"type":"hover","mousePoint":{"x":20,"y":243.63333129882812},"time":11610},{"type":"hover","mousePoint":{"x":42,"y":257.6333312988281},"time":11643},{"type":"hover","mousePoint":{"x":70,"y":288.6333312988281},"time":11675},{"type":"hover","mousePoint":{"x":103,"y":349.6333312988281},"time":11708},{"type":"hover","mousePoint":{"x":132,"y":391.6333312988281},"time":11742},{"type":"hover","mousePoint":{"x":134,"y":392.6333312988281},"time":11809},{"type":"hover","mousePoint":{"x":136,"y":392.6333312988281},"time":11843},{"type":"hover","mousePoint":{"x":137,"y":393.6333312988281},"time":11876},{"type":"hover","mousePoint":{"x":140,"y":393.6333312988281},"time":11910},{"type":"hover","mousePoint":{"x":142,"y":393.6333312988281},"time":11943},{"type":"hover","mousePoint":{"x":143,"y":393.6333312988281},"time":11976},{"type":"hover","mousePoint":{"x":144,"y":393.6333312988281},"time":12010},{"type":"hover","mousePoint":{"x":158,"y":395.6333312988281},"time":12042},{"type":"hover","mousePoint":{"x":167,"y":396.6333312988281},"time":12076},{"type":"hover","mousePoint":{"x":168,"y":396.6333312988281},"time":12143},{"type":"hover","mousePoint":{"x":168,"y":396.6333312988281},"time":12176}]'
]

export function make3DDisplay (container, referenceDrawing, width = 400, height = 400){
  let sketch = function(p) {
    p.setup = function(){
      p.createCanvas(width,height,p.WEBGL)
      p.background(0);
    }
    p.draw = function (){ 
      if(!referenceDrawing.currentPen.getClosedShapeCollection)return 
      const closedShapes  = referenceDrawing.currentPen.getClosedShapeCollection()
      p.background(100)
      const ORBIT_LEVEL = 3
      p.orbitControl(ORBIT_LEVEL,ORBIT_LEVEL,ORBIT_LEVEL)
      p.scale(0.75)
  
      p.translate((p.width / 2) * -1, (p.height / 2) * -1)
      if(!closedShapes)return
      closedShapes.forEach((closedShape,i)=>{ 
        const color = i === 0 ? 200: 'white'
        p.fill(color)
        p.beginShape();
        p.translate(0, 0, 15)
        // z++
        if(!closedShape)return
        closedShape.forEach(pt=>{
          p.vertex(pt.x, pt.y)
        })
        p.endShape(p.CLOSE);
      })
    }
  };
  new p5(sketch, container);
}

