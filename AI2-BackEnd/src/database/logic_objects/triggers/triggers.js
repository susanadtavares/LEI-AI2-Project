const db = require('../../../models');
const { Op } = require('sequelize');
const Curso = require('../../../models/curso');
const Formador = require('../../../models/formador');
const Utilizadores = require('../../../models/utilizadores');


const notifyStudentEnrollmentforEmail = async () => {
    try {
        await db.sequelize.query(`
      CREATE OR REPLACE FUNCTION notifyStudentEnrollment()
      RETURNS TRIGGER AS $$
      DECLARE
          curso_titulo TEXT;
          notification_id INTEGER;
          is_formando BOOLEAN;
      BEGIN
          -- Verifica se o utilizador está na tabela formando
          SELECT EXISTS (
              SELECT 1 FROM formando WHERE id_utilizador = NEW.id_utilizador
          ) INTO is_formando;

          -- Apenas notifica se for formando e se não foi adicionado por gestor
          IF is_formando AND NEW.adicionado_gestor = false THEN
              SELECT c.titulo 
              INTO curso_titulo
              FROM curso c 
              WHERE c.id_curso = NEW.id_curso;

              INSERT INTO notificacao (
                  id_curso,
                  titulo_notificacao,
                  data_notificacao,
                  estado
              ) VALUES (
                  NEW.id_curso,
                  'Inscrição realizada com sucesso no curso: ' || curso_titulo,
                  CURRENT_TIMESTAMP,
                  'ativa'
              )
              RETURNING id_notificacao INTO notification_id;

              INSERT INTO notificar (
                  id_utilizador,
                  id_notificacao,
                  notificacao_ativa
              ) VALUES (
                  NEW.id_utilizador,
                  notification_id,
                  true
              );
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_enrollment ON inscricao;
      CREATE TRIGGER trigger_notify_enrollment
      AFTER INSERT ON inscricao
      FOR EACH ROW
      EXECUTE FUNCTION notifyStudentEnrollment();
    `);

        console.log('Trigger for student enrollment notification created successfully.');
        return { success: true, message: 'Trigger for student enrollment notification created successfully.' };

    } catch (error) {
        console.error('Error creating trigger for student enrollment notification:', error);
        return { success: false, message: 'Error creating trigger for student enrollment notification.', error };
    }
};

const notifyStudentOnCourseUnenrollment = async () => {
    try {
        await db.sequelize.query(`
      CREATE OR REPLACE FUNCTION notifyStudentUnenrollment()
      RETURNS TRIGGER AS $$
      DECLARE
          curso_titulo TEXT;
          notification_id INTEGER;
          is_formando BOOLEAN;
      BEGIN
          -- Verificar se o estado mudou de ativo para inativo
          IF OLD.estado != 'inativo' AND NEW.estado = 'inativo' THEN

              -- Verificar se o utilizador é formando
              SELECT EXISTS (
                  SELECT 1 FROM formando WHERE id_utilizador = NEW.id_utilizador
              ) INTO is_formando;

              -- Apenas continua se o utilizador for formando E se não tiver sido adicionado pelo gestor
              IF is_formando AND OLD.adicionado_gestor = false THEN
                  SELECT c.titulo 
                  INTO curso_titulo
                  FROM curso c 
                  WHERE c.id_curso = NEW.id_curso;

                  INSERT INTO notificacao (
                      id_curso,
                      titulo_notificacao,
                      data_notificacao,
                      estado
                  ) VALUES (
                      NEW.id_curso,
                      'Desinscrição realizada com sucesso do curso: ' || curso_titulo,
                      CURRENT_TIMESTAMP,
                      'ativa'
                  )
                  RETURNING id_notificacao INTO notification_id;

                  INSERT INTO notificar (
                      id_utilizador,
                      id_notificacao,
                      notificacao_ativa
                  ) VALUES (
                      NEW.id_utilizador,
                      notification_id,
                      true
                  );
              END IF;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_unenrollment ON inscricao;
      CREATE TRIGGER trigger_notify_unenrollment
      AFTER UPDATE ON inscricao
      FOR EACH ROW
      EXECUTE FUNCTION notifyStudentUnenrollment();
    `);

        console.log('Trigger for student unenrollment notification created successfully.');
        return { success: true, message: 'Trigger for student unenrollment notification created successfully.' };

    } catch (error) {
        console.error('Error creating trigger for student unenrollment notification:', error);
        return { success: false, message: 'Error creating trigger for student unenrollment notification.', error };
    }
};

