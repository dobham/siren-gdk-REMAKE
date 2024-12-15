import React, { useState } from "react";
import { saveProject, listProjects, deleteProject } from "./Database";

function ProjectManager({ onStartProject, onLoadProject, onBack }) {
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState(listProjects());

  const handleCreate = () => {
    if (newProjectName.trim()) {
      saveProject(newProjectName);
      setProjects(listProjects());
      onStartProject(newProjectName);
    } else {
      alert("Please enter a valid project name.");
    }
  };

  const handleLoad = () => {
    if (selectedProject) {
      onLoadProject(selectedProject);
    }
  };

  const handleDelete = () => {
    if (selectedProject) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete project "${selectedProject}"?`,
      );
      if (confirmDelete) {
        deleteProject(selectedProject);
        setProjects(listProjects());
        setSelectedProject("");
      }
    } else {
      alert("Please select a project to delete.");
    }
  };

  return (
    <div>
      <h2>Project Manager</h2>
      <div>
        <h3>Create New Project</h3>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="Project Name"
        />
        <button onClick={handleCreate}>Create & Start</button>
      </div>
      <div>
        <h3>Load / Delete Existing Project</h3>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">--Select a Project--</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button onClick={handleLoad}>Load Project</button>
        <button onClick={handleDelete}>Delete Project</button>
      </div>
      <button onClick={onBack}>Back</button>
    </div>
  );
}

export default ProjectManager;
