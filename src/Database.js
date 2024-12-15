export function saveProject(name) {
  let projects = JSON.parse(localStorage.getItem('projects') || '[]');
  if (!projects.includes(name)) {
    projects.push(name);
    localStorage.setItem('projects', JSON.stringify(projects));
  }
}

export function loadProject(name) {
  let projects = JSON.parse(localStorage.getItem('projects') || '[]');
  return projects.includes(name) ? { name } : null;
}

export function listProjects() {
  return JSON.parse(localStorage.getItem('projects') || '[]');
}

// In addition to the above, we have the functions we introduced in our newer versions:
export function saveProjectData(name, data) {
  let projects = JSON.parse(localStorage.getItem('projects') || '[]');
  if (!projects.includes(name)) {
    projects.push(name);
    localStorage.setItem('projects', JSON.stringify(projects));
  }
  localStorage.setItem(`project_${name}`, JSON.stringify(data));
}

export function loadProjectData(name) {
  const str = localStorage.getItem(`project_${name}`);
  return str ? JSON.parse(str) : null;
}

export function initProjectData(name) {
  let data = loadProjectData(name);
  if (!data) {
    data = {
      standardMap: {
        cells: Array.from({ length: 8 }, () => Array(8).fill(0)),
        playerX: 3,
        playerY: 3,
        mapWidth: 8,
        mapHeight: 8,
        scaleLevel: 0 // new property to track scaling
      },
      subdivMap: {
        root: {
          x: 0, y: 0,
          width: 8, height: 8,
          subdivided: false,
          cellType: 'empty'
        },
        playerX: 3,
        playerY: 3
      },
      lastEditorUsed: 'standard'
    };
    saveProjectData(name, data);
  }
  return data;
}

