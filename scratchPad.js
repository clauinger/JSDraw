
const penSet = (()=>{
  //LAZY DEFINITIONS
  const loadedPen = {}
  return {
    get lineShapePen (){
    if(!loadedPen.lineShapePen)loadedPen.lineShapePen = new LineShapePen()
    return loadedPen.lineShapePen
    },
    get lineSeriesPen (){
      if(!loadedPen.lineSeriesPen)loadedPen.lineSeriesPen = new LineSeriesPen()
      loadedPen.lineSeriesPen.constructAsSeries = true
      return loadedPen.lineSeriesPen
    },
    get lineCollectionPen (){
      if(!loadedPen.lineCollectionPen)loadedPen.lineCollectionPen = new LineShapePen()
      return loadedPen.lineCollectionPen
    },
    get circleSeriesPen (){
      if(!loadedPen.circleSeriesPen)loadedPen.circleSeriesPen = new CircleSeriesPen()
      return loadedPen.circleSeriesPen
    },
    get arcLineShapePen (){
      if(!loadedPen.arcLineShapePen)loadedPen.arcLineShapePen = new ArcLineShapePen()
      return loadedPen.arcLineShapePen
    },
    get bezierShapePen (){
      if(!loadedPen.bezierShapePen)loadedPen.bezierShapePen = new BezierShapePen()
      return loadedPen.bezierShapePen
    },
    get arcShapePen (){
      if(!loadedPen.arcShapePen)loadedPen.arcShapePen = new ArcShapePen()
      return loadedPen.arcShapePen
    },
    get compositePen (){
      if(!loadedPen.compositePen)loadedPen.compositePen = new CompositeShapePen()
      return loadedPen.compositePen
    },
    get universalShapePen (){
      if(!loadedPen.universalShapePen)loadedPen.universalShapePen = new UniversalShapePen()
      return loadedPen.universalShapePen
    },
    get multiShapePen_01 (){
      if(!loadedPen.multiShapePen_01)loadedPen.multiShapePen_01 = new MultiShapePen_01()
      return loadedPen.multiShapePen_01
    },
  }
})()

