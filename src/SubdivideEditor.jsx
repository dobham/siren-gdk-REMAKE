import React, { useState } from 'react';

// A quadtree cell:
// {
//   x, y, width, height, subdivided: bool, cellType: 'empty'|'wall'|'player',
//   children: [...] if subdivided
// }

function SubdivideEditor({ initialMap, onSave, onPlay, onBack }) {
  const [root, setRoot] = useState(initialMap.root);
  const [playerX, setPlayerX] = useState(initialMap.playerX);
  const [playerY, setPlayerY] = useState(initialMap.playerY);
  const [mode, setMode] = useState('subdivide'); // 'subdivide' or 'place'
  const [placingType, setPlacingType] = useState('wall'); // 'wall' or 'player'

  // For display, each top-level cell (root) is shown as a square on screen.
  // We'll use a scale factor for display.
  const mapScale = 40;

  const playerCellSize = 1; // Assume player occupies a 1x1 cell in subdiv terms

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / mapScale;
    const clickY = (event.clientY - rect.top) / mapScale;
    const newRoot = {...root};
    const cell = findCellAtPosition(newRoot, clickX, clickY);
    if (mode === 'subdivide') {
      if (!cell.subdivided) {
        subdivideCell(cell);
      }
    } else if (mode === 'place') {
      if (placingType === 'player') {
        // Remove old player
        removeOldPlayer(newRoot);
        // Ensure cell size matches player
        ensureCellSizeForPlayer(newRoot, cell, playerCellSize);
        cell.cellType = 'player';
        // Set playerX, playerY to center of this cell
        setPlayerX(cell.x + cell.width/2);
        setPlayerY(cell.y + cell.height/2);
      } else if (placingType === 'wall') {
        if (!cell.subdivided) {
          cell.cellType = (cell.cellType === 'wall') ? 'empty' : 'wall';
        }
      }
    }
    setRoot(newRoot);
  };

  const handleSaveClick = () => {
    onSave({
      root,
      playerX,
      playerY
    });
  };

  const handlePlayClick = () => {
    onPlay({
      root,
      playerX,
      playerY
    });
  };

  // Rendering the subdiv map: we need to draw each cell (leaf) as a rectangle
  // Player cell = gold, wall = #444, empty = #000
  const cellsToDraw = [];
  collectLeafCells(root, cellsToDraw);

  return (
    <div>
      <div>
        <label>
          <input
            type="radio"
            name="sub_mode"
            value="subdivide"
            checked={mode === 'subdivide'}
            onChange={() => setMode('subdivide')}
          />
          Subdivide Mode
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="sub_mode"
            value="place"
            checked={mode === 'place'}
            onChange={() => setMode('place')}
          />
          Place Mode
        </label>
      </div>
      {mode === 'place' && (
        <div>
          <label>
            <input
              type="radio"
              name="placing_type"
              value="wall"
              checked={placingType === 'wall'}
              onChange={() => setPlacingType('wall')}
            />
            Wall
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              name="placing_type"
              value="player"
              checked={placingType === 'player'}
              onChange={() => setPlacingType('player')}
            />
            Player
          </label>
        </div>
      )}
      <div
        onClick={handleClick}
        style={{
          position:'relative',
          width: root.width * mapScale,
          height: root.height * mapScale,
          border: '2px solid #555',
          margin:'20px auto'
        }}
      >
        {cellsToDraw.map((c, i) => {
          let bgColor = '#000';
          if (c.cellType === 'wall') bgColor = '#444';
          if (c.cellType === 'player') bgColor = 'gold';
          return (
            <div key={i} style={{
              position:'absolute',
              left: c.x * mapScale,
              top: c.y * mapScale,
              width: c.width * mapScale,
              height: c.height * mapScale,
              backgroundColor: bgColor,
              border:'1px solid #333',
              boxSizing:'border-box'
            }} />
          );
        })}
      </div>
      <div>
        <button onClick={handleSaveClick}>Save</button>
        <button onClick={handlePlayClick}>Play</button>
        <button onClick={onBack}>Back to Menu</button>
      </div>
    </div>
  );
}

// Utility functions for subdiv:
function subdivideCell(cell) {
  if (cell.subdivided) return;
  cell.subdivided = true;
  const halfW = cell.width/2;
  const halfH = cell.height/2;
  cell.children = [
    {x:cell.x, y:cell.y, width:halfW, height:halfH, subdivided:false, cellType:'empty'},
    {x:cell.x+halfW, y:cell.y, width:halfW, height:halfH, subdivided:false, cellType:'empty'},
    {x:cell.x, y:cell.y+halfH, width:halfW, height:halfH, subdivided:false, cellType:'empty'},
    {x:cell.x+halfW, y:cell.y+halfH, width:halfW, height:halfH, subdivided:false, cellType:'empty'}
  ];
}

function findCellAtPosition(cell, x, y) {
  if (!cell.subdivided) return cell;
  for (let ch of cell.children) {
    if (x >= ch.x && x < ch.x+ch.width && y >= ch.y && y < ch.y+ch.height) {
      return findCellAtPosition(ch, x, y);
    }
  }
  return cell; 
}

function collectLeafCells(cell, arr) {
  if (!cell.subdivided) {
    arr.push(cell);
  } else {
    for (let ch of cell.children) {
      collectLeafCells(ch, arr);
    }
  }
}

function removeOldPlayer(cell) {
  if (!cell.subdivided) {
    if (cell.cellType === 'player') cell.cellType='empty';
  } else {
    for (let ch of cell.children) removeOldPlayer(ch);
  }
}

function ensureCellSizeForPlayer(root, cell, playerSize) {
  // If cell is bigger than playerSize, subdiv until small enough
  while ((cell.width > playerSize || cell.height > playerSize) && !cell.subdivided) {
    subdivideCell(cell);
  }
  // If still too large and subdivided, we must pick a child that will be suitable.
  if (cell.subdivided) {
    // pick first child for simplicity, in real scenario pick the appropriate quadrant
    let ch = cell.children[0];
    return ensureCellSizeForPlayer(root, ch, playerSize);
  }
  return cell;
}

export default SubdivideEditor;
