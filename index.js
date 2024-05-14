const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { upload, download, downloadPage } = require('./controllers/FileController.js');
const folder = path.join(__dirname, 'uploads');

const fileSize = 1048576 * 10;

const app = express();
app.set('view engine', 'ejs');
app.use(fileUpload({ abortOnLimit: true, defCharset: 'utf8', defParamCharset: 'utf8', limits: { fileSize } }));

app.get('/download/:id', downloadPage);
app.post('/upload', upload);
app.get('/:id', download);
app.get('/', (_, res) => res.render('home/index'));

app.listen(3000, () => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true });
    fs.mkdirSync(folder);
  }
  console.log('server is started http://localhost:3000');
});