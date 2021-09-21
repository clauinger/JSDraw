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


// container.addEventListener('touchmove', function(e) {
//   if(e.target.className === 'p5Canvas'){
//     e.preventDefault();
//   }
// }, false);

let sketch = function(p) {
  p.setup = function(){
    p.createCanvas(400,400,p.WEBGL)
    p.background(0);
  }
  p.draw = function (){
    if(!drawing.currentPen.getClosedShapeCollection)return 
    const closedShapes  = drawing.currentPen.getClosedShapeCollection()
    p.background(100)
    const ORBIT_LEVEL = 3
    p.orbitControl(ORBIT_LEVEL,ORBIT_LEVEL,ORBIT_LEVEL)
    p.scale(0.5)

    p.translate((p.width / 2) * -1, (p.height / 2) * -1)
    if(!closedShapes)return
    closedShapes.forEach((closedShape,i)=>{
      const color = i === 0 ? 200: 'white'
      p.fill(color)
      p.beginShape();
      p.translate(0, 0, 15)
      // z++
      if(!closedShape)return
      closedShape.forEach(pt=>{
        p.vertex(pt.x, pt.y)
      })
      p.endShape(p.CLOSE);
    })
    // if(autoRotateView)angle += 0.009
  }
};

// new p5(sketch, perspectiveDisplay);

make3DDisplay(perspectiveDisplay, drawing)

// function make3DDisplay (container, width = 400, height = 400){
//   let sketch = function(p) {
//     p.setup = function(){
//       p.createCanvas(width,height,p.WEBGL)
//       p.background(0);
//     }
//     p.draw = function (){
//       if(!drawing.currentPen.getClosedShapeCollection)return 
//       const closedShapes  = drawing.currentPen.getClosedShapeCollection()
//       p.background(100)
//       const ORBIT_LEVEL = 3
//       p.orbitControl(ORBIT_LEVEL,ORBIT_LEVEL,ORBIT_LEVEL)
//       p.scale(0.5)
  
//       p.translate((p.width / 2) * -1, (p.height / 2) * -1)
//       if(!closedShapes)return
//       closedShapes.forEach((closedShape,i)=>{
//         const color = i === 0 ? 200: 'white'
//         p.fill(color)
//         p.beginShape();
//         p.translate(0, 0, 15)
//         // z++
//         if(!closedShape)return
//         closedShape.forEach(pt=>{
//           p.vertex(pt.x, pt.y)
//         })
//         p.endShape(p.CLOSE);
//       })
//       // if(autoRotateView)angle += 0.009
//     }
//   };
//   new p5(sketch, container);
// }