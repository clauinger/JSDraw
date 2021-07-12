/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

import {
 Public
} from './Public.js'
import {
 State
} from './State.js'
// import { State } from './State.js'
import {
 PenConstruct
} from './PenConstruct.js'





import {
 CursorLineSwiper, SelectionSet , CursorTimer
} from './PenTools.js'

const {
 log
} = console

function range_Round5(n){
  const n_rounded = Math.ceil(n / 5) * 5
  return {
      low: n_rounded - 5,
      mid: n_rounded,
      high: n_rounded + 5
  }
}

const setThisPointNodeSnapList = (linePen) => {
  if (linePen.selectedPoints.size == 1 && linePen.enableSnap) {
      linePen.pointNodeSnapList.list = linePen.getLinePointSnapList([...linePen.selectedPoints][0]);
  }
}

export class LineSeriesPen extends PenConstruct {
 constructor(context) {
  super()
  this.context = context
  this.enableDrawLine = true;
  this.enableLineSelection = true;
  this.enablePointSelection = true;
  this.enablePointMove = true;
  this.excludePointSelectionSet = new Set();
  this.enableSnap = true
  this.enableCursorTimedCommandSwitch = true
  this.enableEndPointConnectToNodeUponMouseRelease = true
  this.enableEndPointConnectToPointUponMouseRelease = true
  this.constructAsSeries = false;
  this.lineCountLimit = 0;

  this.proximityDistance = 5
  this.minimumNewLineLength = 5

  this.pointColor = 'rgba(20%, 20%, 100%, .9)';
  this.lineColor = 'rgba(90%, 90%, 90%, .9)';
  this.nodeColor = 'rgba(90%, 90%, 90%, .9)'
  this.selectedPointColor = 'rgba(100%, 0%, 0%, .8)'

  this.lineWid = .5;

  this.logMessage = (msg)=>{console.log(msg)}

  this.logMessage = log
  // this.logMessage = ()=>{}

  this.drawLine = function (beginX, beginY, endX, endY) {
   this.context
    .stroke(this.lineColor)
    .strokeWeight(this.lineWid)
    .line(beginX, beginY, endX, endY);
  }

  this.drawNode = node => {
   this.context
    .fill(this.nodeColor)
    .noStroke()
    .circle(node.x, node.y, 2)
  }

  this.drawPoint = point => {
   this.context
    .fill(this.pointColor)
    .noStroke()
    .circle(point.x, point.y, 4)
  }
  this.lineCollection = [];
  this.nodeCollection = [];

  this.cursorTimer = null
  this.userPenPoint;
  this.pointNodeSnapList = [];
  this.selectedPoints = new SelectionSet()
  this.mousePressPoint = {
   x: 0,
   y: 0
  }
  this.selectedLines = new SelectionSet();
  this.pointNodeTree = null;
  this.resetPen = () => {
   this.userMousePressInfo = null
   this.enableDrawLine = true;
   this.lineCollection = [];
   this.editPointCollection = [];
   this.nodeCollection = [];
   this.mouseWasDragged = false
   this.pointNodeSnapList = [];
   this.selectedPoints.removeAll()
   this.selectedLines.clear();
   this.pointNodeTree = null;
   selectedLineTracker = {
    line: null,
    clickCount: 0
   }
   this.elegableSnapPoints = {}
  }

  this.event /** MY CUSTOM EVENTS */ = {

   // newLineDeleted_NotAccepted : ()=>{this.logMessage('newLineDeleted_NotAccepted')},
   beginModify: () => {},
   /** RUN ONCE */
   continueModify: () => {},
   /** RUN MULTIPLE TIMES */
   userEndedModify: () => {},
   /** RUN ONCE */

   /** USER DRAW EVENTS */
   userBeginDrawNewLine: () => {},
   userContinueDrawNewLine: () => {},
   userEndedDrawNewLine: () => {},
   /** DELETED NEW DRAW LINE EVENT */
   newLineDeleted_NotAccepted: () => {},
  }

  this.nodeSnapProximityDistance = 10
  this.userProximityDistance = 6
  this.lineDistance = (lineIndex) => {
   let ln = this.lineCollection[lineIndex]
   if (ln == undefined) {
    return null
   } else if (ln == null) {
    return null
   }
   return Public.getDistanceTwoPoints(ln.beginPoint , ln.endPoint )
  }
  this.dragMoveSelectedPoints = function (newCursorPoint) {
   dragMoveSelectedPoints(newCursorPoint)
  }
  this.cursorLineSwiper = null
  this.logToConsole = false

  this.toJSON = () => {

   let selectedList
   if (this.hasSelectedLines || this.hasSelectedPoints) {
    selectedList = this.lineCollection.map(line => {
     const lineSelected = this.selectedLines.has(line)
     const ln = this.getLinePointNodes(line)
     const beginPointSelected = this.selectedPoints.has(ln.beginPointNode)
     const endPointSelected = this.selectedPoints.has(ln.endPointNode)
     return {
      line: lineSelected,
      beginPointNode: beginPointSelected,
      endPointNode: endPointSelected
     }
    })
   }
   const returnVal = {
    'lineCollection': JSON.stringify(this.lineCollection),
    'nodeCollection': JSON.stringify(this.nodeCollection),
    'constructAsSeries': JSON.stringify(this.constructAsSeries),
    'enableDrawLine': JSON.stringify(this.enableDrawLine),
    'enableLineSelection': JSON.stringify(this.enableLineSelection),
    'lineCountLimit': JSON.stringify(this.lineCountLimit),
    'proximityDistance': JSON.stringify(this.proximityDistance),
    'minimumNewLineLength': JSON.stringify(this.minimumNewLineLength),
   }
   if (selectedList) {
    const selectedLineInfo = {
     clickCount: selectedLineTracker.clickCount
    }
    this.lineCollection.forEach((line, index) => {
     if (selectedLineTracker.line === line) {
      selectedLineInfo.index = index
     }
    })
    returnVal.selectedLineInfo = JSON.stringify(selectedLineInfo)

    returnVal.selectionSets = JSON.stringify(selectedList)
    // returnVal['selectedLineTracker'] = JSON.stringify(selectedList)
    //selectedLineTracker
   }
   return returnVal

  }
  this.insertSelectedLineInfo = (selectedLineInfo) => {
   if (this.selectedLines.size === 0) {
    return
   } else if (this.selectedLines.has(this.lineCollection[selectedLineInfo.index])) {
    selectedLineTracker.line = this.lineCollection[selectedLineInfo.index]
    selectedLineTracker.clickCount = selectedLineInfo.clickCount
   }
  }

  /**--------------------CONSTRUCTOR SCOPED VARIABLES/FUNCTIONS DEFINED BELOW------------------------*/

  const moveSelectedPoints = (cursorX, cursorY) => {
   if (this.enablePointMove == false) {
    return false
   } else if (this.selectedPoints.size === 0) {
    return false
   }
   if (beginModifyTriggered === false) {
    beginModifyTriggered = true
    this.event.beginModify()
   }
   const firstX = this.mousePressPoint.x
   const firstY = this.mousePressPoint.y
   var nX = 0;
   var nY = 0;
   const selectedPointCollection = [this.mousePressPoint].concat([...this.selectedPoints])
   for (let i = 0; i < selectedPointCollection.length; i++) {
    var pt = selectedPointCollection[i];
    nX = pt.x - firstX;
    nY = pt.y - firstY;
    pt.x = cursorX + nX;
    pt.y = cursorY + nY;
   }
   if (beginModifyTriggered) {
    this.event.continueModify()
   }
   return true;
  }

  const makeNewLine = (mouseX = this.context.mouseX, mouseY = this.context.mouseY, connectToPointWithNode) => {
   var i
   var newPoint
   beginDrawTriggered = true
   if (this.lineCollection.length == 0) {
    this.lineCollection.push({
     beginPoint: {
      x: mouseX,
      y: mouseY
     },
     endPoint: {
      x: 0,
      y: 0
     }
    });
    /* BELOW SETS LAST LINE POINT TO MOVE WHEN 
    this.moveSelectedPoints IS CALLED */

    this.userPenPoint = this.lineCollection.slice(-1)[0].endPoint;
    this.event.userBeginDrawNewLine()
    return
   }
   if (this.lineCollection.length < this.lineCountLimit || this.lineCountLimit == 0) {
    // then add new line to lineCollection
    this.lineCollection.push({
     beginPoint: {
      x: mouseX,
      y: mouseY
     },
     endPoint: {
      x: 0,
      y: 0
     }
    });
    if (connectToPointWithNode == null || this.enableSnap == false) {
     // exit
    } else if (Public.isNodeKind(connectToPointWithNode)) {
     // connect with node
     newPoint = this.lineCollection.slice(-1)[0].beginPoint
     this.connectPointWithNode(newPoint, connectToPointWithNode)
    } else {
     /* 
     MAKE NEW NODE (FIRST FIND AN ABANDONED SPOT IN ARRAY)
     */
     var newNodeIndex = null
     var newNode
     for (let i = 0; i < this.nodeCollection.length; i++) {
      if (this.nodeCollection[i] == null) {
       newNodeIndex = i
      }
     }
     if (newNodeIndex == null) {
      this.nodeCollection.push({
       x: connectToPointWithNode.x,
       y: connectToPointWithNode.y,
       kind: 'node'
      });
      var last = this.nodeCollection.length - 1;
      newNode = this.nodeCollection[last]
     } else {
      this.nodeCollection[newNodeIndex] = {
       x: connectToPointWithNode.x,
       y: connectToPointWithNode.y,
       kind: 'node'
      }
      newNode = this.nodeCollection[newNodeIndex]
     }
     this.userPenPoint = this.nodeCollection.slice(-1)[0];
     var refPoint;
     for (let i = 0; i < this.lineCollection.length; i++) {
      if (this.lineCollection[i].beginPoint === connectToPointWithNode) {
       newPoint = this.lineCollection[i].beginPoint
       this.connectPointWithNode(newPoint, newNode)
      }
      if (this.lineCollection[i].endPoint === connectToPointWithNode) {
       newPoint = this.lineCollection[i].endPoint
       this.connectPointWithNode(newPoint, newNode)
      }
     }
     this.connectPointWithNode(refPoint, newNode)
     this.connectPointWithNode(this.lineCollection.slice(-1)[0].beginPoint, newNode)
    }
   }
   if (this.lineCollection.length == this.lineCountLimit) {
    this.enableDrawLine = false
   }
   this.event.userBeginDrawNewLine()
  }

  let selectedLineTracker = {
   line: null,
   clickCount: 0,
  }

  let userClickedOnPrimarySelectedLineTwice

  this.dragMoveSelectedPoints = (newCursorPoint) => {
   dragMoveSelectedPoints(newCursorPoint)
  }
  const dragMoveSelectedPoints = (newCursorPoint) => {
   this.findSnapPoint()

   const didMoveSelectedPoints = (moveSelectedPoints(newCursorPoint.x, newCursorPoint.y));

   if (didMoveSelectedPoints == false) {
    this.userPenPoint.x = newCursorPoint.x;
    this.userPenPoint.y = newCursorPoint.y;
   }
   this.mouseWasDragged = true;
   if (beginDrawTriggered) {
    this.event.userContinueDrawNewLine()
   }
   if (this.pointNodeSnapList == null) {
    return
   }
   if (this.pointNodeSnapList.list == null) {
    return
   }
   var result = this.getPointOnTarget(
    newCursorPoint.x,
    newCursorPoint.y,
    this.pointNodeSnapList.list,
    this.nodeSnapProximityDistance)
   if (typeof result == 'undefined') {
    // EXIT BLOCK
   } else if (result == null) {
    this.pointNodeSnapList.isInContactWith = null;
   } else {
    this.pointNodeSnapList.isInContactWith = result
   }
  }

  let beginModifyTriggered = false
  let beginDrawTriggered = false

  /**--------------------MUST PROVIDE & DEFINED BELOW-------------------------*/

  this.mousePressEventStack = {
   /**-------------------------------------------------*/
   mouseClickedOnDrawPoint: {
    evaluate: (mousePressPoint,
    //  eventKey = '',
     enableDrawLine = this.enableDrawLine,
     hasSelectedPoints = this.hasSelectedPoints,
     proximityDistance = this.proximityDistance,
     pointNodeCollection = this.pointNodeCollection,
     lineCollection = this.lineCollection,
     constructAsSeries = this.constructAsSeries,

    ) => {
     /**------------------GUARD STATEMENTS**/
     if (enableDrawLine) {} else {
      return
     }
     if (hasSelectedPoints) {
      return
     }
     // const pointNodeCollection = getPointNodeCollection(lineCollection, nodeCollection)
     const pointNodeTapped = Public.getUserMouseClickOnPoint(
      mousePressPoint,
      proximityDistance,
      pointNodeCollection)
     if (pointNodeTapped) {} else {
      return
     }
     if (constructAsSeries && Public.isNodeKind(pointNodeTapped)) {
      return
     }
     /**------------------GET FINDINGS**/
     const findings = {
      // eventKey: eventKey
     }
     findings.capturedPoint = pointNodeTapped
     findings.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointNodeTapped)
     findings.modifiedPressPoint = pointNodeTapped
     const literalPointInfo = Public.getLiteralPointInfo(pointNodeTapped, lineCollection)
     if (literalPointInfo) {
      findings.getPointTapped = literalPointInfo.getPoint
     } else {
      findings.getPointTapped = () => {}
     }

     return findings
    },
    exicute: (userMousePressInfo = this.userMousePressInfo) => {
     this.logMessage('case 2: user to start draw new line')
     const drawBeginPoint = userMousePressInfo.capturedPoint
     var userTapOnPoint = userMousePressInfo.capturedPoint
// log(context)
     this.cursorTimer = CursorTimer(this.context, 500, 5, 
      () => {
      this.logMessage('     2j) time with mouse on point has eleapsed; line is deleted and pointNode is to be selected')

      if (this.mouseWasDragged) {
       this.deleteLastLine()
      }

      beginDrawTriggered = false
      this.event.newLineDeleted_NotAccepted()

      // NOW THAT NEW LINE IS DELETED, CHANGE INPUT TO SELECTED POINT
      userTapOnPoint = Public.getUserMouseClickOnPoint(drawBeginPoint, this.proximityDistance, this.pointNodeCollection)
      if (userTapOnPoint != null) {
       this.logMessage('     2l) point is selected instead')
       this.selectedPoints.append(userTapOnPoint)
       setThisPointNodeSnapList(this)
      }
      this.defineEventFunction({
       mouseDragBegin: () => {}
      })
      this.defineEventFunction({
       mouseRelease: () => {
        this.selectedPoints.removeAll()
       }
      })
     }
     )

     if (this.enableCursorTimedCommandSwitch) {
      this.cursorTimer.reset(userTapOnPoint)
     }
     
     this.defineEventFunction({
      mouseDragBegin: (
       mouseDragPoint = {
        x: this.context.mouseX,
        y: this.context.mouseY
       }
      ) => {
       this.logMessage('     2b) start draw new line')
       this.cursorTimer.currentPenPoint({
        x: this.context.mouseX,
        y: this.context.mouseY
       })
       if (this.constructAsSeries == false && this.pointNodeIsMember(drawBeginPoint)) {
        makeNewLine(drawBeginPoint.x, drawBeginPoint.y, drawBeginPoint);
       } else if (this.constructAsSeries == false) {
        makeNewLine(drawBeginPoint.x, drawBeginPoint.y);
       } else {
        makeNewLine(drawBeginPoint.x, drawBeginPoint.y, drawBeginPoint);
       }
       /* BELOW SETS LAST LINE POINT TO MOVE WHEN 
       this.moveSelectedPoints IS CALLED */
       this.userPenPoint = this.lineCollection.slice(-1)[0].endPoint;
       this.userPenPoint.x = mouseDragPoint.x;
       this.userPenPoint.y = mouseDragPoint.y
       //SET This.PointNodeSnapList.list
       this.pointNodeSnapList.list = this.getLinePointSnapList(this.userPenPoint);
      }
     })

     this.defineEventFunction({
      mouseDragContinue: (mouseDragPoint) => {
       this.cursorTimer.currentPenPoint(mouseDragPoint)
       dragMoveSelectedPoints(mouseDragPoint)
      }
     })


     this.defineEventFunction({
      mouseReleaseAfterDrag: () => {
       // THIS WILL CHECK FOR NEW LINE BEING LONG ENOUGH. IF NOT, THEN NEW LINE WILL BE DELETED
       this.cursorTimer.cancel()
       const lastLine = this.lineCollection.slice(-1)[0]
       if (Public.getLengthTwoPoints(lastLine.beginPoint, lastLine.endPoint) < this.minimumNewLineLength) {
        this.logMessage('     2g) new line length is too short; pointNode is selected instead')
        this.deleteLastLine()
        const thisPoint = userMousePressInfo.getPointTapped() || userTapOnPoint
        this.selectedPoints.append(thisPoint)
        setThisPointNodeSnapList(this)
       } else if (this.pointNodeSnapList.isInContactWith != null) {
        this.logMessage('     2q) new line input completed')
        const ln = this.getLinePointNodes(lastLine)

        if (ln.beginPointNode === this.pointNodeSnapList.isInContactWith &&
         ln.endPointNode === this.pointNodeSnapList.isInContactWith) {} else if (this.enableEndPointConnectToNodeUponMouseRelease) {
         this.logMessage('         2r)... with endPoint connected to node')
         this.connect(this.userPenPoint, this.pointNodeSnapList.isInContactWith)
        } else if (
         this.enableEndPointConnectToPointUponMouseRelease &&
         Public.isNodeKind(this.pointNodeSnapList.isInContactWith) == false) {
         this.logMessage('         2s)... with endPoint connected to point')
         this.connect(this.userPenPoint, this.pointNodeSnapList.isInContactWith)
        } else {
         this.logMessage('         2t)... with endPoint snap aligned to point without connection being made')
         this.lastLine.endPoint.x = this.pointNodeSnapList.isInContactWith.x
         this.lastLine.endPoint.y = this.pointNodeSnapList.isInContactWith.y
        }
        this.pointNodeSnapList.list = null;
        this.pointNodeSnapList.isInContactWith = null;
       }
       if (beginModifyTriggered) {
        this.event.userEndedModify()
       }
       if (beginDrawTriggered) {
        this.event.userEndedDrawNewLine()
       }
      }

     })

     this.defineEventFunction({
      mouseReleaseWithoutDrag: () => {
       this.logMessage('    onUserMouseRelease 2.2')
       this.cursorTimer.cancel()
       const userTappedOnPoint = this.constructAsSeries == false && userTapOnPoint != null && this.mouseWasDragged == false
       if (userTappedOnPoint) {
        this.logMessage('     2e) add selected point to selection set')
        this.selectedPoints.append(userTapOnPoint)
        userTapOnPoint = null;
        setThisPointNodeSnapList(this)
        return
       }
       userTapOnPoint = drawBeginPoint
       if (this.selectedPoints.has(userTapOnPoint)) {
        this.logMessage('     2c) release point from selection set')
        this.selectedPoints.remove(userTapOnPoint)
        for (let i = 0; i < this.selectedLines.size; i++) {
         var forLine = [...this.selectedLines][i]
         var ln = this.getLinePointNodes(forLine);
         if (ln.beginPointNode === userTapOnPoint || ln.endPointNode === userTapOnPoint) {
          this.selectedLines.remove(forLine);
         }
        }
       } else {
        this.logMessage('     2d) add point to selection set')
        this.selectedPoints.append(userTapOnPoint)
        setThisPointNodeSnapList(this)
       }
      }
     })
    }
   },
   /**-------------------------------------------------*/
   mouseClickedOnPointNode: {
    evaluate: (mousePressPoint,
    //  eventKey = '',
     proximityDistance = this.proximityDistance,
     pointNodeCollection = this.pointNodeCollection
    ) => {
     /**------------------GUARD STATEMENTS**/
     // NONE
     /**------------------GET FINDINGS**/
     const findings = (() => {
      let result = {}
      const pointTapped = Public.getUserMouseClickOnPoint(
       mousePressPoint,
       proximityDistance,
       pointNodeCollection)
      if (pointTapped) {
       result = {
        // eventKey: eventKey
       }
       result.point = pointTapped
       result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, pointTapped)
       result.modifiedPressPoint = pointTapped
       return result
      }
     })()
     return findings
    },
    exicute: (userMousePressInfo = this.userMousePressInfo) => {
     this.logMessage('case 3: user to manipulate point and active selection')
     let userTapOnPoint = userMousePressInfo.point
     this.defineEventFunction({
      mouseDragBegin: () => {

       this.logMessage('     3b) add selected Point to selection set')
       this.selectedPoints.append(userTapOnPoint)
       userTapOnPoint = null;
       setThisPointNodeSnapList(this)
      }
     })
     this.defineEventFunction({
      mouseDragContinue: (mouseDragPoint = {
       x: this.context.mouseX,
       y: this.context.mouseY
      }) => {
       dragMoveSelectedPoints(mouseDragPoint)
      }
     })
     this.defineEventFunction({
      mouseReleaseAfterDrag: () => {

       if (this.selectedPoints.size == 1 && this.pointNodeSnapList.isInContactWith != null) {
        this.logMessage('     3f)connect point with node')
        this.connect([...this.selectedPoints][0], this.pointNodeSnapList.isInContactWith)
        this.pointNodeSnapList.list = null;

        this.pointNodeSnapList.isInContactWith = null;
       }
       if (this.selectedPoints.size == 1) {
        this.clearSelectedPoints()
       }
       if (beginModifyTriggered) {
        this.event.userEndedModify()
       }
      }
     })
     this.defineEventFunction({
      mouseReleaseWithoutDrag: () => {
       if (this.selectedPoints.size == 1) {
        this.logMessage('     3c) remove single point from selection set after move')
        this.selectedPoints.removeAll()
       } else if (userTapOnPoint == null) {
        // EXIT BLOCK
       } else if (this.selectedPoints.has(userTapOnPoint)) {
        this.logMessage('     3d) remove point from selection set')
        this.selectedPoints.remove(userTapOnPoint)
        var deleteLines = []
        for (let i = 0; i < this.selectedLines.size; i++) {
         var forLine = [...this.selectedLines][i]
         var ln = this.getLinePointNodes(forLine);
         if (ln.beginPointNode === userTapOnPoint) {
          deleteLines.push(forLine)
         }
         if (ln.endPointNode === userTapOnPoint) {
          deleteLines.push(forLine)
         }
        }
        for (let i = 0; i < deleteLines.length; i++) {
         this.selectedLines.remove(deleteLines[i]);
        }
       } else {
        this.logMessage('     3e) add point to selection set')
        this.selectedPoints.append(userTapOnPoint)
        setThisPointNodeSnapList(this)
       }
      }
     })
    }
   },
   /**-------------------------------------------------*/
   mouseClickedOnLine: {
    evaluate: (mousePressPoint,
    //  eventKey = '',
     proximityDistance = this.proximityDistance,
     lineCollection = this.lineCollection

    ) => {
     /**------------------GUARD STATEMENTS**/
     // NONE
     /**------------------GET FINDINGS**/

     const findings = (() => {
      let result = {}
      const lineTapped = Public.getUserMouseClickOnLine(
       mousePressPoint,
       proximityDistance,
       lineCollection)
      if (lineTapped) {

       const modifiedPressPoint = Public.getPerpendicularPoint(lineTapped, mousePressPoint)
       result = {
        // eventKey: eventKey
       }
       result.line = lineTapped
       result.distanceOffset = Public.getLengthTwoPoints(mousePressPoint, modifiedPressPoint)
       result.modifiedPressPoint = modifiedPressPoint
       return result
      }
     })()
     return findings
    },

    exicute: (mousePressInfo = this.userMousePressInfo) => {
     this.logMessage('case 3: user initiate line tap')
     let userTapOnLine = mousePressInfo.line
     if (selectedLineTracker.line == null) {
      userClickedOnPrimarySelectedLineTwice = false
     } else if (selectedLineTracker.line === userTapOnLine == false) {
      userClickedOnPrimarySelectedLineTwice = false
     } else if (selectedLineTracker.line.beginPoint.nodeIndex == undefined &&
      selectedLineTracker.line.endPoint.nodeIndex == undefined) {

      selectedLineTracker.clickCount = 2
      userClickedOnPrimarySelectedLineTwice = false

     } else if (selectedLineTracker.clickCount == 1) {
      userClickedOnPrimarySelectedLineTwice = true
      selectedLineTracker.clickCount = 2
     }

     selectedLineTracker.line = userTapOnLine
     selectedLineTracker.clickCount = 1

     let grabPoint
     let cursorPoint = mousePressInfo.modifiedPressPoint

     this.cursorLineSwiper = CursorLineSwiper(
      this.context,
      cursorPoint,
      userTapOnLine,
      5,
      () => { //swipeHasGrabbedPointFunction
       this.mouseWasDragged = false
       this.lastEventKey += '_swipeHasGrabbedPoint'
       this.defineEventFunction({
        mouseDragBegin: () => {
         this.logMessage('   4b) cursor swipe Has Grabbed a Point')
         grabPoint = this.cursorLineSwiper.getGrabPoint()
         if (grabPoint.nodeIndex !== undefined) {
          grabPoint = this.nodeCollection[grabPoint.nodeIndex]
         }
         this.selectedPoints.append(grabPoint)
         cursorPoint = {
          x: grabPoint.x,
          y: grabPoint.y
         }
        }
       })
       this.defineEventFunction({
        mouseDragContinue: (mouseDragPoint) => {
         const cursorPt = this.cursorLineSwiper.getModifiedCursorPoint(mouseDragPoint)
         State.movePoints(
          cursorPoint,
          cursorPt,
          [...this.selectedPoints])
        }
       })
       this.defineEventFunction({
        mouseRelease: () => {
         if (this.selectedPoints.size === 1) {
          this.logMessage('   4c) clear single selected point after move')
          this.selectedPoints.removeAll()
         }
         this.cursorLineSwiper = null
         this.logMessage('   4d) move is done, but will keep multiple selected points')
        }
       })
      },
      () => { //swipeBrokenPathFunction
       this.mouseWasDragged = false
       this.lastEventKey += '_swipeBrokenPath'
       this.defineEventFunction({
        mouseDragBegin: () => {
         this.logMessage('   4e) swipe has broken line path; user to select line and freely move all selected points')
         this.selectedLines.append(userTapOnLine)
         userTapOnLine = null
         this.syncSelectedSets()
         cursorPoint = this.cursorLineSwiper.getReturnSnapPoint()
         cursorPoint = {
          x: cursorPoint.x,
          y: cursorPoint.y
         }
        }
       })
       this.defineEventFunction({
        mouseDragContinue: (mouseDragPoint) => {
         State.movePoints(cursorPoint,
          this.cursorLineSwiper.getModifiedCursorPoint(mouseDragPoint),
          [...this.selectedPoints])
        }
       })
       this.defineEventFunction({
        mouseRelease: () => {
         this.logMessage('   4f) move is complete; clear all selected points')
         this.clearSelectedPoints()
         this.cursorLineSwiper = null
        }
       })
      },
     )
     // }
     this.defineEventFunction({
      mouseDragBegin: (mouseDragPoint) => {
       this.logMessage('   4a) cursor swipper begins')
      }
     })

     this.defineEventFunction({
      mouseDragContinue: (mouseDragPoint) => {
       this.cursorLineSwiper.getModifiedCursorPoint(mouseDragPoint)
      }
     })
     this.defineEventFunction({
      mouseReleaseAfterDrag: () => {
       this.logMessage('   4g) no edit has occured')
       this.cursorLineSwiper = null
      }
     })
     this.defineEventFunction({
      mouseReleaseWithoutDrag: () => {
       this.cursorLineSwiper = null
       const allLinesAreAlreadySelected = this.lineCollection.length == this.selectedLines.size
       const notAllLinesAreAlreadySelected = allLinesAreAlreadySelected == false
       const tappedLineIsAlreadyInSelectionSet = this.selectedLines.has(userTapOnLine)
       const notTappedLineIsAlreadyInSelectionSet = tappedLineIsAlreadyInSelectionSet == false
       if (allLinesAreAlreadySelected) {
        this.logMessage('     4h) remove line from selection set')
        this.selectedLines.remove(userTapOnLine)
        this.syncSelectedSets()
       } else if (notAllLinesAreAlreadySelected && notTappedLineIsAlreadyInSelectionSet) {
        this.logMessage('     4i) add line to selection set')
        this.selectedLines.append(userTapOnLine)
        selectedLineTracker.line = userTapOnLine
        selectedLineTracker.clickCount = 1
        this.syncSelectedSets()
       } else if (userClickedOnPrimarySelectedLineTwice) {
        this.logMessage('    4j) user Clicked On Primary Selected Line Twice\n    Selected line has node connection \n      select all connected lines')
        const newSelectedLines = this.getConnectedLineSet(selectedLineTracker.line)
        this.selectedLines.replaceSet([...newSelectedLines])
        this.syncSelectedSets()
       } else if (tappedLineIsAlreadyInSelectionSet) {
        this.logMessage('     4k) remove line from selection set')
        this.selectedLines.remove(userTapOnLine)
        const ln = this.getLinePointNodes(userTapOnLine)
        this.selectedPoints.remove(ln.beginPointNode)
        this.selectedPoints.remove(ln.endPointNode)
        this.syncSelectedSets()
       }
      }
     })
    }


   },
   /**-------------------------------------------------*/
   mouseClickedOnNothingWhileHasSelectedPoints: {
    evaluate: (mousePressPoint,
    //  eventKey = '',
     hasSelectedPoints = this.hasSelectedPoints,
     proximityDistance = this.proximityDistance,
     pointNodeCollection = this.pointNodeCollection
    ) => {
     /**------------------GUARD STATEMENTS**/
     if (hasSelectedPoints) {} else {
      return
     }
     const pointTapped = Public.getUserMouseClickOnPoint(
      mousePressPoint,
      proximityDistance,
      pointNodeCollection)
     if (pointTapped) {
      return
     }
     /**------------------GET FINDINGS**/
     const findings = {
      // eventKey: eventKey
     }

     return findings
    },
    exicute: () => {
     this.logMessage('case 5: user to reduce active selection')
     if (this.hasSelectedLines) {
      this.logMessage('     5a) clear all selected lines')
      this.selectedLines.removeAll()
      selectedLineTracker.line = null
      selectedLineTracker.clickCount = 0
     } else if (this.hasSelectedPoints) {
      this.logMessage('case 6: user tap on nothing while there are selected points')
      this.logMessage('     6a) clear all selected points')
      this.selectedPoints.removeAll()
      this.elegableSnapPoints = {}
     }
    }
   },
   /**-------------------------------------------------*/
   mouseClickedOnDrawField: {
    evaluate: (mousePressPoint,
    //  eventKey = '',
     hasSelectedPoints = this.hasSelectedPoints,
     constructAsSeries = this.constructAsSeries,
     proximityDistance = this.proximityDistance,
     pointNodeCollection = this.pointNodeCollection

    ) => {
     /**------------------GUARD STATEMENTS**/
     if (hasSelectedPoints) {
      return
     }
     const pointTapped = Public.getUserMouseClickOnPoint(
      mousePressPoint,
      proximityDistance,
      pointNodeCollection)
     if (pointTapped) {
      return
     }
     if (constructAsSeries) {
      return
     }
     /**------------------GET FINDINGS**/
     const findings = {
      // eventKey: eventKey
     }
     return findings
    },
    exicute: () => {
     this.logMessage('case 7 draw new detached line')

     this.defineEventFunction({
      mouseDragBegin: (mousePressPoint = {
       x: this.context.mouseX,
       y: this.context.mouseY
      }) => {
       makeNewLine(mousePressPoint.x, mousePressPoint.y)
       this.userPenPoint = this.lineCollection.slice(-1)[0].endPoint;
       this.pointNodeSnapList.list = this.getLinePointSnapList(this.userPenPoint);
      }
     })

     this.defineEventFunction({
      mouseDragContinue: (mouseDragPoint = {
       x: this.context.mouseX,
       y: this.context.mouseY
      }) => {
       dragMoveSelectedPoints(mouseDragPoint)
      }
     })

     this.defineEventFunction({
      mouseReleaseWithoutDrag: () => {
       if (this.getLineLength(this.lastLine) < this.minimumNewLineLength) {
        this.logMessage('     7a) new line length is too short; line command is canceled on this mouse press')
        this.deleteLastLine()
        return
       } else if (this.pointNodeSnapList.isInContactWith === null) {
        return
       }


       this.logMessage('     7b) new line input completed')
       const ln = this.getLinePointNodes(this.lastLine)

       if (ln.beginPointNode === this.pointNodeSnapList.isInContactWith &&
        ln.endPointNode === this.pointNodeSnapList.isInContactWith) {


       } else if (this.enableEndPointConnectToNodeUponMouseRelease) {
        this.logMessage('         7c)... with endPoint connected to node')
        this.connect(this.userPenPoint, this.pointNodeSnapList.isInContactWith)
       } else if (
        this.enableEndPointConnectToPointUponMouseRelease &&
        Public.isNodeKind(this.pointNodeSnapList.isInContactWith) == false) {

        this.logMessage('         7d)... with endPoint connected to point')

        this.connect(this.userPenPoint, this.pointNodeSnapList.isInContactWith)
       } else {
        this.logMessage('         7e)... with endPoint snap aligned to point without connection being made')
        this.lastLine.endPoint.x = this.pointNodeSnapList.isInContactWith.x
        this.lastLine.endPoint.y = this.pointNodeSnapList.isInContactWith.y
       }
       this.pointNodeSnapList.list = null;
       this.pointNodeSnapList.isInContactWith = null;

      }
     })
    }
   },
  }
  this.userInitializer = {
   evaluateRequirements: (nothingIsDrawnYet = this.lineCollection.length == 0) => {
    return nothingIsDrawnYet
   },
   exicute: (mousePressPoint) => {

    this.logMessage('init case: user to initialize line series')
    makeNewLine(mousePressPoint.x, mousePressPoint.y);
    beginDrawTriggered = true
    this.userPenPoint.x = mousePressPoint.x;
    this.userPenPoint.y = mousePressPoint.y;
    this.userPenPoint = this.lineCollection.slice(-1)[0].endPoint;
    this.defineEventFunction({
     mouseDragContinue: (mouseDragPoint = {
      x: this.context.mouseX,
      y: this.context.mouseY
     }) => {
      dragMoveSelectedPoints(mouseDragPoint)
     }
    })
    this.defineEventFunction({
     mouseRelease: () => {

      if (this.getLineLength(this.lastLine) < this.minimumNewLineLength) {
       this.logMessage('     1a) new line length is too short, not made')
       this.deleteLastLine()
       return
      } else if (beginDrawTriggered) {
       this.event.userEndedDrawNewLine()
      }
     }
    })


   },
  }
  this.mousePressSetup = (mousePressPoint) => {

   this.pointNodeSnapList.list = null;
   this.pointNodeSnapList.isInContactWith = null;
   this.setMousePressPoint(mousePressPoint)
  }
 } /** CLOSE CONSTRUCTOR */
 /**-----------------------GETTERS DEFINED BELOW---------------------------*/

 get hasLinesDrawn() {
  /** RETURN BOOL */
  return this.lineCollection.length > 0;
 }
 get nothingIsDrawnYet() {
  /** RETURN BOOL */
  return this.lineCollection.length === 0;
 }
 get lastLine() {
  /** RETURN LINE OR UNDEFINED */
  return this.lineCollection.slice(-1)[0];
 }
 get firstLine() {
  /** RETURN LINE OR UNDEFINED */
  return this.lineCollection[0];
 }
 get hasSelectedPoints() {
  /** RETURN BOOL */
  return this.selectedPoints.size > 0
 }
 get selectedPointCount() {
  /** RETURN NUMBER */
  return this.selectedPoints.size
 }
 get hasSelectedLines() {
  /** RETURN BOOL */
  return this.selectedLines.size > 0
 }
 get lineCount() {
  /** RETURN INT */
  return this.lineCollection.length
 }
 get selectedPointCollection() {
  /** RETURN ARRAY */
  return [...this.selectedPoints]
 }
 get pointNodeCollection() {
  const pointNodes = new Set()
  this.lineCollection.map(line => {
   const ln = this.getLinePointNodes(line)
   pointNodes.add(ln.beginPointNode)
   pointNodes.add(ln.endPointNode)
  })
  return [...pointNodes]
 }
 /**-------------------------------------------------------------------------*/
 /////////////////////////// GETTERS DEFINED BELOW////////////////////////////

 auditLinePen() {
  const overlappingLines = this.getLineOverlapIndexSet(this.lineCollection)
  const nonZeroLenghtLines = []
  const strandedNodeIndeces = new Set()
  for (let i = 0; i < this.nodeCollection.length; i++) {
   strandedNodeIndeces.add(i)
  }
  for (let i = 0; i < this.lineCollection.length; i++) {
   if (overlappingLines.has(i)) {
    continue
   }
   const bp = this.lineCollection[i].beginPoint
   const ep = this.lineCollection[i].endPoint
   // const ln = this.getLineNodes(this.lineCollection[i])
   if (Public.getDistanceTwoPoints(bp , ep ) != 0) {
    nonZeroLenghtLines.push(this.lineCollection[i])
   }
   if (bp.nodeIndex == undefined) {
    //EXIT
   } else {
    strandedNodeIndeces.delete(bp.nodeIndex)
   }
   if (ep.nodeIndex == undefined) {
    //EXIT
   } else {
    strandedNodeIndeces.delete(ep.nodeIndex)
   }
  }
  var lonelyNodes = new Set()
  var notLonelyNodes = new Set()
  for (let i = 0; i < nonZeroLenghtLines.length; i++) {
   const ln = this.getLineNodes(nonZeroLenghtLines[i])
   if (ln.beginNode == null) {
    //EXIT
   } else if (notLonelyNodes.has(ln.beginNode)) {
    //EXIT
   } else if (lonelyNodes.has(ln.beginNode)) {
    notLonelyNodes.add(ln.beginNode)
    lonelyNodes.delete(ln.beginNode)
   } else {
    lonelyNodes.add(ln.beginNode)
   }
   if (ln.endNode == null) {
    //EXIT
   } else if (notLonelyNodes.has(ln.endNode)) {
    //EXIT
   } else if (lonelyNodes.has(ln.endNode)) {
    notLonelyNodes.add(ln.endNode)
    lonelyNodes.delete(ln.endNode)
   } else {
    lonelyNodes.add(ln.endNode)
   }
  }
  for (let i = 0; i < nonZeroLenghtLines.length; i++) {
   const ln = this.getLineNodes(nonZeroLenghtLines[i])
   if (lonelyNodes.has(ln.beginNode)) {
    // delete node reference from line begin point
    nonZeroLenghtLines[i].beginPoint = this.freeLinePointFromNode(nonZeroLenghtLines[i].beginPoint)
   }
   if (lonelyNodes.has(ln.endNode)) {
    // delete node reference from line begin point
    nonZeroLenghtLines[i].endPoint = this.freeLinePointFromNode(nonZeroLenghtLines[i].endPoint)
   }
  }
  // lonly nodes are now stranded nodes; make them null
  for (let i = 0; i < this.nodeCollection.length; i++) {
   if (lonelyNodes.has(this.nodeCollection[i])) {
    this.nodeCollection[i] = null
   }
  }
  for (let i = 0; i < strandedNodeIndeces.size; i++) {
   this.nodeCollection[[...strandedNodeIndeces][i]] = null
  }
  this.lineCollection = nonZeroLenghtLines
  while (this.nodeCollection.slice(-1)[0] == null) {
   this.nodeCollection.pop()
  }
  this.setPointNodeTree()
 }

 getLineOverlapIndexSet(lineCollection) {
  /* RETURN ARRAY OF LINE DUPLICATES*/

  let i
  let pointAssocList = {}
  let lineDuplicates = new Set()
  let linesToPreserve = new Set()
  for (i = 0; i < lineCollection.length; i++) {
   const ln = lineCollection[i]
   const beginX = ln.beginPoint.x
   const endX = ln.endPoint.x
   const beginY = ln.beginPoint.y
   const endY = ln.endPoint.y
   const beginKey = 'x' + beginX.toString() + 'y' + beginY.toString()
   const endKey = 'x' + endX.toString() + 'y' + endY.toString()
   const key1 = beginKey + endKey
   const key2 = endKey + beginKey
   if (pointAssocList[key1] == undefined) {
    pointAssocList[key1] = [i]
   } else {
    pointAssocList[key1].push(i)
   }
   if (pointAssocList[key2] == undefined) {
    pointAssocList[key2] = [i]
   } else {
    pointAssocList[key2].push(i)
   }
  }

  for (const item in pointAssocList) {
   if (pointAssocList[item].length == 1) {
    continue
   }
   if (lineDuplicates.has(pointAssocList[item][0])) {
    continue
   }
   if (linesToPreserve.has(pointAssocList[item][0])) {
    continue
   }
   linesToPreserve.add(pointAssocList[item][0])
   for (i = 1; i < pointAssocList[item].length; i++) {
    if (linesToPreserve.has(pointAssocList[item][i]) == false) {
     lineDuplicates.add(pointAssocList[item][i])
    }
   }
  }
  return lineDuplicates
 }

 gatherConnectedNodes(fromLine) {
  // INPUT A LINE ARGUMENT AND THIS WILL RETURN A CONNECTED NODE COLLECTION SET
  ///RETURN VARIABLE:
  let nodeKeySet = new Set()
  this.setPointNodeTree()
  const populateNodeKeySet_recursively = (keyArray) => {
   let key = keyArray.shift(0)
   while (nodeKeySet.has(key)) {
    key = keyArray.shift(0)
    if (keyArray.length == 0) {
     return
    }
   }
   if (key == undefined) {
    return
   }
   nodeKeySet.add(key)
   let lineList = this.pointNodeTree[key]
   if (lineList == undefined) {
    lineList = []
   }

   function addUnique(item, intoArray) {
    if (nodeKeySet.has(item)) {
     return
    }
    intoArray.push(item)
   }
   for (let i = 0; i < lineList.length; i++) {
    const beginNodeIndex = lineList[i].beginPoint.nodeIndex
    const endNodeIndex = lineList[i].endPoint.nodeIndex
    if (beginNodeIndex !== undefined) {
     const BNodeKey = 'node_' + beginNodeIndex.toString()
     addUnique(BNodeKey, keyArray)
    }
    if (endNodeIndex !== undefined) {
     const ENodeKey = 'node_' + endNodeIndex.toString()
     addUnique(ENodeKey, keyArray)
    }
   }
   keyArray = keyArray.filter(key => nodeKeySet.has(key) == false)
   populateNodeKeySet_recursively(keyArray)
  }
  let startWithKeyArray = []
  if (fromLine.beginPoint.nodeIndex != null) {
   const BN_Key = 'node_' + fromLine.beginPoint.nodeIndex.toString()
   startWithKeyArray.push(BN_Key)
  } else if (fromLine.endPoint.nodeIndex != null) {
   const EN_Key = 'node_' + fromLine.endPoint.nodeIndex.toString()
   startWithKeyArray.push(EN_Key)
  }
  populateNodeKeySet_recursively(startWithKeyArray)
  return [...nodeKeySet]
 }

 getConnectedLineSetFromNodeKeyList(fromNodeKeyList) {
  var lineSet = new Set()
  for (let i = 0; i < fromNodeKeyList.length; i++) {
   const key = fromNodeKeyList[i]
   const ll = this.pointNodeTree[key]
   for (let j = 0; j < ll.length; j++) {
    lineSet.add(ll[j])
   }
  }
  return lineSet
 }

 getConnectedLineSet(fromLine) {
  const fromNodes = this.gatherConnectedNodes(fromLine)
  return this.getConnectedLineSetFromNodeKeyList(fromNodes)
 }
 setMousePressPoint(newPoint) {
  this.mousePressPoint.x = newPoint.x
  this.mousePressPoint.y = newPoint.y
 }
 setPointNodeTree() {
  const pointNodeTree = {}
  for (let i = 0; i < this.nodeCollection.length; i++) {
   const key = 'node_' + i.toString()
   pointNodeTree[key] = []
  }
  for (let i = 0; i < this.lineCollection.length; i++) {
   const refB = this.lineCollection[i].beginPoint.nodeIndex
   const refE = this.lineCollection[i].endPoint.nodeIndex
   if (refB != undefined) {
    const keyB = 'node_' + refB.toString()
    pointNodeTree[keyB].push(this.lineCollection[i])
   }
   if (refE != undefined) {
    const keyE = 'node_' + refE.toString()
    pointNodeTree[keyE].push(this.lineCollection[i])
   }
  }
  this.pointNodeTree = pointNodeTree;
 }

 freeLinePointFromNode(point) {
  if (point.nodeIndex == undefined) {
   return
  }
  const x = point.x
  const y = point.y
  delete point.x
  delete point.y
  delete point.nodeIndex
  point.x = x
  point.y = y
  return point
 }

 connectPointWithNode(point, nodeRef) {
  var i
  var index
  for (i = 0; i < this.nodeCollection.length; i++) {
   if (nodeRef === this.nodeCollection[i]) {
    index = i
   }
  }
  for (i = 0; i < this.lineCollection.length; i++) {
   if (this.lineCollection[i].beginPoint === point) {
    this.lineCollection[i].beginPoint = {
     get x() {
      return nodeRef.x
     },
     get y() {
      return nodeRef.y
     }
    }
    this.lineCollection[i].beginPoint.nodeIndex = index;
   }
   if (this.lineCollection[i].endPoint === point) {
    this.lineCollection[i].endPoint = {
     get x() {
      return nodeRef.x
     },
     get y() {
      return nodeRef.y
     }
    }
    this.lineCollection[i].endPoint.nodeIndex = index;
   }
  }
  this.setPointNodeTree()
 }

 mergeNodes(node, toNode) {
  var i
  var toNodeIndex
  this.nodeCollection.map(function (node, i) {
   if (node === toNode) {
    toNodeIndex = i
   }
  })
  for (i = 0; i < this.lineCollection.length; i++) {
   const ln = this.getLineNodes(this.lineCollection[i])
   if (ln.beginNode === node) {
    this.lineCollection[i].beginPoint = {
     get x() {
      return toNode.x
     },
     get y() {
      return toNode.y
     }
    }
    this.lineCollection[i].beginPoint.nodeIndex = toNodeIndex
   }
   if (ln.endNode === node) {
    this.lineCollection[i].endPoint = {
     get x() {
      return toNode.x
     },
     get y() {
      return toNode.y
     }
    }
    this.lineCollection[i].endPoint.nodeIndex = toNodeIndex
   }
  }
 }

 connect(thisPoint, toThisPoint) {
  var i
  if (Public.isNodeKind(thisPoint) && Public.isNodeKind(toThisPoint)) {
   this.mergeNodes(thisPoint, toThisPoint)
  } else if (thisPoint.kind != 'node' && toThisPoint.kind != 'node') {
   this.nodeCollection.push({
    x: toThisPoint.x,
    y: toThisPoint.y,
    kind: 'node'
   });
   var newNode = this.nodeCollection.slice(-1)[0]
   this.connectPointWithNode(thisPoint, newNode)
   this.connectPointWithNode(toThisPoint, newNode)
  } else if (thisPoint.kind == 'node') {
   thisPoint.x = toThisPoint.x
   thisPoint.y = toThisPoint.y
   this.connectPointWithNode(toThisPoint, thisPoint)
  } else if (toThisPoint.kind == 'node') {
   this.connectPointWithNode(thisPoint, toThisPoint)
  }
  this.auditLinePen()
 }

 deleteLastLine() {
  const lastLine = this.lineCollection.slice(-1)[0]
  const lastLineNodes = this.getLineNodes(lastLine)
  let beginNodeMatchingReferenceCount = 0
  let endNodeMatchingReferenceCount = 0
  let pointMatchingBeginNode
  let pointMatchingEndNode
  for (let i = 0; i < this.lineCollection.length - 1; i++) {
   const ofThisLine = this.lineCollection[i]
   const thisPointMatchingBeginNode = this.getLinePointMatchingNodeReference(ofThisLine, lastLineNodes.beginNode)
   const thisPointMatchingEndNode = this.getLinePointMatchingNodeReference(ofThisLine, lastLineNodes.endNode)

   if (thisPointMatchingBeginNode != null) {
    beginNodeMatchingReferenceCount++
    pointMatchingBeginNode = thisPointMatchingBeginNode
   }
   if (thisPointMatchingEndNode != null) {
    endNodeMatchingReferenceCount++
    pointMatchingEndNode = thisPointMatchingEndNode
   }
  }
  if (beginNodeMatchingReferenceCount == 1) {
   // REMOVE THE NEWLY CREATED NODE
   var selectPoint = this.freeLinePointFromNode(pointMatchingBeginNode)
   this.nodeCollection = this.nodeCollection.filter(item => item !== lastLineNodes.beginNode)
  }
  if (endNodeMatchingReferenceCount == 1) {
   // REMOVE THE NEWLY CREATED NODE
   var selectPoint = this.freeLinePointFromNode(pointMatchingEndNode)
   this.nodeCollection = this.nodeCollection.filter(item => item !== lastLineNodes.endNode)
  }
  // DELETE THE LAST LINE
  this.lineCollection.pop()
 }

 returnPointsArray() {
  var newArray = [];
  this.lineCollection.forEach(function (ln) {
   newArray.push(ln.beginPoint.x);
   newArray.push(ln.beginPoint.y);
  })
  newArray.push(this.lineCollection.slice(-1)[0].endPoint.x)
  newArray.push(this.lineCollection.slice(-1)[0].endPoint.y)
  return newArray;
 }

 getLinePointNodes(line) {
  return Public.getLinePointNodes(line, this.nodeCollection)
 }

 getLineNodes(line) {
  var ln = this.getLinePointNodes(line)
  var beginNode = null
  var endNode = null
  if (Public.isNodeKind(ln.beginPointNode))beginNode = ln.beginPointNode
  
  if (Public.isNodeKind(ln.endPointNode))endNode = ln.endPointNode
  
  return {
   beginNode: beginNode,
   endNode: endNode
  }
 }

 getLinePointMatchingNodeReference(thisLineHas, thisMatchingNodeReference) {
  if (thisMatchingNodeReference == null) {
   return null
  }
  const ln = this.getLinePointNodes(thisLineHas)
  if (ln.beginPointNode === thisMatchingNodeReference) {
   return thisLineHas.beginPoint
  }
  if (ln.endPointNode === thisMatchingNodeReference) {
   return thisLineHas.endPoint
  }
  return null
 }

 pointNodeIsMember(pointNode) {
  /** RETURN BOOL */
  let output = false
  this.lineCollection.map(line => {

   const ln = this.getLinePointNodes(line)
   if (ln.beginPointNode === pointNode) {
    output = true
    return true
   }
   if (ln.endPointNode === pointNode) {
    output = true
    return true
   }
  })
  return output
 }

