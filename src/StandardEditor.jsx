import React, { useState, useRef } from 'react';

function StandardEditor({ initialMap, onSave, onPlay, onBack }) {
  const [mapData, setMapData] = useState(initialMap.cells);
  const [playerX, setPlayerX] = useState(initialMap.playerX);
  const [playerY, setPlayerY] = useState(initialMap.playerY);
  const [mapWidth, setMapWidth] = useState(initialMap.mapWidth);
  const [mapHeight, setMapHeight] = useState(initialMap.mapHeight);
  const [scaleLevel, setScaleLevel] = useState(initialMap.scaleLevel || 0);

  // Tools: 'wall', 'player', 'brush' is replaced with just 'wall' and a "Brush Mode" checkbox
  // Now we have only 'wall' or 'player' tools, and a separate "Brush Mode" checkbox if 'wall' is selected.
  const [tool, setTool] = useState('wall');
  const [brushActive, setBrushActive] = useState(false);
  const mapScale = 20;

  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleCellAction = (x, y) => {
    if (tool === 'wall') {
      if (brushActive) {
        paintCellWall(x, y);
      } else {
        toggleCellWall(x, y);
      }
    } else if (tool === 'player') {
      setPlayerX(x);
      setPlayerY(y);
    }
  };

  const toggleCellWall = (x, y) => {
    const newMap = mapData.map((row, iy) => row.map((cell, ix) => {
      if (ix === x && iy === y) {
        return cell === 1 ? 0 : 1;
      }
      return cell;
    }));
    setMapData(newMap);
  };

  const paintCellWall = (x, y) => {
    // Set cell to wall (1) without toggling
    const newMap = mapData.map((row, iy) => row.map((cell, ix) => {
      if (ix === x && iy === y) {
        return 1;
      }
      return cell;
    }));
    setMapData(newMap);
  };

  const handleSaveClick = () => {
    onSave({
      cells: mapData,
      playerX,
      playerY,
      mapWidth,
      mapHeight,
      scaleLevel
    });
  };

  const handlePlayClick = () => {
    onPlay({
      cells: mapData,
      playerX,
      playerY,
      mapWidth,
      mapHeight,
      scaleLevel
    });
  };

  const handleScaleDown = () => {
    const newWidth = mapWidth * 2;
    const newHeight = mapHeight * 2;

    const newMap = Array.from({ length: newHeight }, () => Array(newWidth).fill(0));
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const val = mapData[y][x];
        newMap[y*2][x*2] = val;
        newMap[y*2][x*2+1] = val;
        newMap[y*2+1][x*2] = val;
        newMap[y*2+1][x*2+1] = val;
      }
    }

    const newPlayerX = playerX * 2;
    const newPlayerY = playerY * 2;

    setMapData(newMap);
    setMapWidth(newWidth);
    setMapHeight(newHeight);
    setPlayerX(newPlayerX);
    setPlayerY(newPlayerY);
    setScaleLevel(scaleLevel + 1);
  };

  const handleScaleUp = () => {
    if (scaleLevel === 0) {
      return;
    }

    const newWidth = mapWidth / 2;
    const newHeight = mapHeight / 2;

    const newMap = Array.from({ length: newHeight }, () => Array(newWidth).fill(0));
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const val = mapData[y*2][x*2];
        newMap[y][x] = val;
      }
    }

    const newPlayerX = Math.floor(playerX / 2);
    const newPlayerY = Math.floor(playerY / 2);

    setMapData(newMap);
    setMapWidth(newWidth);
    setMapHeight(newHeight);
    setPlayerX(newPlayerX);
    setPlayerY(newPlayerY);
    setScaleLevel(scaleLevel - 1);
  };

  const onMouseDown = (e) => {
    setIsMouseDown(true);
    const {xCell, yCell} = getCellFromEvent(e);
    if (xCell !== null && yCell !== null) {
      handleCellAction(xCell, yCell);
    }
  };

  const onMouseUp = () => {
    setIsMouseDown(false);
  };

  const onMouseMove = (e) => {
    if (isMouseDown && tool === 'wall' && brushActive) {
      const {xCell, yCell} = getCellFromEvent(e);
      if (xCell !== null && yCell !== null) {
        handleCellAction(xCell, yCell);
      }
    }
  };

  const getCellFromEvent = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const xCell = Math.floor(offsetX / mapScale);
    const yCell = Math.floor(offsetY / mapScale);
    if (xCell < 0 || xCell >= mapWidth || yCell < 0 || yCell >= mapHeight) {
      return {xCell: null, yCell: null};
    }
    return {xCell, yCell};
  };

  return (
    <div>
      <div>
        <label>
          <input
            type="radio"
            name="std_tool"
            value="wall"
            checked={tool === 'wall'}
            onChange={() => setTool('wall')}
          />
          Wall Tool
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="std_tool"
            value="player"
            checked={tool === 'player'}
            onChange={() => setTool('player')}
          />
          Player Tool
        </label>
        {tool === 'wall' && (
          <label style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              checked={brushActive}
              onChange={(e) => setBrushActive(e.target.checked)}
            />
            Brush Mode
          </label>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${mapWidth}, ${mapScale}px)`,
          border: '2px solid #555',
          width: mapWidth * mapScale,
          margin: '20px auto',
          position: 'relative'
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {mapData.map((row, y) =>
          row.map((cell, x) => {
            let bgColor;
            if (x === playerX && y === playerY) {
              bgColor = 'gold';
            } else if (cell === 1) {
              bgColor = '#444';
            } else {
              bgColor = '#000';
            }

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  width: mapScale,
                  height: mapScale,
                  backgroundColor: bgColor,
                  boxSizing: 'border-box',
                  border: '1px solid #333'
                }}
              />
            );
          })
        )}
      </div>
      <div>
        <button onClick={handleSaveClick}>Save</button>
        <button onClick={handlePlayClick}>Play</button>
        <button onClick={handleScaleDown}>Scale Down</button>
        <button onClick={handleScaleUp}>Scale Up</button>
        <button onClick={onBack}>Back to Menu</button>
      </div>
    </div>
  );
}

export default StandardEditor;
