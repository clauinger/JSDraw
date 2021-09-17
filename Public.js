//**------------------------------------------------------------------------------------------ */
//** PUBLIC FUNCTIONS FOR ACCESS WHERE THIS FILE IS IMPORTED                                   */
//** ALL FUNCTIONS ARE TO BE PURE                                    */
//**------------------------------------------------------------------------------------------- */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */



const {
  log
} = console

export const Public = {
  getUserMouseClickOnPoint: (mousePressPoint, distanceFactor, pointCollection) => {
    if (pointCollection.length === 0) {
      return null
    }
    if (pointCollection) {
      var selectedPoint = null;
      var closestPointDist = distanceFactor + 1;
      const evaluatePoint = (point, thisDistance) => {
        if (thisDistance <= closestPointDist && point != null) {
          closestPointDist = thisDistance;
          selectedPoint = point
        }
      }
      pointCollection.map(pt => {
        evaluatePoint(pt, Public.getDistanceTwoPoints(mousePressPoint, pt));
      })
      return selectedPoint;
    }
    return null
  },

  getDistanceTwoPoints: (point1, point2) => { //formerly distanceTwoPoints
    const x1 = point1.x
    const y1 = point1.y
    const x2 = point2.x
    const y2 = point2.y

    function diff(num1, num2) {
      if (num1 > num2) return (num1 - num2)
      else return (num2 - num1)
    }

    let deltaX = diff(x1, x2);
    let deltaY = diff(y1, y2);
    let dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    return (dist);
  },// {x:0,y:12},{x:10,y:112}

  getDeltaTwoPoints : (point1, point2) => {
    const x = point2.x - point1.x
    const y = point2.y - point1.y
    return {x,y}
  },

  getUserMouseClickOnLine: (mousePressPoint, distanceFactor, lineCollection) => {
    var selectedLine = null;
    var closestLineDist = distanceFactor + 1;
    lineCollection.map(line => {
      const beginPoint = {
        x: line.beginPoint.x,
        y: line.beginPoint.y
      }
      const endPoint = {
        x: line.endPoint.x,
        y: line.endPoint.y
      }
      const lDist = Public.getPerpendicularDistance(mousePressPoint, beginPoint, endPoint)
      if (lDist < closestLineDist) {
        closestLineDist = lDist;
        selectedLine = line;
      }
    })
    return selectedLine;
  },

  getPerpendicularDistance: (point, beginPoint, endPoint) => { //formerly pDistance
    // if(!endPoint && beginPoint.endPoint)endPoint = beginPoint.endPoint
    // if(!beginPoint.x && beginPoint.beginPoint)beginPoint = beginPoint.beginPoint
    const {
      x,
      y
    } = point
    const {
      x: x1,
      y: y1
    } = beginPoint
    const {
      x: x2,
      y: y2
    } = endPoint
    let A = x - x1;
    let B = y - y1;
    let C = x2 - x1;
    let D = y2 - y1;
    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;
    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    let dx = x - xx;
    let dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  },
  getLengthTwoPoints: (beginPoint, endPoint) => {
    return Public.getLineLength({
      beginPoint,
      endPoint
    })
  },

  filterNodelessMainPoints: (lineShapeCollection) => {
    return Public.filterMainPointsFromLineShapeCollection(lineShapeCollection).filter(pt => pt.nodeReference ? false : true)
  },

  filterMainPointsFromLineShapeCollection: (lineShapeCollection) => {
    let arr = []
    lineShapeCollection.forEach(ln => {
      arr.push(ln.beginPoint);
      arr.push(ln.endPoint)
    })
    return arr
  },




  getLineLength: (line) => {
    const {
      beginPoint,
      endPoint
    } = line
    return Public.getDistanceTwoPoints(beginPoint, endPoint)
  },

  getAngle: (anchor, point) => {
    return Math.atan2(anchor.y - point.y, anchor.x - point.x) * 180 / Math.PI + 180
  },

  getLineAngle: (line) => {
    return Public.getAngle(line.beginPoint, line.endPoint)
  },

  getLineRadianAngle: (line) => Math.atan2(line.endPoint.y - line.beginPoint.y, line.endPoint.x - line.beginPoint.x),

  //TODO REARANGE THE ARGUMENT ORDER FOR POINT FIRST
  getPerpendicularPoint: (line, point) => {
    const A = line.beginPoint
    const B = line.endPoint
    const x1 = A.x,
      y1 = A.y,
      x2 = B.x,
      y2 = B.y,
      x3 = point.x,
      y3 = point.y;
    const px = x2 - x1,
      py = y2 - y1,
      dAB = px * px + py * py;
    const u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    const x = x1 + u * px;
    const y = y1 + u * py;
    return {
      x: x,
      y: y
    }
  },

  getArcDirection: (beginPoint, centerPoint, endPoint) => {
    /** Return number;
     * if > 0 then is counterclockwise, 
     * if < 0 then it is clockwise, 
     * if 0 then arc is a simicircle */
    return (beginPoint.x - centerPoint.x) * (endPoint.y - centerPoint.y) - (beginPoint.y - centerPoint.y) * (endPoint.x - centerPoint.x)
  },

  getPointDistanceToLine: (point, line) => {
    const perpPt = Public.getPerpendicularPoint(line, point)
    return Public.getDistanceTwoPoints(point, perpPt)

  },

  getEndPoint: (beginPoint, length, angle) => {
    const endX = beginPoint.x + length * Math.cos(angle / 57.2958)
    const endY = beginPoint.y + length * Math.sin(angle / 57.2958)
    return {
      x: endX,
      y: endY
    }
  },

  getPointNodeCollection: (lineCollection, nodeCollection) => {
    var i
    var pointList = new Set();
    for (i = 0; i < lineCollection.length; i++) {
      var ln = getLinePointNodes(lineCollection[i], nodeCollection)
      pointList.add(ln.beginPointNode)
      pointList.add(ln.endPointNode)
    }
    return [...pointList]
  },

  getLinePointNodes: (line, nodeCollection) => {
    const beginNode = nodeCollection[line.beginPoint.nodeIndex]
    const endNode = nodeCollection[line.endPoint.nodeIndex]
    return {
      beginPointNode: beginNode || line.beginPoint,
      endPointNode: endNode || line.endPoint
    }
  },

  getLiteralPointInfo: (point, lineCollection) => {
    if (Public.isNodeKind(point)) {
      return
    }
    let findings
    lineCollection.map(ln => {
      if (ln.beginPoint === point) {
        findings = ((ln) => {
          return {
            lineFound: ln,
            getPoint: () => {
              return ln.beginPoint
            }
          }
        })(ln)

      } else if (ln.endPoint === point) {
        findings = ((ln) => {
          return {
            lineFound: ln,
            getPoint: () => {
              return ln.endPoint
            }
          }
        })(ln)
      }
    })
    return findings
  },


  // isNodeKind: (point) => {
  //   if (point) {} else {
  //     return false
  //   }
  //   if (point.kind) {} else {
  //     return false
  //   }
  //   if (point.x) {} else {
  //     return false
  //   }
  //   if (point.y) {} else {
  //     return false
  //   }
  //   return point.kind === 'node'
  // },

  whatThisIs: (obj) => { //formerly what
    if (typeof (obj) === "undefined") return "undefined";
    if (obj === null) return "Null";
    var res = Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1];
    if (res === "Object") {
      res = obj.constructor.name;
      if (typeof (res) != 'string' || res.length == 0) {
        if (obj instanceof jQuery) return "jQuery"; // jQuery build stranges Objects
        if (obj instanceof Array) return "Array"; // Array prototype is very sneaky
        return "Object";
      }
    }
    return res;
  },


  getAngleFromThreePoints: (point1, vertex, point2) => {
    const AB = Math.sqrt(Math.pow(vertex.x - point1.x, 2) + Math.pow(vertex.y - point1.y, 2));
    const BC = Math.sqrt(Math.pow(vertex.x - point2.x, 2) + Math.pow(vertex.y - point2.y, 2));
    const AC = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
  },

  getCircleCenterFromThreePoints: (A, B, C) => {
    const yDelta_a = B.y - A.y;
    const xDelta_a = B.x - A.x;
    const yDelta_b = C.y - B.y;
    const xDelta_b = C.x - B.x;
    const aSlope = yDelta_a / xDelta_a;
    const bSlope = yDelta_b / xDelta_b;
    const x = (aSlope * bSlope * (A.y - C.y) + bSlope * (A.x + B.x) - aSlope * (B.x + C.x)) / (2 * (bSlope - aSlope));
    const y = -1 * (x - (A.x + B.x) / 2) / aSlope + (A.y + B.y) / 2;
    return {
      x: x,
      y: y
    }; //this is D
  },

  getLineMidPoint: (line) => {
    const deltaX = (line.endPoint.x - line.beginPoint.x) / 2
    const deltaY = (line.endPoint.y - line.beginPoint.y) / 2
    return {
      x: line.beginPoint.x + deltaX,
      y: line.beginPoint.y + deltaY
    }
  },

  getUserMouseClickedOnCirclePenArc: (mousePressPoint, proximityDistance, circlePen) => {
    /** RETURN UserMouseClickedOnCircle IF ARC IS HIT OR NULL */
    let arcHitCount = 0
    const clickedOnCircle = Public.getUserMouseClickedOnCircle(mousePressPoint, proximityDistance, circlePen.radiiLineCollection)

    if (clickedOnCircle === null) {
      return null
    } else {
      const arcParameterCollection = circlePen.getArcParameterCollection(clickedOnCircle.radiusLine)
      const direction = circlePen.gatherConnectedArcLines(clickedOnCircle.radiusLine)[0].direction
      // log(direction)
      arcParameterCollection.map(arcParameter => {
        const arcLine = Public.makeLineFromArcParameter(arcParameter, clickedOnCircle.radiusLine.direction)
        arcHitCount += Public.pointIsWithinArc(
          clickedOnCircle.radiusLine.beginPoint, /**CENTERPOINT*/
          arcLine.endPoint,
          arcLine.beginPoint,
          clickedOnCircle.modifiedPressPoint,
          direction)
      })
    }
    if (arcHitCount > 0) {
      return clickedOnCircle
    }
    return null
  },

  getUserMouseClickedOnCircle: (mousePressPoint, proximityDistance, radiiLineCollection) => {
    if (radiiLineCollection.length == 0) {
      return null
    }
    var closestDistance = proximityDistance + 1
    var output = null
    const evaluateRadiusLine = (radiusLine) => {

      const centerPoint = radiusLine.beginPoint
      const radius = Public.getLineLength(radiusLine)
      const dist = Public.getDistanceTwoPoints(centerPoint, mousePressPoint)
      const diff = Math.abs(radius - dist)
      if (diff <= closestDistance) {
        closestDistance = diff
        const angl = Public.getAngle(centerPoint, mousePressPoint)
        output = {
          modifiedPressPoint: Public.getEndPoint(centerPoint, radius, angl),
          radiusLine: radiusLine,
          angle: angl,
          radius: radius
        }
        /** MOUSE DRAG CONSTRAINT ------*/
        // mouseDragPoint_confineToRadius = radius
      }
    }
    radiiLineCollection.map(line => {
      evaluateRadiusLine(line)
    })
    return output
  },
  /**RETURN RADIUS LINE INFO OR NULL**/

  makeLineFromArcParameter: (arcParameter) => {
    const beginAngle = Public.radiansToDegrees(arcParameter.beginAngle)
    const endAngle = Public.radiansToDegrees(arcParameter.endAngle)
    const centerPoint = {
      x: arcParameter.x,
      y: arcParameter.y,
    }
    return {
      beginPoint: Public.getEndPoint(centerPoint, arcParameter.radius, beginAngle),
      endPoint: Public.getEndPoint(centerPoint, arcParameter.radius, endAngle)
    }
  },

  radiansToDegrees: (radians) => {
    var pi = Math.PI;
    return radians * (180 / pi);
  },

  pointIsWithinArc /** RETURN BOOL */: (centerPoint, beginPoint, endPoint, checkPoint, direction = 'clockwise') => {
    const a1 = Public.getAngle(centerPoint, beginPoint)
    const a2 = Public.getAngle(centerPoint, endPoint)
    const ca = Public.getAngle(centerPoint, checkPoint)
    if (ca < a2 && direction === 'clockwise') {
      if (a1 > a2 && ca < a1) {
        return true
      } else if (a1 < a2 && ca > a1) {
        return true
      }
    } else if (ca > a2 && direction === 'clockwise' && ca > a1) {
      if (a1 < a2 && ca < a2 && a2 > a1) {
        return true
      } else if (a1 > a2 && ca > a1) {
        return true
      }
    }
    if (ca > a2 && direction === 'counterclockwise') {
      if (a1 < a2 && ca > a1) {
        return true
      } else if (a1 > a2 && ca < a1) {
        return true
      }
    } else if (ca < a2 && direction === 'counterclockwise' && ca < a1) {
      if (a1 > a2 && ca > a2 && a2 < a1) {
        return true
      } else if (a1 < a2 && ca < a1) {
        return true
      }
    }
    return false
  },


  isNodeKind: (point) => {
    if (point === undefined) return false
    if (point.kind === undefined) return false
    return point.kind === 'node'
  },

  getDirection: (point, line) => {
    const {
      x,
      y
    } = point
    const {
      x: x1,
      y: y1
    } = line.beginPoint
    const {
      x: x2,
      y: y2
    } = line.endPoint
    const d = ((x - x1) * (y2 - y1)) - ((y - y1) * (x2 - x1))
    return d > 0 ? 'clockwise' : 'counterclockwise'
  },

  getArc: (point1, point2, centerPoint, direction = 'clockwise') => {
    if (!centerPoint) return



    const diameter = Public.getLineLength({
      beginPoint: centerPoint,
      endPoint: {
        x: point1.x,
        y: point1.y
      }
    }) * 2
    const beginAngle = Public.getLineRadianAngle({
      beginPoint: centerPoint,
      endPoint: {
        x: point1.x,
        y: point1.y
      }
    })
    const endAngle = Public.getLineRadianAngle({
      beginPoint: centerPoint,
      endPoint: {
        x: point2.x,
        y: point2.y
      } //point2
    })

    return {
      //context.arc(x, y, diameter, diameter, beginAngle, endAngle)
      x: centerPoint.x,
      y: centerPoint.y,
      diameter,
      beginAngle: direction === 'clockwise' ? beginAngle : endAngle,
      endAngle: direction === 'clockwise' ? endAngle : beginAngle,
    }
  },

  getLineIntersection: (line1, line2) => {   
    // log(line2.endPoint.y)
    
    const line1BeginX = line1.beginPoint.x
    const line1BeginY = line1.beginPoint.y
    const line1EndX = line1.endPoint.x
    const line1EndY = line1.endPoint.y
    const line2BeginX = line2.beginPoint.x
    const line2BeginY = line2.beginPoint.y
    const line2EndX = line2.endPoint.x
    const line2EndY = line2.endPoint.y
    // log({line1BeginX , line1BeginY, line1EndX , line1EndY , line2BeginX, line2BeginY, line2EndX , line2EndY})
    let denominator, a, b, numerator1, numerator2
    let result = {
      x: null,
      y: null,
      // onLine1: false,
      // onLine2: false
      
    };

    denominator = ((line2EndY - line2BeginY) * (line1EndX - line1BeginX)) - ((line2EndX - line2BeginX) * (line1EndY - line1BeginY));
    if (denominator === 0) {
      log(Public.getLineLength(line2))
    }
    if (denominator === 0) return null;
    
    a = line1BeginY - line2BeginY;
    b = line1BeginX - line2BeginX;
    numerator1 = ((line2EndX - line2BeginX) * a) - ((line2EndY - line2BeginY) * b);
    numerator2 = ((line1EndX - line1BeginX) * a) - ((line1EndY - line1BeginY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;
    result.x = line1BeginX + (a * (line1EndX - line1BeginX));
    result.y = line1BeginY + (a * (line1EndY - line1BeginY));
    // log(result)
    // if (a > 0 && a < 1) {
    //     result.onLine1 = true;
    // }
    // if (b > 0 && b < 1) {
    //     result.onLine2 = true;
    // }

    return result;
  },

  getPointIsInsideBox: (point, box) => {
    return !(point.x < box.left || point.x > box.right || point.y > box.bottom || point.y < box.top)
  },

  generateArcPoints: (beginPoint, endPoint, centerPoint, direction = 'clockwise', arcLengthTarget = 10) => {
    const radius = Public.getDistanceTwoPoints(beginPoint, centerPoint)
    if (!isFinite(radius)) return []


    const isClockwise = direction === 'clockwise'
    const beginAngle = Public.getAngle(centerPoint, beginPoint)
    let endAngle = Public.getAngle(centerPoint, endPoint)
    if (endAngle < beginAngle && isClockwise) endAngle += 360
    if (endAngle > beginAngle && isClockwise === false) endAngle -= 360
    const centerAngle = isClockwise ? endAngle - beginAngle : beginAngle - endAngle

    const angleLength = Math.abs(centerAngle) * (Math.PI / 180) * radius
    const div = Math.abs(Math.round(angleLength / arcLengthTarget))
    let segmentAngle = centerAngle / div
    if (!isClockwise) segmentAngle *= -1
    const arcPoints = []
    for (let index = 0; index < div; index++) {
      const ang = beginAngle + (index * segmentAngle)
      const pt = Public.getEndPoint(centerPoint, radius, ang)
      arcPoints.push(pt)
    }
    return arcPoints
  },
  getIntersectionPointsFromTwoCircles: (centerPoint1 /* BEGIN POINT */, radius1, centerPoint2 /* END POINT */, radius2) => {
    //** CHECK IF CIRCLES DO NOT INTERSECT */
    const dd = Public.getDistanceTwoPoints(centerPoint1, centerPoint2)
    if(dd > radius1 && dd > radius2 ) return null

    const x0 = centerPoint1.x, y0 = centerPoint1.y
    const x1 = centerPoint2.x, y1 = centerPoint2.y
    if(!radius2) radius2 = radius1

    let a, dx, dy, d, h, rx, ry;
    let x2, y2;

    dx = x1 - x0;
    dy = y1 - y0;

    d = Math.sqrt((dy * dy) + (dx * dx));

    if (d > (radius1 + radius2)) {
      return false;
    }
    if (d < Math.abs(radius1 - radius2)) {
      return false;
    }
    a = ((radius1 * radius1) - (radius2 * radius2) + (d * d)) / (2.0 * d);
    x2 = x0 + (dx * a / d);
    y2 = y0 + (dy * a / d);
    h = Math.sqrt((radius1 * radius1) - (a * a));
    rx = -dy * (h / d);
    ry = dx * (h / d);
    let xi = x2 + rx;
    let xi_prime = x2 - rx;
    let yi = y2 + ry;
    let yi_prime = y2 - ry;
    return [  {x:xi_prime, y: yi_prime} /* CLOCKWISE CP */ , {x:xi, y: yi} /* COUNTER CLOCKWISE CP */];
  },

  getMovedPoints : (startPoint, moveToPoint, pointCollection)=>{
    const firstX = startPoint.x
    const firstY = startPoint.y
    let nX = 0;
    let nY = 0;
    const selectedPointCollection = [startPoint].concat(pointCollection)
    return selectedPointCollection.map(pt=>{
      nX = pt.x - firstX;
      nY = pt.y - firstY;
      return { x :moveToPoint.x + nX , y : moveToPoint.y + nY}
    })
  },
  getWhichSidePointToLine : (point, lineReference, print) =>{ 
    const lineBeginPoint = lineReference.beginPoint.xy || lineReference.beginPoint
    const lineEndPoint = lineReference.endPoint.xy || lineReference.endPoint
    const lineAngle = Public.getAngle(lineBeginPoint,lineEndPoint )
    const perpendicularPoint = Public.getPerpendicularPoint(lineReference, point)
    const angle = Math.round( Public.getAngle(point, perpendicularPoint) )
    let deltaAngle = angle -  Math.round( lineAngle )
    deltaAngle = deltaAngle < 0 ? 360 + deltaAngle : deltaAngle
    return deltaAngle === 270 ?  'right' : 'left'
  },

  generateUUID : ()=>{
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  },

}
