export function saveProjectData(name, data) {
  // data: {map, playerX, playerY}
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
