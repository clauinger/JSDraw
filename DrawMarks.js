/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

const {log} = console

const DEFAULT_COLOR = 'rgba(0,0,0,.4)'

export const DrawMark = {

  pointCaptureHalo: (context, atPoint, color = DEFAULT_COLOR, haloRadius = 5, haloLineWeight = 2) => {
    context
      .stroke(color)
      .noFill()
      .strokeWeight(haloLineWeight)
      .circle(atPoint.x, atPoint.y, haloRadius)
      .strokeWeight(1)
  },

  tickCrossMark: (context, atPoint, color = DEFAULT_COLOR, dimension = 10, lineWeight = 1) => {
    dimension *= 0.5
    context
      .stroke(color)
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

  pointMark : (context,atPoint, tickSize = 5, color = DEFAULT_COLOR) => {
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