import { Public } from './Public.js'
const {log} = console

export const State = {
  movePoints: (cursorPoint, moveToPoint, pointCollection) => { //log('move points')
    // log({cursorPoint, moveToPoint, pointCollection})
    const firstX = cursorPoint.x
    const firstY = cursorPoint.y
    let nX = 0;
    let nY = 0;
    const selectedPointCollection = [cursorPoint].concat(pointCollection)
    selectedPointCollection.forEach(pt => {

      nX = pt.x - firstX;
      nY = pt.y - firstY;
      // if (Public.whatThisIs(pt) === 'PointObserveable') {
      if (pt.xy) {
      //   if ( Public.whatThisIs(pt) === 'Joint2')log('Joint2')
      // if (Public.whatThisIs(pt) === 'PointObserveable' || Public.whatThisIs(pt) === 'Joint2') {
   
        pt.xy = {
          x: moveToPoint.x + nX,
          y: moveToPoint.y + nY
        }
      } else {
        pt.x = moveToPoint.x + nX;
        pt.y = moveToPoint.y + nY;
      }
    })
  },

  rotatePoints: (originalAngle, toAngle,anchorPoint, pointCollection)=>{
    const angleDelta =  toAngle - originalAngle
    const originalPointAngles = pointCollection.map(pt=>Public.getAngle(anchorPoint, pt))
    const pointToAnchorLengths = pointCollection.map(pt=>Public.getLengthTwoPoints(anchorPoint, pt))
    pointCollection.forEach((pt,i) => {
      const newPt = Public.getEndPoint(anchorPoint,pointToAnchorLengths[i],originalPointAngles[i]  + angleDelta)
      pt.x = newPt.x
      pt.y = newPt.y
    });
  },

  rotatePointsTool: (refernceLine, anchorPoint, pointCollection)=>{ 
    const originalAngle = Public.getLineAngle(refernceLine)
    const originalPointAngles = pointCollection.map(pt=>Public.getAngle(anchorPoint, pt))
    // const ln = {beginPoint:anchorPoint, endPoint:pointCollection[0]}
    const pointToAnchorLengths = pointCollection.map(pt=>Public.getLengthTwoPoints(anchorPoint, pt))
    return {
      refresh:()=>{ 

        const angleDelta =   Public.getLineAngle(refernceLine) - originalAngle
        pointCollection.forEach((pt,i) => {

          const newPt = Public.getEndPoint(anchorPoint,pointToAnchorLengths[i],originalPointAngles[i]  + angleDelta)
          if(pt.xy){
            pt.xy = newPt
          }else {
            pt.x = newPt.x
            pt.y = newPt.y
          }



        });
      }
    }
  },

  drawPointCaptureHalo: (context, atPoint, rgbColorString, haloRadius, haloLineWeight = 2) => {
    // log(context.strokeWeight())

    context
      .stroke(rgbColorString)
      .noFill()
      .strokeWeight(haloLineWeight)
      .circle(atPoint.x, atPoint.y, haloRadius)
      .strokeWeight(1)
  },

  drawTickCrossMark: (context, atPoint, rgbColorString, dimension, lineWeight) => {
    dimension *= .5
    context
      .stroke(rgbColorString)
      .noFill()
      .strokeWeight(lineWeight)
      .line(
        atPoint.x - dimension,
        atPoint.y,
        atPoint.x + dimension,
        atPoint.y)
      .line(atPoint.x,
        atPoint.y - dimension,
        atPoint.x,
        atPoint.y + dimension)
  },

  drawPointMark : (context,atPoint, tickSize = 5, color = 'rgba(0%, 0%, 0%, 0.3)') => {
  context
    .stroke(color)
    .noFill()
    .circle(atPoint.x, atPoint.y, 10)
    .line(atPoint.x - 5, atPoint.y, atPoint.x + 5, atPoint.y)
    .line(atPoint.x - tickSize, atPoint.y,
    atPoint.x + tickSize, atPoint.y)
    .line(atPoint.x, atPoint.y - tickSize,
    atPoint.x, atPoint.y + tickSize)
  }

}