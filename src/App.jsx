import React, { useState } from 'react';
import Menu from './Menu';
import ProjectManager from './ProjectManager';
import Game from './Game';
import Editor from './Editor';
import { loadProjectData } from './Database';

function App() {
  const [view, setView] = useState('menu');
  const [projectName, setProjectName] = useState('');

  const handleStartProject = (name) => {
    setProjectName(name);
    setView('editor');
  };

  const handleLoadProject = (name) => {
    const loaded = loadProjectData(name);
    if (loaded) {
      setProjectName(name);
      setView('editor');
    } else {
      // If no data, initialize editor anyway
      setProjectName(name);
      setView('editor');
    }
  };

  const handlePlayGame = () => {
    setView('game');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {view === 'menu' && (
        <Menu
          onNewProject={() => setView('projectManager')}
          onLoadProject={() => setView('projectManager')}
        />
      )}
      {view === 'projectManager' && (
        <ProjectManager
          onStartProject={handleStartProject}
          onLoadProject={handleLoadProject}
          onBack={() => setView('menu')}
        />
      )}
      {view === 'editor' && (
        <Editor
          projectName={projectName}
          onBack={() => setView('menu')}
          onPlay={handlePlayGame}
        />
      )}
      {view === 'game' && (
        <Game
          projectName={projectName}
          onBackToMenu={() => setView('menu')}
        />
      )}
    </div>
  );
}

export default App;
