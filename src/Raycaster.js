// Raycaster.js
// Cast rays and return an array of ray data: {angle, distance, hitX, hitY, wasHitVertical, hitOffset}

export function castRays(playerX, playerY, playerAngle, mapWidth, mapHeight, unusedMap, lastEditorUsed, mapData) {
  const screenWidth = 320;
  const fov = Math.PI / 3; 
  const halfFov = fov / 2;
  const numRays = screenWidth;
  const angleStep = fov / numRays;
  const maxDepth = 20; 
  const stepSize = 0.1;

  const rays = [];

  for (let i = 0; i < numRays; i++) {
    const rayAngle = playerAngle - halfFov + i * angleStep;
    const eyeX = Math.cos(rayAngle);
    const eyeY = Math.sin(rayAngle);

    let distanceToWall = 0;
    let hitWall = false;
    let hitX = 0;
    let hitY = 0;
    let wasHitVertical = false;

    while (!hitWall && distanceToWall < maxDepth) {
      distanceToWall += stepSize;
      const testX = playerX + eyeX * distanceToWall;
      const testY = playerY + eyeY * distanceToWall;

      // Check if out of bounds
      if (!isWithinBounds(testX, testY, mapWidth, mapHeight)) {
        hitWall = true;
        distanceToWall = maxDepth;
        hitX = testX;
        hitY = testY;
      } else {
        // Check if hitting a wall depending on editor type
        if (isWallAt(testX, testY, lastEditorUsed, mapData)) {
          hitWall = true;
          hitX = testX;
          hitY = testY;
          // Determine if vertical or horizontal
          const mx = testX | 0;
          const my = testY | 0;
          const distX = Math.abs(testX - (mx + 0.5));
          const distY = Math.abs(testY - (my + 0.5));
          wasHitVertical = distX > distY;
        }
      }
    }

    // Compute hitOffset for texture:
    let hitOffset = 0;
    if (wasHitVertical) {
      // Vertical wall hit: use fractional Y
      hitOffset = hitY - Math.floor(hitY);
    } else {
      // Horizontal wall hit: use fractional X
      hitOffset = hitX - Math.floor(hitX);
    }
    if (hitOffset < 0) hitOffset += 1;

    rays.push({
      angle: rayAngle,
      distance: distanceToWall,
      hitX: hitX,
      hitY: hitY,
      wasHitVertical: wasHitVertical,
      hitOffset: hitOffset
    });
  }

  return rays;
}

function isWithinBounds(x, y, mapWidth, mapHeight) {
  return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
}

function isWallAt(x, y, lastEditorUsed, mapData) {
  if (lastEditorUsed === 'standard') {
    const mx = x | 0;
    const my = y | 0;
    if (my < 0 || mx < 0 || my >= mapData.cells.length || mx >= mapData.cells[0].length) return true;
    return mapData.cells[my][mx] === 1;
  } else {
    // Subdiv map check
    return subdivIsWall(mapData.root, x, y);
  }
}

function subdivIsWall(cell, x, y) {
  if (!cell.subdivided) {
    return cell.cellType === 'wall';
  } else {
    for (let ch of cell.children) {
      if (x >= ch.x && x < ch.x + ch.width && y >= ch.y && y < ch.y + ch.height) {
        return subdivIsWall(ch, x, y);
      }
    }
    // If out of any children range
    return true;
  }
}
