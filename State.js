//**-----------------------------------------------------------------------------------------------  */
//** THESE ARE ALL FUNCTIONS WHICH PRODUCE VALUE CHANGES TO OBJECTS WHICH ARE PASSED IN AS ARGUMENTS */
//**-----------------------------------------------------------------------------------------------  */

/*jshint esversion: 6 */
/*jshint asi: true */
/*jshint expr: true */

import { Public } from './Public.js'
const {log} = console

export const State = {
  movePoints: (cursorPoint, moveToPoint, pointCollection) => { 
    const firstX = cursorPoint.x
    const firstY = cursorPoint.y
    let nX = 0;
    let nY = 0;
    const selectedPointCollection = [cursorPoint].concat(pointCollection)
    selectedPointCollection.forEach(pt => {
      nX = pt.x - firstX;
      nY = pt.y - firstY;
      if (pt.xy) {
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
        })
      }
    }
  },

}