/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */


import { LineShapePen } from './LineShapePen.js'
import { ArcLineShapePen } from './ArcLineShapePen.js'
import { LineSeriesPen } from './LineSeriesPen.js'
import { CircleSeriesPen } from './CircleSeriesPen.js'
import { BezierShapePen } from './BezierShapePen.js'
import { ArcShapePen } from './ArcShapePen.js'
import { UniversalShapePen } from './UniversalShapePen.js'
import { MultiShapePen_01  } from './MultiShapePen_01.js'
import {CompositeShapePen} from './CompositeShapePen.js'

const {log} = console

export const JSDraw = (parentContainerId, canvasWidth = 300, canvasHeight = 300)=>{
  const NULL_OBJECT = {draw:()=>{},drawLoop:()=>{},context:null, isNULL_OBJECT:true, sendMousePress:()=>{},sendMouseDrag:()=>{},sendMouseRelease:()=>{}}
  let currentPen = NULL_OBJECT
  let _context


  const penSet = (()=>{ //LAZY DEFINITIONS
    const loadedPen = {}
    return {
      get lineShapePen (){
      if(!loadedPen.lineShapePen)loadedPen.lineShapePen = new LineShapePen(_context)
      return loadedPen.lineShapePen
      },
      get lineSeriesPen (){
        if(!loadedPen.lineSeriesPen)loadedPen.lineSeriesPen = new LineSeriesPen(_context)
        loadedPen.lineSeriesPen.constructAsSeries = true
        return loadedPen.lineSeriesPen
      },
      get lineCollectionPen (){ 
        if(!loadedPen.lineCollectionPen)loadedPen.lineCollectionPen = new LineShapePen(_context)
        return loadedPen.lineCollectionPen
      },
      get circleSeriesPen (){
        if(!loadedPen.circleSeriesPen)loadedPen.circleSeriesPen = new CircleSeriesPen(_context)
        return loadedPen.circleSeriesPen
      },
      get arcLineShapePen (){
        if(!loadedPen.arcLineShapePen)loadedPen.arcLineShapePen = new ArcLineShapePen(_context)
        return loadedPen.arcLineShapePen
      },
      get bezierShapePen (){
        if(!loadedPen.bezierShapePen)loadedPen.bezierShapePen = new BezierShapePen(_context)
        return loadedPen.bezierShapePen
      },
      get arcShapePen (){
        if(!loadedPen.arcShapePen)loadedPen.arcShapePen = new ArcShapePen(_context)
        return loadedPen.arcShapePen
      },
      get compositePen (){
        if(!loadedPen.compositePen)loadedPen.compositePen = new CompositeShapePen(_context)
        return loadedPen.compositePen
      },
      get universalShapePen (){
        if(!loadedPen.universalShapePen)loadedPen.universalShapePen = new UniversalShapePen(_context)
        return loadedPen.universalShapePen
      },
      get multiShapePen_01 (){
        if(!loadedPen.multiShapePen_01)loadedPen.multiShapePen_01 = new MultiShapePen_01(_context)
        return loadedPen.multiShapePen_01
      },
    }
  })()
  const s = (context) => {
    _context = context
    context.setup = function() {
      const ctx = context.createCanvas( canvasWidth, canvasHeight);
      ctx.touchStarted((e)=>{ 
        /** 
        NOTE: p5js touchStarted method does not update mouseX & mouseY for the context, for some reason. 
        Below is another way to get those values to create mousePoint
        */
        const box = e.target.getBoundingClientRect()
        const x = e.targetTouches[0].clientX - box.x
        const y = e.targetTouches[0].clientY - box.y
        const mousePoint = {x,y}
        currentPen.sendMousePress(mousePoint)
        return false
      })
      ctx.mousePressed(()=>{ 
        const mousePoint = {x:context.mouseX, y:context.mouseY}
        currentPen.sendMousePress(mousePoint)
      })
      ctx.touchMoved(()=>{ 
        currentPen.sendMouseDrag({x:context.mouseX, y:context.mouseY})
      })
      ctx.mouseMoved(()=>{
        currentPen.sendMouseDrag({x:context.mouseX, y:context.mouseY})
      })
      ctx.touchEnded(()=>{
        currentPen.sendMouseRelease({x:context.mouseX, y:context.mouseY})
      })
      ctx.mouseReleased(()=>{ 
        currentPen.sendMouseRelease({x:context.mouseX, y:context.mouseY})
      })
    };
  
    
    context.draw = function() {
      const grayScale = 170
      context.background(`rgb(${grayScale},${grayScale},${grayScale})`);
      if(currentPen)currentPen.drawLoop()
    };
  };
  let currentPenKey
  const session = new p5(s, parentContainerId);
  
  return {
    get currentPen (){
      return currentPenKey
    },
    set currentPen(key){
      currentPenKey = key
      if(penSet[key])currentPen = penSet[key]
    }
  }
}
