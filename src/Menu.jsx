import React from 'react';

function Menu({ onNewProject, onLoadProject }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>Ray Casting Kit</h1>
      <button onClick={onNewProject}>Start New Project</button>
      <button onClick={onLoadProject}>Load Existing Project</button>
    </div>
  );
}

export default Menu;
