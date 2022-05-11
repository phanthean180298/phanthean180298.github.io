export const pointInRect = (
  position: { x: number; y: number },
  x: number,
  y: number,
  width: number,
  height: number
) => {
  return (
    position.x > x &&
    position.x < x + width &&
    position.y > y &&
    position.y < y + height
  );
};
