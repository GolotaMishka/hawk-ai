const express = require('express');
const path = require('path');
const appPaths = require('./config/paths');

const app = express();
const PORT = process.env.PORT || 4000;


app.use(express.static(appPaths.outputPath));
app.get('*', (_, res) => res.sendFile(path.join(appPaths.outputPath, 'index.html')));

app.listen(PORT, () => console.log(`App is now running on ${PORT}`));
