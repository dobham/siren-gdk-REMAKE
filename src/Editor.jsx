import React, { useState, useEffect } from 'react';
import { loadProjectData, saveProjectData } from './Database';
import StandardEditor from './StandardEditor';
import SubdivideEditor from './SubdivideEditor';

function Editor({ projectName, onBack, onPlay }) {
  const [data, setData] = useState(null);
  const [currentEditor, setCurrentEditor] = useState('standard'); // 'standard' or 'subdivide'

  useEffect(() => {
    const d = loadProjectData(projectName);
    setData(d);
    if (d && d.lastEditorUsed) {
      setCurrentEditor(d.lastEditorUsed);
    }
  }, [projectName]);

  if (!data) return <div>Loading...</div>;

  const handleSave = (standardMap, subdivMap) => {
    const newData = {
      standardMap,
      subdivMap,
      lastEditorUsed: currentEditor
    };
    setData(newData);
    saveProjectData(projectName, newData);
    alert('Project saved!');
  };

  const handlePlayClick = (standardMap, subdivMap) => {
    // Save before play
    const newData = {
      standardMap,
      subdivMap,
      lastEditorUsed: currentEditor
    };
    setData(newData);
    saveProjectData(projectName, newData);
    onPlay();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Editor: {projectName}</h2>
      <div>
        <label>
          <input
            type="radio"
            name="editor_mode"
            value="standard"
            checked={currentEditor === 'standard'}
            onChange={() => setCurrentEditor('standard')}
          />
          Standard Editor
        </label>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="radio"
            name="editor_mode"
            value="subdivide"
            checked={currentEditor === 'subdivide'}
            onChange={() => setCurrentEditor('subdivide')}
          />
          Subdivide Editor
        </label>
      </div>
      {currentEditor === 'standard' && (
        <StandardEditor
          initialMap={data.standardMap}
          onSave={(m) => handleSave(m, data.subdivMap)}
          onPlay={(m) => handlePlayClick(m, data.subdivMap)}
          onBack={onBack}
        />
      )}
      {currentEditor === 'subdivide' && (
        <SubdivideEditor
          initialMap={data.subdivMap}
          onSave={(sm) => handleSave(data.standardMap, sm)}
          onPlay={(sm) => handlePlayClick(data.standardMap, sm)}
          onBack={onBack}
        />
      )}
    </div>
  );
}

export default Editor;
