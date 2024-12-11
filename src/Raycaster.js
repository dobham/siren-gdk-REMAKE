export function castRays(playerX, playerY, playerAngle, MAP_WIDTH, MAP_HEIGHT, map) {
  const screenWidth = 320;
  const fov = Math.PI / 3; 
  const halfFov = fov / 2;
  const numRays = screenWidth;
  const angleStep = fov / numRays;
  const maxDepth = 20; 
  const stepSize = 0.1; // Increase stepSize slightly for fewer steps, also speeds up calculation a bit

  // Precompute player position and angle related
  const px = playerX;
  const py = playerY;

  const rays = [];

  for (let i = 0; i < numRays; i++) {
    const rayAngle = playerAngle - halfFov + i * angleStep;
    // Precompute cos & sin once per ray
    const eyeX = Math.cos(rayAngle);
    const eyeY = Math.sin(rayAngle);

    let distanceToWall = 0;
    let hitWall = false;
    let hitX = 0;
    let hitY = 0;
    let wasHitVertical = false;

    // Early exit conditions:
    // If we find a wall at a very short distance, we break immediately.
    // Also, we break once a wall is found, no extra computations needed.
    while (!hitWall && distanceToWall < maxDepth) {
      distanceToWall += stepSize;

      const checkX = px + eyeX * distanceToWall;
      const checkY = py + eyeY * distanceToWall;

      // Convert to int using bitwise truncation
      const mx = checkX | 0;
      const my = checkY | 0;

      // Out of bounds
      if (mx < 0 || mx >= MAP_WIDTH || my < 0 || my >= MAP_HEIGHT) {
        hitWall = true;
        distanceToWall = maxDepth;
        hitX = checkX;
        hitY = checkY;
        break; // Early exit
      }

      // Check if we hit a wall
      if (map[my][mx] === 1) {
        hitWall = true;
        hitX = checkX;
        hitY = checkY;

        // Determine if vertical or horizontal wall was hit
        const distX = Math.abs(checkX - mx - 0.5);
        const distY = Math.abs(checkY - my - 0.5);
        wasHitVertical = distX > distY;

        // Extremely close wall hit (not always necessary but can break early)
        if (distanceToWall < stepSize * 2) {
          break; // no need to refine more
        }
      }
    }

    rays.push({
      angle: rayAngle,
      distance: distanceToWall,
      hitX: hitX,
      hitY: hitY,
      wasHitVertical: wasHitVertical
    });
  }

  return rays;
}
