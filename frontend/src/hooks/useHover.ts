import { useState } from 'react'

// Hover and keyboard-focus state for inline-styled controls, which cannot use :hover.
export function useHover() {
  const [hovered, setHovered] = useState(false)
  return {
    hovered,
    hoverProps: {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
    },
  }
}
