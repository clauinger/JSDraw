//**-----------------------------------------------------------  */
//** EVERYTHING INTERFACING WITH THE DOM GOES HERE         */
//**-----------------------------------------------------------  */

/*jshint esversion: 6 */
/*jshint asi: true */
/* jshint expr: true */

import { JSDraw , make3DDisplay } from './WorkSpace.js'

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
}, {
  button: ShapeCut_button,
  pen: 'shapeCutLinePen'
}, {
  button: RectCutArray_button,
  pen: 'rectCutArrayPen'
}, {
  button: RectCutShape_button,
  pen: 'rectCutShapePen'
}
]

const drawing = JSDraw('drawRect')

let checkedButton

buttonList.forEach(buttonAndPen => {
  const {
    button,
    pen
  } = buttonAndPen


  button.addEventListener('change', x => {
    drawing.currentPenKey = pen
    if(checkedButton)checkedButton.parentElement.className = ''
    button.parentElement.className = 'selected'
  })
  if (button.checked) {
    drawing.currentPenKey = pen
    checkedButton = button
    checkedButton.parentElement.className = 'selected'
  }
})

const setBg = () => {
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  document.body.style.backgroundColor = "#" + randomColor;
}


startRecording.addEventListener('click', () => {
  log('startRecording')
  drawing.startRecording()
})

stopRecording.addEventListener('click', () => {
  drawing.stopRecording()
})

play.addEventListener('click', () => {
  const isPlaying = drawing.togglePlayBack(JSON.parse(outputText.value))
  play.innerHTML = isPlaying ? 'Stop' : 'Play'
}) 

make3DDisplay(perspectiveDisplay, drawing)

