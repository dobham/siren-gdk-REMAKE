import React, { useState, useEffect } from 'react';
import { loadProjectData, saveProjectData } from './Database';
import { MAP_WIDTH, MAP_HEIGHT } from './MapData';

function Editor({ projectName, onBack, onPlay }) {
  const existingData = loadProjectData(projectName) || {
    map: Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(0)),
    playerX: 3,
    playerY: 3
  };

  const [mapData, setMapData] = useState(existingData.map);
  const [playerX, setPlayerX] = useState(existingData.playerX);
  const [playerY, setPlayerY] = useState(existingData.playerY);

  const [tool, setTool] = useState('wall'); // 'wall' or 'player'

  const mapScale = 20; // size of each cell in the editor UI

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

  const handleGenerateMaze = () => {
    // Generate a random maze:
    // First clear mapData by setting all cells to 0
    let newMap = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(0));
    // For each cell, 85% chance to place a wall
    newMap = newMap.map(row => row.map(() => {
      return Math.random() < 0.85 ? 0 : 1;
    }));
    // Optionally, ensure the player's position is empty space if desired:
    // newMap[playerY][playerX] = 0; // If you want to ensure player's cell is always empty.

    setMapData(newMap);
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
        <button onClick={handleGenerateMaze}>Generate Random Maze</button>
        <button onClick={onBack}>Back to Menu</button>
      </div>
    </div>
  );
}

export default Editor;
