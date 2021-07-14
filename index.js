/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

import { JSDraw } from './WorkSpace.js'

const {log} = console

const buttonList = [{
  button: Line_button,
  pen: 'lineShapePen'
}, {
  button: Arc_button,
  pen: 'arcLineShapePen'
}, {
  button: Circle_button,
  pen: 'circleSeriesPen'
}, {
  button: Line_Collection_button,
  pen: 'lineCollectionPen'
}, {
  button: Line_Series_button,
  pen: 'lineSeriesPen'
}, {
  button: Bezier_Shape_button,
  pen: 'bezierShapePen'
}, {
  button: Arc_Shape_button,
  pen: 'arcShapePen'
}, {
  button: Composite_button,
  pen: 'compositePen'
}, {
  button: Universal_button,
  pen: 'universalShapePen'
}, {
  button: Vector_button,
  pen: 'multiShapePen_01'
}
]

const drawing = JSDraw('drawBox')

let checkedButton

buttonList.forEach(buttonAndPen => {
  const {
    button,
    pen
  } = buttonAndPen
  button.addEventListener('change', x => {
    drawing.currentPen = pen
    if(checkedButton)checkedButton.parentElement.className = ''
    button.parentElement.className = 'selected'
  })
  if (button.checked) {
    drawing.currentPen = pen
    checkedButton = button
    checkedButton.parentElement.className = 'selected'
  }
})

startRecording.addEventListener('click', () => {
  drawing.startRecording()
})

stopRecording.addEventListener('click', () => {
  drawing.stopRecording()
})

play.addEventListener('click', () => {
  drawing.playRecording()
  log(drawing.JSONRecord)
  str = drawing.JSONRecord
})