import React, { useState, useRef } from 'react';

function SubdivideEditor({ initialMap, onSave, onPlay, onBack }) {
  const [root, setRoot] = useState(initialMap.root);
  const [playerX, setPlayerX] = useState(initialMap.playerX);
  const [playerY, setPlayerY] = useState(initialMap.playerY);
  const [scaleLevel, setScaleLevel] = useState(initialMap.scaleLevel || 0);

  const [mode, setMode] = useState('subdivide');
  const [placingType, setPlacingType] = useState('wall');
  const [brushActive, setBrushActive] = useState(false);
  const [eraserActive, setEraserActive] = useState(false);

  const mapScale = 40;
  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // History
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  function getCurrentState() {
    return {
      root: structuredClone(root),
      playerX,
      playerY,
      scaleLevel,
      mode,
      placingType,
      brushActive,
      eraserActive
    };
  }

  function loadState(state) {
    setRoot(state.root);
    setPlayerX(state.playerX);
    setPlayerY(state.playerY);
    setScaleLevel(state.scaleLevel);
    setMode(state.mode);
    setPlacingType(state.placingType);
    setBrushActive(state.brushActive);
    setEraserActive(state.eraserActive);
  }

  function saveHistoryBeforeAction() {
    const current = getCurrentState();
    setPast([...past, current]);
    setFuture([]);
  }

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

  function ensureCellSizeForPlayer(cell, playerSize) {
    while ((cell.width > playerSize || cell.height > playerSize) && !cell.subdivided) {
      subdivideCell(cell);
    }
    if (cell.subdivided) {
      let ch = cell.children[0]; 
      return ensureCellSizeForPlayer(ch, playerSize);
    }
    return cell;
  }

  const playerCellSize = 1;

  function handleClickCell(x, y) {
    saveHistoryBeforeAction();
    const newRoot = structuredClone(root);
    const cell = findCellAtPosition(newRoot, x, y);
    if (mode === 'subdivide') {
      if (!cell.subdivided) {
        subdivideCell(cell);
      }
    } else if (mode === 'place') {
      if (placingType === 'player') {
        removeOldPlayer(newRoot);
        ensureCellSizeForPlayer(cell, playerCellSize);
        cell.cellType = 'player';
        setPlayerX(cell.x + cell.width/2);
        setPlayerY(cell.y + cell.height/2);
      } else if (placingType === 'wall') {
        if (!cell.subdivided) {
          if (brushActive && !eraserActive) {
            cell.cellType = 'wall';
          } else if (eraserActive && !brushActive) {
            cell.cellType = 'empty';
          } else {
            cell.cellType = (cell.cellType === 'wall') ? 'empty' : 'wall';
          }
        }
      }
    }
    setRoot(newRoot);
  }

  const handleSave = () => {
    onSave({
      root,
      playerX,
      playerY,
      scaleLevel
    });
  };

  const handlePlayClick = () => {
    onPlay({
      root,
      playerX,
      playerY,
      scaleLevel
    });
  };

  const cellsToDraw = [];
  collectLeafCells(root, cellsToDraw);

  const onMouseDown = (e) => {
    setIsMouseDown(true);
    const {x, y} = getMapCoords(e);
    if (x !== null && y !== null) handleClickCell(x, y);
  };

  const onMouseUp = () => {
    setIsMouseDown(false);
  };

  const onMouseMove = (e) => {
    if (isMouseDown && mode === 'place' && placingType === 'wall') {
      const {x, y} = getMapCoords(e);
      if (x !== null && y !== null) handleClickCell(x, y);
    }
  };

  function getMapCoords(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const clickX = offsetX / mapScale;
    const clickY = offsetY / mapScale;
    if (clickX < 0 || clickY < 0 || clickX >= root.width || clickY >= root.height) {
      return {x:null,y:null};
    }
    return {x:clickX,y:clickY};
  }

  function handleScaleDown() {
    saveHistoryBeforeAction();
    const newRoot = structuredClone(root);
    scaleCells(newRoot, 2);
    const newPlayerX = playerX * 2;
    const newPlayerY = playerY * 2;
    setRoot(newRoot);
    setPlayerX(newPlayerX);
    setPlayerY(newPlayerY);
    setScaleLevel(scaleLevel + 1);
  }

  function handleScaleUp() {
    if (scaleLevel === 0) return;
    saveHistoryBeforeAction();
    const newRoot = structuredClone(root);
    scaleCells(newRoot, 0.5);
    const newPlayerX = playerX * 0.5;
    const newPlayerY = playerY * 0.5;
    setRoot(newRoot);
    setPlayerX(newPlayerX);
    setPlayerY(newPlayerY);
    setScaleLevel(scaleLevel - 1);
  }

  function scaleCells(cell, factor) {
    cell.x *= factor;
    cell.y *= factor;
    cell.width *= factor;
    cell.height *= factor;

    if (cell.subdivided) {
      for (let ch of cell.children) {
        scaleCells(ch, factor);
      }
    }
  }

  const handleBrushModeChange = (checked) => {
    saveHistoryBeforeAction();
    if (checked) {
      setEraserActive(false);
    }
    setBrushActive(checked);
  };

  const handleEraserModeChange = (checked) => {
    saveHistoryBeforeAction();
    if (checked) {
      setBrushActive(false);
    }
    setEraserActive(checked);
  };

  function undo() {
    if (past.length > 0) {
      const previous = past[past.length - 1];
      const current = getCurrentState();
      setFuture([...future, current]);
      setPast(past.slice(0, past.length - 1));
      loadState(previous);
    }
  }

  function redo() {
    if (future.length > 0) {
      const next = future[future.length - 1];
      const current = getCurrentState();
      setPast([...past, current]);
      setFuture(future.slice(0, future.length - 1));
      loadState(next);
    }
  }

  return (
    <div>
      <div>
        <label>
          <input
            type="radio"
            name="sub_mode"
            value="subdivide"
            checked={mode === 'subdivide'}
            onChange={() => {saveHistoryBeforeAction(); setMode('subdivide');}}
          />
          Subdivide Mode
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="sub_mode"
            value="place"
            checked={mode === 'place'}
            onChange={() => {saveHistoryBeforeAction(); setMode('place');}}
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
              onChange={() => {saveHistoryBeforeAction(); setPlacingType('wall');}}
            />
            Wall
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              name="placing_type"
              value="player"
              checked={placingType === 'player'}
              onChange={() => {saveHistoryBeforeAction(); setPlacingType('player');}}
            />
            Player
          </label>
          {placingType === 'wall' && (
            <>
              <label style={{ marginLeft: '20px' }}>
                <input
                  type="checkbox"
                  checked={brushActive}
                  onChange={(e) => handleBrushModeChange(e.target.checked)}
                />
                Brush Mode
              </label>
              <label style={{ marginLeft: '20px' }}>
                <input
                  type="checkbox"
                  checked={eraserActive}
                  onChange={(e) => handleEraserModeChange(e.target.checked)}
                />
                Eraser Mode
              </label>
            </>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
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
        <button onClick={handleSave}>Save</button>
        <button onClick={handlePlayClick}>Play</button>
        <button onClick={handleScaleDown}>Scale Down</button>
        <button onClick={handleScaleUp}>Scale Up</button>
        <button onClick={undo} disabled={past.length===0}>Undo</button>
        <button onClick={redo} disabled={future.length===0}>Redo</button>
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default SubdivideEditor;
