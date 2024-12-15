export function getWallTextureColumn(distance, wallHeight, column) {
  // Simple pseudo-texture based on distance
  const baseColor = distance < 3 ? "#999" : "#555";
  const columnColors = [];
  for (let i = 0; i < wallHeight; i++) {
    columnColors.push(baseColor);
  }
  return columnColors;
}
