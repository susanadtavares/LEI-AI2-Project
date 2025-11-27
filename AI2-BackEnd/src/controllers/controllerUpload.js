/*CORRER COMANDO: 
      npm install cloudinary multer dotenv

  Isto serve para que os ficheiros fiquem armazenados no Cloudinary e nao no pc
*/

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔹 Função auxiliar para upload de buffers
const uploadBuffer = (fileBuffer, folder, resource_type = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

const upload_create = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ error: 'Nenhum ficheiro recebido' });
    }

    if (req.file) {
      const url = await uploadBuffer(req.file.buffer, 'uploads-projeto', 'auto');
      return res.json({ message: 'Ficheiro enviado com sucesso!', url });
    }

    const urls = {};
    for (const key in req.files) {
      urls[key] = await Promise.all(
        req.files[key].map(f => uploadBuffer(f.buffer, `uploads-projeto/${key}`, 'auto'))
      );
    }

    return res.json({ message: 'Ficheiros enviados com sucesso!', urls });

  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ error: 'Erro ao enviar ficheiro', detalhes: err.message });
  }
};

module.exports = { upload_create, uploadBuffer };

