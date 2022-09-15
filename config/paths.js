const path = require('path');

const paths = {};

paths.root = path.resolve(__dirname, '..');
paths.nodeModules = path.join(paths.root, 'node_modules');
paths.src = path.join(paths.root, 'src');
paths.outputPath = path.join(paths.root, 'dist');
paths.entryPoint = path.join(paths.src, 'index.js');
paths.publicFiles = path.join(paths.root, 'public');
paths.envPath = path.join(paths.root, `.env.${process.env.PROJECT_ENV || 'development'}`);

module.exports = paths;
