// The pointer position, shared by the 3D scene and tilt effects without React re-renders.
// Read `pointer` inside an animation frame.

export const pointer = {
  // -1 at the left or top edge of the viewport, 1 at the right or bottom edge.
  x: 0,
  y: 0,
  // Viewport pixels.
  clientX: 0,
  clientY: 0,
  // True once the pointer has moved, so idle scenes do not jump to a corner.
  active: false,
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
      pointer.clientX = event.clientX
      pointer.clientY = event.clientY
      pointer.active = true
    },
    { passive: true },
  )
}
