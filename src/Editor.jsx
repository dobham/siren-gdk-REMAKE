import React, { useState, useEffect } from 'react';
import { loadProjectData, saveProjectData } from './Database';
import { MAP_WIDTH, MAP_HEIGHT } from './MapData';

function Editor({ projectName, onBack, onPlay }) {
  // Load existing project data or default if none
  const existingData = loadProjectData(projectName) || {
    map: Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(0)),
    playerX: 3,
    playerY: 3
  };

  const [mapData, setMapData] = useState(existingData.map);
  const [playerX, setPlayerX] = useState(existingData.playerX);
  const [playerY, setPlayerY] = useState(existingData.playerY);

  const [tool, setTool] = useState('wall'); // 'wall' or 'player'

  const mapScale = 20; // Larger for editing UI

  const handleCellClick = (x, y) => {
    if (tool === 'wall') {
      // Toggle wall
      const newMap = mapData.map((row, iy) => row.map((cell, ix) => {
        if (ix === x && iy === y) {
          return cell === 1 ? 0 : 1;
        }
        return cell;
      }));
      setMapData(newMap);
    } else if (tool === 'player') {
      // Set player position
      setPlayerX(x);
      setPlayerY(y);
    }
  };

  const handleSave = () => {
    saveProjectData(projectName, {
      map: mapData,
      playerX: playerX,
      playerY: playerY
    });
    alert('Project saved!');
  };

  const handlePlayClick = () => {
    // Save before play
    saveProjectData(projectName, {
      map: mapData,
      playerX: playerX,
      playerY: playerY
    });
    onPlay();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Editor: {projectName}</h2>
      <div>
        <label>
          <input
            type="radio"
            name="tool"
            value="wall"
            checked={tool === 'wall'}
            onChange={() => setTool('wall')}
          />
          Wall Tool
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="tool"
            value="player"
            checked={tool === 'player'}
            onChange={() => setTool('player')}
          />
          Player Tool
        </label>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${MAP_WIDTH}, ${mapScale}px)`,
          border: '2px solid #555',
          width: MAP_WIDTH * mapScale,
          margin: '20px auto'
        }}
      >
        {mapData.map((row, y) =>
          row.map((cell, x) => {
            let bgColor;
            if (x === playerX && y === playerY) {
              bgColor = 'gold'; // player
            } else if (cell === 1) {
              bgColor = '#444'; // wall
            } else {
              bgColor = '#000'; // empty
            }

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                style={{
                  width: mapScale,
                  height: mapScale,
                  backgroundColor: bgColor,
                  boxSizing: 'border-box',
                  border: '1px solid #333',
                  cursor: 'pointer'
                }}
              />
            );
          })
        )}
      </div>
      <div>
        <button onClick={handleSave}>Save</button>
        <button onClick={handlePlayClick}>Play</button>
        <button onClick={onBack}>Back to Menu</button>
      </div>
    </div>
  );
}

export default Editor;
