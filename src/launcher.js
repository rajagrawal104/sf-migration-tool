#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Get the application directory
const appDir = process.env.NODE_ENV === 'production' 
    ? path.dirname(process.execPath)
    : __dirname;

// Ensure the client build directory exists
const clientBuildDir = path.join(appDir, 'client', 'build');
if (!fs.existsSync(clientBuildDir)) {
    console.error('Client build directory not found. Please run the build process first.');
    process.exit(1);
}

// Start the server
const server = spawn('node', [path.join(appDir, 'server', 'index.js')], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: 3001
    }
});

// Handle server process events
server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

server.on('exit', (code) => {
    if (code !== 0) {
        console.error(`Server process exited with code ${code}`);
        process.exit(code);
    }
});

// Handle application shutdown
process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
}); 