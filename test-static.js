import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');

console.log('distPath:', distPath);
console.log('exists:', fs.existsSync(distPath));
console.log('index.html:', fs.existsSync(path.join(distPath, 'index.html')));
console.log('express.static type:', typeof express.static);

const app = express();

app.use(express.static(distPath));

app.use((req, res) => {
  console.log('SPA fallback for:', req.method, req.url);
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(3333, () => console.log('Test server on http://localhost:3333'));
