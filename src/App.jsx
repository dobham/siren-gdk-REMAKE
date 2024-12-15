import React, { useState } from "react";
import Menu from "./Menu";
import ProjectManager from "./ProjectManager";
import Editor from "./Editor";
import Game from "./Game";
import { loadProjectData, initProjectData } from "./Database";

function App() {
  const [view, setView] = useState("menu");
  const [projectName, setProjectName] = useState("");

  const handleStartProject = (name) => {
    initProjectData(name);
    setProjectName(name);
    setView("editor");
  };

  const handleLoadProject = (name) => {
    const loaded = loadProjectData(name);
    if (loaded) {
      setProjectName(name);
      setView("editor");
    } else {
      // If no data, initialize
      initProjectData(name);
      setProjectName(name);
      setView("editor");
    }
  };

  const handlePlayGame = () => {
    setView("game");
  };

  return (
    <div style={{ textAlign: "center" }}>
      {view === "menu" && (
        <Menu
          onNewProject={() => setView("projectManager")}
          onLoadProject={() => setView("projectManager")}
        />
      )}
      {view === "projectManager" && (
        <ProjectManager
          onStartProject={handleStartProject}
          onLoadProject={handleLoadProject}
          onBack={() => setView("menu")}
        />
      )}
      {view === "editor" && (
        <Editor
          projectName={projectName}
          onBack={() => setView("projectManager")} // <--- Changed here
          onPlay={handlePlayGame}
        />
      )}
      {view === "game" && (
        <Game projectName={projectName} onBackToMenu={() => setView("menu")} />
      )}
    </div>
  );
}

export default App;