const notifyStudentOnCourseRemoval = async () => {
    try {
        await db.sequelize.query(`
      CREATE OR REPLACE FUNCTION notifyStudentRemoval()
      RETURNS TRIGGER AS $$
      DECLARE
          curso_titulo TEXT;
          notification_id INTEGER;
          is_formando BOOLEAN;
      BEGIN
          -- Verifica se o estado mudou de ativo para inativo
          IF OLD.estado != 'inativo' AND NEW.estado = 'inativo' THEN

              -- Verifica se foi o gestor que removeu (adicionado_gestor = true)
              IF OLD.adicionado_gestor = true THEN

                  -- Verifica se é formando
                  SELECT EXISTS (
                      SELECT 1 FROM formando WHERE id_utilizador = NEW.id_utilizador
                  ) INTO is_formando;

                  IF is_formando THEN
                      SELECT c.titulo
                      INTO curso_titulo
                      FROM curso c
                      WHERE c.id_curso = NEW.id_curso;

                      INSERT INTO notificacao (
                          id_curso,
                          titulo_notificacao,
                          data_notificacao,
                          estado
                      ) VALUES (
                          NEW.id_curso,
                          'Foi removido do curso: ' || curso_titulo || ' por um gestor.',
                          CURRENT_TIMESTAMP,
                          'ativa'
                      )
                      RETURNING id_notificacao INTO notification_id;

                      INSERT INTO notificar (
                          id_utilizador,
                          id_notificacao,
                          notificacao_ativa
                      ) VALUES (
                          NEW.id_utilizador,
                          notification_id,
                          true
                      );
                  END IF;
              END IF;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_removal ON inscricao;
      CREATE TRIGGER trigger_notify_removal
      AFTER UPDATE ON inscricao
      FOR EACH ROW
      EXECUTE FUNCTION notifyStudentRemoval();
    `);

        console.log('Trigger for student course removal notification created successfully.');
        return { success: true, message: 'Trigger for student course removal notification created successfully.' };

    } catch (error) {
        console.error('Error creating trigger for student course removal notification:', error);
        return { success: false, message: 'Error creating trigger for student course removal notification.', error };
    }
};

const notifyStudentOnCourseEnrollment = async () => {
  try {
    await db.sequelize.query(`
      CREATE OR REPLACE FUNCTION notifyStudentEnrollmentByManager()
      RETURNS TRIGGER AS $$
      DECLARE
          curso_titulo TEXT;
          notification_id INTEGER;
          is_formando BOOLEAN;
      BEGIN
          -- Verifica se o estado é ativo
          IF NEW.estado = 'ativo' THEN

              -- Verifica se foi o gestor que adicionou
              IF NEW.adicionado_gestor = true THEN

                  -- Verifica se o utilizador é formando
                  SELECT EXISTS (
                      SELECT 1 FROM formando WHERE id_utilizador = NEW.id_utilizador
                  ) INTO is_formando;


                  IF is_formando THEN
                      SELECT c.titulo
                      INTO curso_titulo
                      FROM curso c
                      WHERE c.id_curso = NEW.id_curso;

                      INSERT INTO notificacao (
                          id_curso,
                          titulo_notificacao,
                          data_notificacao,
                          estado
                      ) VALUES (
                          NEW.id_curso,
                          'Foi inscrito manualmente no curso: ' || curso_titulo || ' por um gestor.',
                          CURRENT_TIMESTAMP,
                          'ativa'
                      )
                      RETURNING id_notificacao INTO notification_id;

                      INSERT INTO notificar (
                          id_utilizador,
                          id_notificacao,
                          notificacao_ativa
                      ) VALUES (
                          NEW.id_utilizador,
                          notification_id,
                          true
                      );
                  END IF;
              END IF;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_manual_enrollment ON inscricao;

      CREATE TRIGGER trigger_notify_manual_enrollment
      AFTER INSERT OR UPDATE ON inscricao
      FOR EACH ROW
      EXECUTE FUNCTION notifyStudentEnrollmentByManager();
    `);

    console.log('Trigger criado com sucesso.');
    return { success: true, message: 'Trigger criado com sucesso.' };

  } catch (error) {
    console.error('Erro ao criar o trigger:', error);
    return { success: false, message: 'Erro ao criar o trigger.', error };
  }
};

const notifyInstructorBeforeCourseStart = async () => {
    try {
        const hoje = new Date();
        const amanha = new Date();
        amanha.setDate(hoje.getDate() + 1);

        const startOfDay = new Date(amanha.setHours(0, 0, 0, 0));
        const endOfDay = new Date(amanha.setHours(23, 59, 59, 999));

        const cursos = await Curso.findAll({
            where: {
                data_inicio: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [
                {
                    model: Formador,
                    as: 'formador',
                    include: [
                        {
                            model: Utilizadores,
                            as: 'utilizador',
                            attributes: ['id_utilizador', 'nome', 'email'] // agora temos id
                        }
                    ]
                }
            ]
        });

        for (const curso of cursos) {
            const formador = curso.formador?.utilizador;
            if (formador) {
                console.log(`Enviando notificação para ${formador.nome} (${formador.email}) sobre o curso "${curso.titulo}" que começa amanhã.`);

                // Transação segura
                await db.transaction(async (t) => {
                    // Inserir notificação
                    const result = await db.query(
                        `INSERT INTO notificacao (
                id_curso,
                titulo_notificacao,
                data_notificacao,
                estado
              ) VALUES ($1, $2, CURRENT_TIMESTAMP, 'ativa')
              RETURNING id_notificacao;`,
                        {
                            bind: [curso.id_curso, `Seu curso "${curso.titulo}" começa amanhã!`],
                            transaction: t
                        }
                    );

                    const idNotificacao = result[0][0].id_notificacao;

                    // Relacionar com o formador
                    await db.query(
                        `INSERT INTO notificar (
                id_utilizador,
                id_notificacao,
                notificacao_ativa
              ) VALUES ($1, $2, true);`,
                        {
                            bind: [formador.id_utilizador, idNotificacao],
                            transaction: t
                        }
                    );
                });
            }
        }

    } catch (err) {
        console.error('Erro ao notificar formadores:', err);
    }
};











module.exports = { notifyStudentEnrollmentforEmail, notifyStudentOnCourseUnenrollment, notifyStudentOnCourseRemoval, notifyStudentOnCourseEnrollment, notifyInstructorBeforeCourseStart };
