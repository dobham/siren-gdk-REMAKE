import React, { useState, useRef } from "react";

function StandardEditor({ initialMap, onSave, onPlay, onBack }) {
  // State
  const [mapData, setMapData] = useState(initialMap.cells);
  const [playerX, setPlayerX] = useState(initialMap.playerX);
  const [playerY, setPlayerY] = useState(initialMap.playerY);
  const [mapWidth, setMapWidth] = useState(initialMap.mapWidth);
  const [mapHeight, setMapHeight] = useState(initialMap.mapHeight);
  const [scaleLevel, setScaleLevel] = useState(initialMap.scaleLevel || 0);

  const [tool, setTool] = useState("wall");
  const [brushActive, setBrushActive] = useState(false);
  const [eraserActive, setEraserActive] = useState(false);

  // History stacks
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const mapScale = 20;
  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  function getCurrentState() {
    return {
      mapData: structuredClone(mapData),
      playerX,
      playerY,
      mapWidth,
      mapHeight,
      scaleLevel,
      tool,
      brushActive,
      eraserActive,
    };
  }

  function loadState(state) {
    setMapData(state.mapData);
    setPlayerX(state.playerX);
    setPlayerY(state.playerY);
    setMapWidth(state.mapWidth);
    setMapHeight(state.mapHeight);
    setScaleLevel(state.scaleLevel);
    setTool(state.tool);
    setBrushActive(state.brushActive);
    setEraserActive(state.eraserActive);
  }

  function saveHistoryBeforeAction() {
    const current = getCurrentState();
    setPast([...past, current]);
    setFuture([]);
  }

  const handleCellAction = (x, y) => {
    saveHistoryBeforeAction();
    if (tool === "wall") {
      if (brushActive && !eraserActive) {
        paintCellWall(x, y);
      } else if (eraserActive && !brushActive) {
        eraseCellWall(x, y);
      } else {
        toggleCellWall(x, y);
      }
    } else if (tool === "player") {
      setPlayerX(x);
      setPlayerY(y);
    }
  };

  const toggleCellWall = (x, y) => {
    const newMap = mapData.map((row, iy) =>
      row.map((cell, ix) => {
        if (ix === x && iy === y) {
          return cell === 1 ? 0 : 1;
        }
        return cell;
      }),
    );
    setMapData(newMap);
  };

  const paintCellWall = (x, y) => {
    const newMap = mapData.map((row, iy) =>
      row.map((cell, ix) => {
        if (ix === x && iy === y) {
          return 1;
        }
        return cell;
      }),
    );
    setMapData(newMap);
  };

  const eraseCellWall = (x, y) => {
    const newMap = mapData.map((row, iy) =>
      row.map((cell, ix) => {
        if (ix === x && iy === y) {
          return 0;
        }
        return cell;
      }),
    );
    setMapData(newMap);
  };

  const handleSaveClick = () => {
    onSave({
      cells: mapData,
      playerX,
      playerY,
      mapWidth,
      mapHeight,
      scaleLevel,
    });
  };

  const handlePlayClick = () => {
    onPlay({
      cells: mapData,
      playerX,
      playerY,
      mapWidth,
      mapHeight,
      scaleLevel,
    });
  };

  const handleScaleDown = () => {
    saveHistoryBeforeAction();
    const newWidth = mapWidth * 2;
    const newHeight = mapHeight * 2;

    const newMap = Array.from({ length: newHeight }, () =>
      Array(newWidth).fill(0),
    );
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const val = mapData[y][x];
        newMap[y * 2][x * 2] = val;
        newMap[y * 2][x * 2 + 1] = val;
        newMap[y * 2 + 1][x * 2] = val;
        newMap[y * 2 + 1][x * 2 + 1] = val;
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
    saveHistoryBeforeAction();
    const newWidth = mapWidth / 2;
    const newHeight = mapHeight / 2;

    const newMap = Array.from({ length: newHeight }, () =>
      Array(newWidth).fill(0),
    );
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const val = mapData[y * 2][x * 2];
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
    const { xCell, yCell } = getCellFromEvent(e);
    if (xCell !== null && yCell !== null) {
      handleCellAction(xCell, yCell);
    }
  };

  const onMouseUp = () => {
    setIsMouseDown(false);
  };

  const onMouseMove = (e) => {
    if (isMouseDown && tool === "wall") {
      const { xCell, yCell } = getCellFromEvent(e);
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
      return { xCell: null, yCell: null };
    }
    return { xCell, yCell };
  };

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
            name="std_tool"
            value="wall"
            checked={tool === "wall"}
            onChange={() => {
              saveHistoryBeforeAction();
              setTool("wall");
            }}
          />
          Wall Tool
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            name="std_tool"
            value="player"
            checked={tool === "player"}
            onChange={() => {
              saveHistoryBeforeAction();
              setTool("player");
            }}
          />
          Player Tool
        </label>
        {tool === "wall" && (
          <>
            <label style={{ marginLeft: "20px" }}>
              <input
                type="checkbox"
                checked={brushActive}
                onChange={(e) => handleBrushModeChange(e.target.checked)}
              />
              Brush Mode
            </label>
            <label style={{ marginLeft: "20px" }}>
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

      <div
        ref={containerRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${mapWidth}, ${mapScale}px)`,
          border: "2px solid #555",
          width: mapWidth * mapScale,
          margin: "20px auto",
          position: "relative",
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {mapData.map((row, y) =>
          row.map((cell, x) => {
            let bgColor;
            if (x === playerX && y === playerY) {
              bgColor = "gold";
            } else if (cell === 1) {
              bgColor = "#444";
            } else {
              bgColor = "#000";
            }

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  width: mapScale,
                  height: mapScale,
                  backgroundColor: bgColor,
                  boxSizing: "border-box",
                  border: "1px solid #333",
                }}
              />
            );
          }),
        )}
      </div>
      <div>
        <button onClick={handleSaveClick}>Save</button>
        <button onClick={handlePlayClick}>Play</button>
        <button onClick={handleScaleDown}>Scale Down</button>
        <button onClick={handleScaleUp}>Scale Up</button>
        <button onClick={undo} disabled={past.length === 0}>
          Undo
        </button>
        <button onClick={redo} disabled={future.length === 0}>
          Redo
        </button>
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default StandardEditor;
