
const db = require('../models');
const Aula = db.aula;
const AnexoAula = db.anexo_aula;
const Curso = db.curso;
const { uploadBuffer } = require('./controllerUpload');


//está a guardar 2 videos repetidos quando cria aula (verificar depois)
exports.createAula = async (req, res) => {
  try {
    const { titulo_aula, descricao_aula, id_curso } = req.body;

    if (!titulo_aula || !descricao_aula || !id_curso) {
      return res.status(400).json({ erro: 'Campos obrigatórios: titulo_aula, descricao_aula, id_curso' });
    }

    if (isNaN(id_curso)) {
      return res.status(400).json({ erro: 'O campo id_curso deve ser um número válido' });
    }

    if (titulo_aula.trim().length < 3) {
      return res.status(400).json({ erro: 'O título da aula deve ter pelo menos 3 caracteres' });
    }

    if (descricao_aula.trim().length < 10) {
      return res.status(400).json({ erro: 'A descrição da aula deve ter pelo menos 10 caracteres' });
    }

    const curso = await Curso.findByPk(Number(id_curso));
    if (!curso) {
      return res.status(404).json({ erro: 'O curso informado não existe' });
    }

    if (!req.files?.video?.length) {
      return res.status(400).json({ erro: 'É obrigatório enviar um vídeo para a aula' });
    }

    const video = req.files.video[0];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedVideoTypes.includes(video.mimetype)) {
      return res.status(400).json({ erro: `Formato de vídeo inválido (${video.mimetype})` });
    }

    const videoUrl = await uploadBuffer(video.buffer, 'aulas/videos', 'video');

    const aula = await Aula.create({
      titulo_aula: titulo_aula.trim(),
      descricao_aula: descricao_aula.trim(),
      id_curso: Number(id_curso),
      url_video: videoUrl,
      aula_ativa: true
    });

    if (req.files?.anexos?.length) {
      const allowedAnexoTypes = ['application/pdf', 'text/csv'];

      for (const file of req.files.anexos) {
        if (!allowedAnexoTypes.includes(file.mimetype)) {
          return res.status(400).json({ erro: `Tipo de ficheiro inválido para anexo: ${file.mimetype}` });
        }

        const fileUrl = await uploadBuffer(file.buffer, 'aulas/anexos', 'auto');

        await AnexoAula.create({
          id_aula: aula.id_aula,
          nome_original: file.originalname,
          filename: fileUrl,
          mimetype: file.mimetype,
          tamanho: file.size,
          anexo_aula_ativo: true
        });
      }
    }

    const aulaComAnexos = await Aula.findByPk(aula.id_aula, {
      include: [
        {
          model: AnexoAula,
          as: 'anexos',
          where: { anexo_aula_ativo: true },
          required: false
        }
      ]
    });

    res.status(201).json(aulaComAnexos);

  } catch (err) {
    console.error('Erro ao criar aula:', err);
    res.status(500).json({ erro: 'Erro ao criar aula', detalhes: err.message });
  }
};

exports.getAulas = async (req, res) => {
  try {
    const where = { aula_ativa: true };

    if (req.query.curso) {
      where.id_curso = Number(req.query.curso);
    }

    const aulas = await Aula.findAll({
      where,
      order: [['id_aula', 'ASC']],
      include: [
        {
          model: AnexoAula,
          as: 'anexos',
          where: { anexo_aula_ativo: true },
          required: false
        }
      ]
    });

    if (!aulas.length) {
      return res.status(404).json({ mensagem: 'Nenhuma aula ativa encontrada para este curso.' });
    }

    res.json(aulas);
  } catch (err) {
    console.error('Erro ao buscar aulas:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar aulas', erro: err.message });
  }
};

exports.getAulaById = async (req, res) => {
  try {
    const aula = await Aula.findOne({
      where: { id_aula: req.params.id, aula_ativa: true },
      include: [
        {
          model: AnexoAula,
          as: 'anexos',
          where: { anexo_aula_ativo: true },
          required: false
        }
      ]
    });

    if (!aula) {
      return res.status(404).json({ mensagem: 'Aula não encontrada ou está desativada' });
    }

    res.json(aula);
  } catch (err) {
    console.error('Erro ao buscar aula:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar aula', erro: err.message });
  }
};

exports.updateAula = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo_aula, descricao_aula, id_curso, anexosRemover } = req.body;

    const aula = await Aula.findOne({ where: { id_aula: id, aula_ativa: true } });
    if (!aula) {
      return res.status(404).json({ erro: 'Aula não encontrada ou está desativada' });
    }

    if (titulo_aula && titulo_aula.trim().length < 3) {
      return res.status(400).json({ erro: 'O título deve ter no mínimo 3 caracteres' });
    }
    if (descricao_aula && descricao_aula.trim().length < 10) {
      return res.status(400).json({ erro: 'A descrição deve ter no mínimo 10 caracteres' });
    }

    if (id_curso) {
      const curso = await Curso.findByPk(Number(id_curso));
      if (!curso) return res.status(404).json({ erro: 'O curso informado não existe' });
      aula.id_curso = Number(id_curso);
    }

    if (titulo_aula) aula.titulo_aula = titulo_aula.trim();
    if (descricao_aula) aula.descricao_aula = descricao_aula.trim();

    if (req.files?.video?.length) {
      const video = req.files.video[0];
      if (!['video/mp4', 'video/webm', 'video/ogg'].includes(video.mimetype)) {
        return res.status(400).json({ erro: 'Formato de vídeo inválido (apenas .mp4, .webm, .ogg)' });
      }
      aula.url_video = await uploadBuffer(video.buffer, 'aulas/videos', 'video');
    }

    await aula.save();

    if (anexosRemover) {
      const ids = JSON.parse(anexosRemover);
      await AnexoAula.update(
        { anexo_aula_ativo: false },
        { where: { id_anexo_aula: ids, id_aula: id } }
      );
    }

    if (req.files?.anexos?.length) {
      for (const file of req.files.anexos) {
        const allowedTypes = ['application/pdf', 'text/csv'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ erro: `Tipo de ficheiro inválido para anexo: ${file.mimetype}` });
        }


        const fileUrl = await uploadBuffer(file.buffer, 'aulas/anexos', 'auto');
        await AnexoAula.create({
          id_aula: aula.id_aula,
          nome_original: file.originalname,
          filename: fileUrl,
          mimetype: file.mimetype,
          tamanho: file.size,
          anexo_aula_ativo: true
        });
      }
    }

    const aulaAtualizada = await Aula.findByPk(aula.id_aula, {
      include: [
        { model: AnexoAula, as: 'anexos', where: { anexo_aula_ativo: true }, required: false }
      ]
    });

    res.json(aulaAtualizada);

  } catch (err) {
    console.error('Erro ao atualizar aula:', err);
    res.status(500).json({ erro: 'Erro ao atualizar aula', detalhes: err.message });
  }
};

exports.deleteAula = async (req, res) => {
  try {
    const { id } = req.params;

    const aula = await Aula.findByPk(id);
    if (!aula) {
      return res.status(404).json({ mensagem: 'Aula não encontrada' });
    }

    aula.aula_ativa = false;
    await aula.save();

    await AnexoAula.update(
      { anexo_aula_ativo: false },
      { where: { id_aula: id } }
    );

    res.json({ mensagem: 'Aula e anexos desativados com sucesso!' });
  } catch (err) {
    console.error('Erro ao desativar aula:', err);
    res.status(500).json({ mensagem: 'Erro ao desativar aula', erro: err.message });
  }
};

//ocultar/desocultar aulas