//  isNodeKind(point) {
//   if (point === undefined) {
//    return false
//   }
//   if (point.kind === undefined) {
//    return false
//   }
//   return point.kind === 'node'
//  }

 syncSelectedSets() {
  for (let i = 0; i < this.selectedLines.size; i++) {
   const ln = this.getLinePointNodes([...this.selectedLines][i])
   this.selectedPoints.append(ln.beginPointNode);
   this.selectedPoints.append(ln.endPointNode);
  }
  const inverseSelectedLines = this.lineCollection.filter(ln => this.selectedLines.has(ln) == false)
  const pointList = []
  const populatePointList = (line) => {
   const ln = this.getLinePointNodes(line)
   if (this.selectedPoints.has(ln.beginPointNode) == false) {
    pointList.push(ln.beginPointNode)
   }
   if (this.selectedPoints.has(ln.endPointNode) == false) {
    pointList.push(ln.endPointNode)
   }
   return null
  }
  inverseSelectedLines.map(line => populatePointList(line))
  this.elegableSnapPoints = {}
  const mapElegableSnapPoints = (point) => {
   const x = range_Round5(point.x)
   if (this.elegableSnapPoints[x.low] == undefined) {
    this.elegableSnapPoints[x.low] = [point]
   } else {
    this.elegableSnapPoints[x.low].push(point)
   }

   if (this.elegableSnapPoints[x.mid] == undefined) {
    this.elegableSnapPoints[x.mid] = [point]
   } else {
    this.elegableSnapPoints[x.mid].push(point)
   }

   if (this.elegableSnapPoints[x.high] == undefined) {
    this.elegableSnapPoints[x.high] = [point]
   } else {
    this.elegableSnapPoints[x.high].push(point)
   }
   const y = range_Round5(point.y)
   if (this.elegableSnapPoints[y.low] == undefined) {
    this.elegableSnapPoints[y.low] = [point]
   } else {
    this.elegableSnapPoints[y.low].push(point)
   }

   if (this.elegableSnapPoints[y.mid] == undefined) {
    this.elegableSnapPoints[y.mid] = [point]
   } else {
    this.elegableSnapPoints[y.mid].push(point)
   }

   if (this.elegableSnapPoints[y.high] == undefined) {
    this.elegableSnapPoints[y.high] = [point]
   } else {
    this.elegableSnapPoints[y.high].push(point)
   }
  }
  pointList.map(pt => mapElegableSnapPoints(pt))
 }

 findSnapPoint() {
  if (this.elegableSnapPoints == {}) {
   return null
  } else if (this.elegableSnapPoints == undefined) {
   return null
  }
  let closestDistance = this.nodeSnapProximityDistance
  let pointInContact = null
  let selectedPointInContact = null
  let i = 0
  let matchingPoints = []
  let snapPoints = null

  function pointsMatch(list) {
   if (list == undefined) {
    return false
   }
   matchingPoints = matchingPoints.concat(list)
   return true
  }

  function getClosestDistance(point1, point2) {
   const dist = Public.getDistanceTwoPoints(point1 , point2 )
   if (dist < closestDistance) {
    snapPoints = [point1, point2]
    closestDistance = dist
   }
  }

  const getMatch = (ofPoint) => {
    i++
    if (i == 0) {
     return
    }
    matchingPoints = []
    const x = range_Round5(ofPoint.x)
    const xLow = this.elegableSnapPoints[x.low]
    const xMid = this.elegableSnapPoints[x.mid]
    const xHigh = this.elegableSnapPoints[x.high]
    const y = range_Round5(ofPoint.y)
    const yLow = this.elegableSnapPoints[y.low]
    const yMid = this.elegableSnapPoints[y.mid]
    const yHigh = this.elegableSnapPoints[y.high]
    const thereAreXMatchingPoints =
     pointsMatch(xLow) ||
     pointsMatch(xMid) ||
     pointsMatch(xHigh)
    const thereAreYMatchingPoints =
     pointsMatch(yLow) ||
     pointsMatch(yMid) ||
     pointsMatch(yHigh)
    if (thereAreXMatchingPoints && thereAreYMatchingPoints) {
     matchingPoints.map(pt2 => getClosestDistance(ofPoint, pt2))
    }
    if (snapPoints != null) {
     pointInContact = snapPoints[0]
     selectedPointInContact = snapPoints[1]
    }
   }
   [...this.selectedPoints].map(pt => getMatch(pt))
  this.pointNodeSnapList.isInContactWith = pointInContact
  this.pointNodeSnapList.selectedPoint = selectedPointInContact
 }

 getPointOnTarget(inputX, inputY, pointList, closeEnoughFactor) {
  if (pointList == undefined) {
   return null
  } else if (pointList == null) {
   return null
  } else if (pointList.length == 0) {
   return null
  }
  var closestDist = closeEnoughFactor
  var foundPoint = null
  pointList.map(point => {
   const thisPointDist = Public.getDistanceTwoPoints({x:inputX, y:inputY}, point )
   if (thisPointDist <= closestDist) {
    closestDist = thisPointDist
    foundPoint = point
   }
  })
  return foundPoint
 }
 getLineLength(ln) {
  if (ln == undefined) {
   return 0
  } else if (ln == null) {
   return 0
  }
  return Public.getDistanceTwoPoints(ln.beginPoint , ln.endPoint )
 }

 getLinePointSnapList(selectedPoint) {
  if (this.enableSnap == false) {
   return
  }
  return this.getPointList().filter(item => item !== selectedPoint)
 }

 getPointList(lineCollection = this.lineCollection) {
  var i
  var pointList = new Set();
  for (i = 0; i < lineCollection.length; i++) {
   var ln = this.getLinePointNodes(lineCollection[i])
   pointList.add(ln.beginPointNode)
   pointList.add(ln.endPointNode)
  }
  return [...pointList]
 }

 ////////////////////////////////////////////////////////////////////////////
 snapMovePointsToPoint(point, snapToPoint, pointCollection) {
  const xDist = point.x - snapToPoint.x
  const yDist = point.y - snapToPoint.y

  pointCollection.map(point => {
   point.x = point.x + xDist;
   point.y = point.y + yDist
  })
 }
 ////////////////////////////////////////////////////////////////////////////
 drawLoop() {
  if(!this.context)return
  this.context.cursor()
  if (this.cursorLineSwiper) {
   this.cursorLineSwiper.draw()
  }

  this.drawLineCollection()
  this.drawPoints()
  this.drawPointFieldMarks()
  this.drawSelectedLines()
  this.drawNodes()
  this.drawSnapCaptureIndicator()
  this.drawMousePressTick()
  this.drawSelectedPoints()
  this.drawCursorTimer()

 }
 //CLOSE drawLineSequence
 ////////////////////////////////////////////////////////////////////////////
 drawCursorTimer() {
  if (this.cursorTimer) {} else {
   return
  }
  if (this.cursorTimer.isActive()) {} else {
   return
  }
  this.cursorTimer.draw()
 }

 drawSelectedPoints() {
  for (let i = 0; i < this.selectedPoints.size; i++) {
   State.drawPointCaptureHalo(
    this.context,
    /*  atPoint         */
    [...this.selectedPoints][i],
    /*  rgbColorString  */
    this.selectedPointColor,
    /*  haloRadius      */
    5,
    /*  haloLineWeight  */
    1.5
   )
  }
 }
 // State.drawPointCaptureHalo(atPoint, rgbColorString, haloRadius, haloLineWeight = .5) {
 //     this.context
 //     .stroke(rgbColorString)
 //     .noFill()
 //     .strokeWeight(haloLineWeight)
 //     .circle(atPoint.x, atPoint.y, haloRadius)
 // }
 drawMousePressTick() {
  if(!this.mousePressPoint.x)return
  const mousePressPoint = this.mousePressPoint
  this.context
   .strokeWeight(.5)
   .stroke('rgba(0%, 0%, 100%, 0.5)')
   .line(mousePressPoint.x - 3, mousePressPoint.y,
    mousePressPoint.x + 3, mousePressPoint.y)
   .line(mousePressPoint.x, mousePressPoint.y - 3,
    mousePressPoint.x, mousePressPoint.y + 3)
 }

 drawSnapCaptureIndicator() { 
  if (this.pointNodeSnapList == undefined) return
  if (this.pointNodeSnapList == null) return
  if (this.pointNodeSnapList.isInContactWith == undefined) return
  if (this.pointNodeSnapList.isInContactWith == null) return
  this.context
    .fill(0, 15, 255, 255)
    .strokeWeight(1)
  State.drawPointCaptureHalo(
    this.context,
    /*  atPoint         */
    this.pointNodeSnapList.isInContactWith,
    /*  rgbColorString  */
    'rgba(50%, 50%, 100%, 0.5)',
    /*  haloRadius      */
    15)
 }


 drawNodes() {
   this.nodeCollection.forEach(node => {
     if (node == null) return
     if (node.x != undefined) this.drawNode(node)
   })
 }

 drawLineCollection() {
  if (this.lineCollection.length == 0)return
  this.lineCollection.forEach(ln => {
   if (this.getLineLength(ln) > this.minimumNewLineLength) {
    this.drawLine(ln.beginPoint.x, ln.beginPoint.y, ln.endPoint.x, ln.endPoint.y)
   }
  })
 }

 drawSelectedLines() {
  [...this.selectedLines].map(ln => {
   this.context
    .stroke(this.selectedPointColor)
    .line(ln.beginPoint.x, ln.beginPoint.y, ln.endPoint.x, ln.endPoint.y)
  })
 }
 drawPointFieldMarks() {
  if (this.selectedPoints.size > 0 || this.lineCollection.length == 0) {
   return
  } else if (this.constructAsSeries == false) {
   return
  }
  const drawPointDrawEnabledMark = (atPoint, tickSize = 5) => {
   this.context
    .stroke('rgba(0%, 100%, 100%, 0.5)')
    .noFill()
    .circle(atPoint.x, atPoint.y, 10)
    .line(atPoint.x - 5, atPoint.y, atPoint.x + 5, atPoint.y)
    .line(atPoint.x - tickSize, atPoint.y,
     atPoint.x + tickSize, atPoint.y)
    .line(atPoint.x, atPoint.y - tickSize,
     atPoint.x, atPoint.y + tickSize)
  }
  this.lineCollection.map(ln => {
   const ln2 = this.getLinePointNodes(ln);
   if (this.getLineLength(ln) < this.minimumNewLineLength) {
    return
   }
   if (Public.isNodeKind(ln2.beginPointNode) == false) {
    drawPointDrawEnabledMark(ln2.beginPointNode)
   }
   if (Public.isNodeKind(ln2.endPointNode) == false) {
    drawPointDrawEnabledMark(ln2.endPointNode)
   }
  })
 }
 drawPoints() {
  const pointList = this.getPointList()
  pointList.map(pt => {
   this.drawPoint(pt);
  })
 }

 clearSelectedPoints() {
  this.selectedPoints.removeAll()
  // 
  this.selectedLines.clear()
 }

 selectAll() {
  this.lineCollection.map(line => this.selectedLines.append(line))
  this.syncSelectedSets()
 }

 insertLine(line) {
  this.lineCollection.push(line)
 }
 // toJSONx(){
 //     let selectedList
 //     if(this.hasSelectedLines || this.hasSelectedPoints){ 
 //         selectedList = this.lineCollection.map(line =>{
 //             const lineSelected = this.selectedLines.has(line)
 //             const ln = this.getLinePointNodes(line)
 //             const beginPointSelected = this.selectedPoints.has(ln.beginPointNode)
 //             const endPointSelected = this.selectedPoints.has(ln.endPointNode)
 //             return {
 //                 line : lineSelected,
 //                 beginPointNode : beginPointSelected,
 //                 endPointNode : endPointSelected
 //             }
 //         })
 //     }
 //     const returnVal = {
 //         'lineCollection': JSON.stringify(this.lineCollection),
 //         'nodeCollection': JSON.stringify(this.nodeCollection),
 //         'constructAsSeries' : JSON.stringify(this.constructAsSeries),
 //         'enableDrawLine' : JSON.stringify(this.enableDrawLine),
 //         'enableLineSelection' : JSON.stringify(this.enableLineSelection),
 //         'lineCountLimit' : JSON.stringify(this.lineCountLimit),
 //         'proximityDistance' : JSON.stringify(this.proximityDistance),
 //         'minimumNewLineLength' : JSON.stringify(this.minimumNewLineLength),
 //     }
 //     if(selectedList){
 //         returnVal['selectionSets'] = JSON.stringify(selectedList)
 //     }
 //     return returnVal
 // }


 insert(lineCollection, nodeCollection) {
  this.lineCollection = lineCollection
  this.nodeCollection = nodeCollection
  for (let i = 0; i < this.lineCollection.length; i++) {
   const line = this.lineCollection[i]
   const beginNodeIndex = line.beginPoint.nodeIndex
   if (beginNodeIndex !== undefined && beginNodeIndex !== null) {
    this.connectPointWithNode(
     line.beginPoint,
     this.nodeCollection[beginNodeIndex]
    )
   }
   const endNodeIndex = line.endPoint.nodeIndex
   if (endNodeIndex !== undefined && endNodeIndex !== null) {
    this.connectPointWithNode(
     line.endPoint,
     this.nodeCollection[endNodeIndex]
    )
   }
  }
 }


}



/**        this.enableDrawLine = true;
        this.enableLineSelection = true;
        this.enablePointSelection = true;
        this.enablePointMove = true;
        this.excludePointSelectionSet = new Set();
        this.enableSnap = true
        this.enableCursorTimedCommandSwitch = true
        this.enableEndPointConnectToNodeUponMouseRelease = true
        this.enableEndPointConnectToPointUponMouseRelease = true
        this.constructAsSeries = false;
        this.lineCountLimit = 0;

        this.proximityDistance = 5
        this.minimumNewLineLength = 5 */
