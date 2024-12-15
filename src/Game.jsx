import React, { useRef, useEffect, useState } from 'react';
import { castRays } from './Raycaster';
import { loadProjectData } from './Database';

function Game({ projectName, onBackToMenu }) {
  const canvasRef3D = useRef(null);
  const canvasRefMap = useRef(null);

  const data = loadProjectData(projectName);
  const lastEditorUsed = data.lastEditorUsed || 'standard';

  let map, playerX, playerY;
  if (lastEditorUsed === 'standard') {
    map = data.standardMap;
    playerX = map.playerX;
    playerY = map.playerY;
  } else {
    // subdiv
    map = data.subdivMap;
    playerX = map.playerX;
    playerY = map.playerY;
  }

  const [px, setPX] = useState(playerX);
  const [py, setPY] = useState(playerY);
  const [pAngle, setPAngle] = useState(0);

  const screenWidth = 320;
  const screenHeight = 200;
  const mapScale = 8; 

  // texture loading as before
  const [textureColumns, setTextureColumns] = useState([]);

  useEffect(() => {
    const img = new Image();
    img.src = '/textures/text1.jpg'; 
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

  const pxRef = useRef(px);
  const pyRef = useRef(py);
  const pAngleRef = useRef(pAngle);

  useEffect(() => { pxRef.current = px; }, [px]);
  useEffect(() => { pyRef.current = py; }, [py]);
  useEffect(() => { pAngleRef.current = pAngle; }, [pAngle]);

  useEffect(() => {
    if (textureColumns.length === 0) return;
    let animationId;

    const animate = () => {
      const rays = castRays(pxRef.current, pyRef.current, pAngleRef.current,
                            getMapWidth(), getMapHeight(), null, lastEditorUsed, map);

      const canvas3D = canvasRef3D.current;
      const ctx3D = canvas3D.getContext('2d');
      draw3DView(ctx3D, rays);

      const canvasMap = canvasRefMap.current;
      const ctxMap = canvasMap.getContext('2d');
      drawTopDownMap(ctxMap, rays);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [map, textureColumns, lastEditorUsed]);

  function getMapWidth() {
    if (lastEditorUsed === 'standard') {
      return map.cells[0].length;
    } else {
      return map.root.width;
    }
  }

  function getMapHeight() {
    if (lastEditorUsed === 'standard') {
      return map.cells.length;
    } else {
      return map.root.height;
    }
  }

  const handleKeyDown = (e) => {
    const moveSpeed = 0.1;
    const rotSpeed = 0.05;
    let newX = pxRef.current;
    let newY = pyRef.current;
    let newAngle = pAngleRef.current;

    if (e.key === 'ArrowUp') {
      newX += Math.cos(newAngle)*moveSpeed;
      newY += Math.sin(newAngle)*moveSpeed;
    }
    if (e.key === 'ArrowDown') {
      newX -= Math.cos(newAngle)*moveSpeed;
      newY -= Math.sin(newAngle)*moveSpeed;
    }
    if (e.key === 'ArrowLeft') {
      newAngle -= rotSpeed;
    }
    if (e.key === 'ArrowRight') {
      newAngle += rotSpeed;
    }

    if (!isWall(newX, newY)) {
      setPX(newX);
      setPY(newY);
    }
    setPAngle(newAngle);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return ()=>window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function isWall(x, y) {
    if (x<0||y<0) return true;
    if (lastEditorUsed === 'standard') {
      const mx = x|0;
      const my = y|0;
      if (my<0 || my>=map.cells.length || mx<0 || mx>=map.cells[0].length) return true;
      return map.cells[my][mx]===1;
    } else {
      // Subdivide map check
      return isWallSubdiv(map.root, x, y);
    }
  }

  function isWallSubdiv(cell, x, y) {
    if (!cell.subdivided) {
      return cell.cellType === 'wall';
    } else {
      for (let ch of cell.children) {
        if (x>=ch.x && x<ch.x+ch.width && y>=ch.y && y<ch.y+ch.height) {
          return isWallSubdiv(ch, x, y);
        }
      }
      return true; // out of bounds
    }
  }

  function draw3DView(ctx, rays) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,screenWidth,screenHeight);

    ctx.fillStyle = '#222';
    ctx.fillRect(0, screenHeight/2, screenWidth, screenHeight/2);

    const textureWidth = 64;

    for (let i=0; i<rays.length; i++){
      const ray = rays[i];
      const distance = ray.distance;
      const ceiling = (screenHeight/2)-(screenHeight/distance);
      const floor = screenHeight - ceiling;
      const columnHeight = floor-ceiling;

      let textureX = ray.hitOffset; // castRays will provide hitOffset if implemented, or we can recalc
      const texColumn = (textureX * textureWidth)|0;
      const columnCanvas = textureColumns[texColumn] || textureColumns[0];

      ctx.drawImage(
        columnCanvas,
        0,0,1,64,
        i, ceiling, 1, columnHeight
      );
    }
  }

  function drawTopDownMap(ctx, rays) {
    const w = getMapWidth()*mapScale;
    const h = getMapHeight()*mapScale;
    ctx.clearRect(0,0,w,h);

    if (lastEditorUsed === 'standard') {
      for (let y=0; y<map.cells.length; y++) {
        for (let x=0; x<map.cells[0].length; x++) {
          ctx.fillStyle = map.cells[y][x]===1?'#444':'#000';
          ctx.fillRect(x*mapScale,y*mapScale,mapScale,mapScale);
        }
      }
    } else {
      // draw subdiv map
      const leaves = [];
      collectLeafCells(map.root, leaves);
      for (let c of leaves) {
        ctx.fillStyle = c.cellType==='wall'?'#444':(c.cellType==='player'?'gold':'#000');
        ctx.fillRect(c.x*mapScale,c.y*mapScale,c.width*mapScale,c.height*mapScale);
      }
    }

    // player
    ctx.fillStyle='red';
    ctx.beginPath();
    ctx.arc(pxRef.current*mapScale, pyRef.current*mapScale,3,0,Math.PI*2);
    ctx.fill();

    // rays
    ctx.strokeStyle='yellow';
    ctx.beginPath();
    for (let ray of rays) {
      const endX = pxRef.current+Math.cos(ray.angle)*ray.distance;
      const endY = pyRef.current+Math.sin(ray.angle)*ray.distance;
      ctx.moveTo(pxRef.current*mapScale, pyRef.current*mapScale);
      ctx.lineTo(endX*mapScale,endY*mapScale);
    }
    ctx.stroke();
  }

  function collectLeafCells(cell, arr) {
    if(!cell.subdivided) arr.push(cell);
    else {
      for (let ch of cell.children) collectLeafCells(ch, arr);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Project: {projectName}</h3>
      <div style={{border:'1px solid #555', width:screenWidth, margin:'0 auto'}}>
        <canvas ref={canvasRef3D} width={screenWidth} height={screenHeight} />
      </div>
      <div style={{border:'1px solid #555', width:getMapWidth()*mapScale, height:getMapHeight()*mapScale, margin:'0 auto'}}>
        <canvas ref={canvasRefMap} width={getMapWidth()*mapScale} height={getMapHeight()*mapScale}/>
      </div>
      <div>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    </div>
  );
}

export default Game;
