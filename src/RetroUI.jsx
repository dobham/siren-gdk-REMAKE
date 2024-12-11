import React from 'react';

function RetroUI({ children }) {
  const style = {
    fontFamily: 'monospace',
    color: '#ccc',
    background: '#000',
    border: '2px solid #333',
    padding: '10px',
    width: 'fit-content',
    margin: 'auto'
  };
  return <div style={style}>{children}</div>;
}

export default RetroUI;
