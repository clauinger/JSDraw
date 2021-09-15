//**-----------------------------------------------------------  */
//** EVERYTHING INTERFACING WITH THE DOM GOES HERE         */
//**-----------------------------------------------------------  */

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
}, {
  button: ShapeCut_button,
  pen: 'shapeCutLinePen'
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

const setBg = () => {
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  document.body.style.backgroundColor = "#" + randomColor;
}


// container.addEventListener('touchmove', function(e) {
//   if(e.target.className === 'p5Canvas'){
//     e.preventDefault();
//   }
// }, false);

