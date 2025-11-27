const multer = require('multer');

//configuração do multer para aceitar imagens, PDFs, CSV e vídeos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/msword',
      'text/csv',
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Tipo de ficheiro inválido'));
  }
});

module.exports = { upload };
