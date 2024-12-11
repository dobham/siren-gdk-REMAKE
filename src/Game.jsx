// https://permadi.com/1996/05/ray-casting-tutorial-11/

import React, { useRef, useEffect, useState } from 'react';
import { castRays } from './Raycaster';
import { loadProjectData } from './Database';

function Game({ projectName, onBackToMenu }) {
  const canvasRef3D = useRef(null);
  const canvasRefMap = useRef(null);

  // Load project data (map, player position)
  const projectData = loadProjectData(projectName);
  const map = projectData.map;
  const startX = projectData.playerX || 3;
  const startY = projectData.playerY || 3;

  // Player state as React state
  const [playerX, setPlayerX] = useState(startX);
  const [playerY, setPlayerY] = useState(startY);
  const [playerAngle, setPlayerAngle] = useState(0);

  const screenWidth = 320;
  const screenHeight = 200;
  const mapScale = 8; 

  // Store texture columns once loaded
  const [textureColumns, setTextureColumns] = useState([]);

  // Refs to hold the current player state for the animation loop
  const playerXRef = useRef(playerX);
  const playerYRef = useRef(playerY);
  const playerAngleRef = useRef(playerAngle);

  // Update refs whenever state changes
  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);

  useEffect(() => {
    playerAngleRef.current = playerAngle;
  }, [playerAngle]);

  // Load and precompute texture columns once
  useEffect(() => {
    const img = new Image();
    // https://permadi.com/tutorial/webgraph/index.html# 
    img.src = '/textures/text2.jpg'; 
    img.onload = () => {
      const textureWidth = 64;
      const textureHeight = 64;

      const texCanvas = document.createElement('canvas');
      texCanvas.width = textureWidth;
      texCanvas.height = textureHeight;
      const tctx = texCanvas.getContext('2d');
      tctx.drawImage(img, 0, 0, textureWidth, textureHeight);

      const newTextureColumns = [];
      for (let x = 0; x < textureWidth; x++) {
        const colCanvas = document.createElement('canvas');
        colCanvas.width = 1;
        colCanvas.height = textureHeight;
        const cctx = colCanvas.getContext('2d');
        const columnData = tctx.getImageData(x, 0, 1, textureHeight);
        cctx.putImageData(columnData, 0, 0);
        newTextureColumns.push(colCanvas);
      }
      setTextureColumns(newTextureColumns);
    };
  }, []);

  // Single animation loop that doesn't depend on changing state
  useEffect(() => {
    if (textureColumns.length === 0) return;
    let animationId;

    const animate = () => {
      const px = playerXRef.current;
      const py = playerYRef.current;
      const pAngle = playerAngleRef.current;

      const rays = castRays(px, py, pAngle, map[0].length, map.length, map);

      const canvas3D = canvasRef3D.current;
      const ctx3D = canvas3D.getContext('2d');
      draw3DView(ctx3D, rays);

      const canvasMap = canvasRefMap.current;
      const ctxMap = canvasMap.getContext('2d');
      drawTopDownMap(ctxMap, rays);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [map, textureColumns]);

  // Add key listener once
  useEffect(() => {
    const handleKeyDown = (e) => {
      const moveSpeed = 0.21;
      const rotSpeed = 0.069;
      let newX = playerXRef.current;
      let newY = playerYRef.current;
      let newAngle = playerAngleRef.current;

      if (e.key === 'ArrowUp') {
        newX += Math.cos(newAngle) * moveSpeed;
        newY += Math.sin(newAngle) * moveSpeed;
      }
      if (e.key === 'ArrowDown') {
        newX -= Math.cos(newAngle) * moveSpeed;
        newY -= Math.sin(newAngle) * moveSpeed;
      }
      if (e.key === 'ArrowLeft') {
        newAngle -= rotSpeed;
      }
      if (e.key === 'ArrowRight') {
        newAngle += rotSpeed;
      }

      if (!isWall(newX, newY)) {
        setPlayerX(newX);
        setPlayerY(newY);
      }
      setPlayerAngle(newAngle);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function isWall(x, y) {
    const mx = x | 0;
    const my = y | 0;
    if (mx < 0 || mx >= map[0].length || my < 0 || my >= map.length) return true;
    return map[my][mx] === 1;
  }

  function draw3DView(ctx, rays) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Draw floor
    ctx.fillStyle = '#222';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    const textureWidth = 64;

    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      const distance = ray.distance;
      const ceiling = (screenHeight / 2) - (screenHeight / distance);
      const floor = screenHeight - ceiling;
      const columnHeight = floor - ceiling;

      let textureX;
      if (ray.wasHitVertical) {
        textureX = ray.hitY % 1;
      } else {
        textureX = ray.hitX % 1;
      }
      if (textureX < 0) textureX += 1;

      const texColumn = (textureX * textureWidth) | 0;
      const columnCanvas = textureColumns[texColumn];

      ctx.drawImage(
        columnCanvas,
        0, 0, 1, 64,
        i, ceiling, 1, columnHeight
      );
    }
  }

  function drawTopDownMap(ctx, rays) {
    const width = map[0].length * mapScale;
    const height = map.length * mapScale;
    ctx.clearRect(0, 0, width, height);

    // Draw map
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        ctx.fillStyle = map[y][x] === 1 ? '#444' : '#000';
        ctx.fillRect(x * mapScale, y * mapScale, mapScale, mapScale);
      }
    }

    // Draw player
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(playerXRef.current * mapScale, playerYRef.current * mapScale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw rays on map
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      const endX = playerXRef.current + Math.cos(ray.angle) * ray.distance;
      const endY = playerYRef.current + Math.sin(ray.angle) * ray.distance;
      ctx.moveTo(playerXRef.current * mapScale, playerYRef.current * mapScale);
      ctx.lineTo(endX * mapScale, endY * mapScale);
    }
    ctx.stroke();
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Project: {projectName}</h3>
      <div style={{ border: '1px solid #555', width: screenWidth, margin: '0 auto' }}>
        <canvas ref={canvasRef3D} width={screenWidth} height={screenHeight} />
      </div>
      <div style={{ border: '1px solid #555', width: map[0].length * mapScale, height: map.length * mapScale, margin: '0 auto' }}>
        <canvas ref={canvasRefMap} width={map[0].length * mapScale} height={map.length * mapScale} />
      </div>
      <div>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    </div>
  );
}

export default Game;
