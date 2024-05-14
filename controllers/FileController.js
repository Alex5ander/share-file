const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const files = [];
const folder = path.join(__dirname, '../uploads');

const MB = 1048576;
const KB = 1024;

/** @param {string} id */
const getFileById = (id) => files.find(e => e.id == id);

/** @param {number} size */
const getSize = (size) => size < KB ? size + "B" : size < MB ? (size / KB).toFixed(2) + "KB" : (size / (1024 * 1024)).toFixed(2) + "MB";

/** @type {import("express").RequestHandler} */
const upload = (req, res) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nenhum arquivo foi enviado');
  }

  const id = randomUUID();

  if (Array.isArray(req.files.file)) {
    const uploadPath = path.join(folder, id + '.zip');

    const output = fs.createWriteStream(uploadPath);
    const archive = archiver('zip', { zlib: 9 });
    archive.pipe(output);

    req.files.file.forEach(file => {
      archive.append(file.data, { name: file.name });
    });

    archive.finalize();

    const name = req.files.file[0].name;
    const downloadName = name + '.zip';
    const totalSize = getSize(req.files.file.reduce((previousValue, currentValue) => currentValue.size + previousValue, 0))

    files.push({
      id,
      files: req.files.file.map(file => ({
        name: file.name,
        size: getSize(file.size),
        type: path.extname(file.name).replace('.', '').toLowerCase()
      })),
      totalSize,
      uploadPath,
      downloadName
    });

    res.send(id);
  } else {
    const file = req.files.file;
    const extension = path.extname(file.name);
    const uploadPath = path.join(folder, id + extension);
    const size = getSize(file.size);
    files.push({
      id,
      files: [{
        name: file.name,
        size,
        type: extension.replace('.', '').toLowerCase()
      }],
      totalSize: size,
      uploadPath,
      downloadName: file.name
    });
    file.mv(uploadPath, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.send(id);
    })
  }
}

/** @type {import("express").RequestHandler} */
const download = (req, res) => {
  const { id } = req.params;
  const file = getFileById(id);
  if (file && fs.existsSync(file.uploadPath)) {
    res.download(file.uploadPath, file.downloadName, error => {
      if (error) {
      } else {
        fs.unlinkSync(file.uploadPath)
      }
    })
  }
  else {
    res.render('404');
  }
}

/** @type {import("express").RequestHandler} */
const downloadPage = (req, res) => {
  const { id } = req.params;
  const file = getFileById(id);
  if (file && fs.existsSync(file.uploadPath)) {
    res.render('download/index', {
      url: '/' + file.id,
      files: file.files || [],
      size: file.totalSize
    });
  }
  else {
    res.render('404');
  }
}


module.exports = {
  upload,
  download,
  downloadPage
}