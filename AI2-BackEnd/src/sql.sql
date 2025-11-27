/*==============================================================*/
/* DBMS name:      Microsoft SQL Server 2017                    */
/* Created on:     14/04/2025 16:27:48                          */
/*==============================================================*/


if exists (select 1
            from  sysobjects
           where  id = object_id('ANEXO_AULA')
            and   type = 'U')
   drop table ANEXO_AULA
go

if exists (select 1
            from  sysobjects
           where  id = object_id('ANEXO_PUBLICACAO')
            and   type = 'U')
   drop table ANEXO_PUBLICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AREA')
            and   type = 'U')
   drop table AREA
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AREA_PARTILHA')
            and   type = 'U')
   drop table AREA_PARTILHA
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AULA')
            and   type = 'U')
   drop table AULA
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AVALIACAO_CURSO')
            and   type = 'U')
   drop table AVALIACAO_CURSO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('AVALIACAO_PUBLICACAO')
            and   type = 'U')
   drop table AVALIACAO_PUBLICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CATEGORIA')
            and   type = 'U')
   drop table CATEGORIA
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CATEGORIA_PUBLICACAO')
            and   type = 'U')
   drop table CATEGORIA_PUBLICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('COMENTARIO')
            and   type = 'U')
   drop table COMENTARIO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CURSO')
            and   type = 'U')
   drop table CURSO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CURSO_ASSINCRONO')
            and   type = 'U')
   drop table CURSO_ASSINCRONO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('CURSO_SINCRONO')
            and   type = 'U')
   drop table CURSO_SINCRONO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('DENUNCIA_POST')
            and   type = 'U')
   drop table DENUNCIA_POST
go

if exists (select 1
            from  sysobjects
           where  id = object_id('FORMADOR')
            and   type = 'U')
   drop table FORMADOR
go

if exists (select 1
            from  sysobjects
           where  id = object_id('FORMANDO')
            and   type = 'U')
   drop table FORMANDO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('GERIR')
            and   type = 'U')
   drop table GERIR
go

if exists (select 1
            from  sysobjects
           where  id = object_id('GESTOR')
            and   type = 'U')
   drop table GESTOR
go

if exists (select 1
            from  sysobjects
           where  id = object_id('INSCRICAO')
            and   type = 'U')
   drop table INSCRICAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('NOTIFICACAO')
            and   type = 'U')
   drop table NOTIFICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('NOTIFICAR')
            and   type = 'U')
   drop table NOTIFICAR
go

if exists (select 1
            from  sysobjects
           where  id = object_id('PUBLICACAO')
            and   type = 'U')
   drop table PUBLICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('QUIZ')
            and   type = 'U')
   drop table QUIZ
go

if exists (select 1
            from  sysobjects
           where  id = object_id('RESPOSTAS_QUIZ')
            and   type = 'U')
   drop table RESPOSTAS_QUIZ
go

if exists (select 1
            from  sysobjects
           where  id = object_id('RESPOSTAS_TESTE')
            and   type = 'U')
   drop table RESPOSTAS_TESTE
go

if exists (select 1
            from  sysobjects
           where  id = object_id('SUBMETER_FICHEIRO')
            and   type = 'U')
   drop table SUBMETER_FICHEIRO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('TESTE')
            and   type = 'U')
   drop table TESTE
go

if exists (select 1
            from  sysobjects
           where  id = object_id('TOPICO')
            and   type = 'U')
   drop table TOPICO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('TOPICO_PUBLICACAO')
            and   type = 'U')
   drop table TOPICO_PUBLICACAO
go

if exists (select 1
            from  sysobjects
           where  id = object_id('UTILIZADORES')
            and   type = 'U')
   drop table UTILIZADORES
go

/*==============================================================*/
/* Table: CATEGORIA                                             */
/*==============================================================*/
create table CATEGORIA (
   ID_CATEGORIA         int                  not null,
   NOME_CATEGORIA       varchar(256)         not null,
   constraint PK_CATEGORIA primary key (ID_CATEGORIA)
)
go

/*==============================================================*/
/* Table: AREA                                                  */
/*==============================================================*/
create table AREA (
   ID_AREA              int                  not null,
   ID_CATEGORIA         int                  null,
   NOME_AREA            varchar(256)         null,
   constraint PK_AREA primary key (ID_AREA),
   constraint FK_AREA____CATEGORI foreign key (ID_CATEGORIA)
      references CATEGORIA (ID_CATEGORIA)
)
go

/*==============================================================*/
/* Table: TOPICO                                                */
/*==============================================================*/
create table TOPICO (
   ID_TOPICO            int                  not null,
   ID_AREA              int                  null,
   NOME_TOPICO          varchar(256)         null,
   constraint PK_TOPICO primary key (ID_TOPICO),
   constraint FK_TOPICO___AREA foreign key (ID_AREA)
      references AREA (ID_AREA)
)
go

/*==============================================================*/
/* Table: CURSO                                                 */
/*==============================================================*/
create table CURSO (
   ID_CURSO             int                  not null,
   ID_AREA              int                  not null,
   ID_TOPICO            int                  not null,
   ID_CATEGORIA         int                  not null,
   DURACAO              integer              not null,
   MEMBROS              int                  not null,
   DESCRICAO            varchar(256)         not null,
   TITULO               varchar(60)          not null,
   AVALIACAO            decimal(4,2)         null,
   TUMBNAIL             image                null,
   DATA_INICIO          datetime             not null,
   DATA_FIM             datetime             not null,
   INTRODUCAO_CURSO     varchar(256)         not null,
   constraint PK_CURSO primary key (ID_CURSO),
   constraint FK_CURSO_CURSO_POR_CATEGORI foreign key (ID_CATEGORIA)
      references CATEGORIA (ID_CATEGORIA),
   constraint FK_CURSO_CURSO_POR_AREA foreign key (ID_AREA)
      references AREA (ID_AREA),
   constraint FK_CURSO_CURSO_POR_TOPICO foreign key (ID_TOPICO)
      references TOPICO (ID_TOPICO)
)
go

/*==============================================================*/
/* Table: AULA                                                  */
/*==============================================================*/
create table AULA (
   ID_AULA              int                  not null,
   ID_CURSO             int                  not null,
   URL_VIDEO            varchar(50)          null,
   TITULO_AULA          varchar(256)         not null,
   DESCRICAO_AULA       varchar(256)         not null,
   constraint PK_AULA primary key (ID_AULA),
   constraint FK_AULA_AULA_CURS_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: ANEXO_AULA                                            */
/*==============================================================*/
create table ANEXO_AULA (
   ID_ANEXOAULA         int                  not null,
   ID_AULA              int                  not null,
   constraint PK_ANEXO_AULA primary key (ID_ANEXOAULA),
   constraint FK_ANEXO_AU_ANEXO_AUL_AULA foreign key (ID_AULA)
      references AULA (ID_AULA)
)
go

/*==============================================================*/
/* Table: UTILIZADORES                                          */
/*==============================================================*/
create table UTILIZADORES (
   ID_UTILIZADOR        int                  not null,
   NOME                 varchar(120)         not null,
   EMAIL                varchar(120)         not null,
   PALAVRA_PASSE        varchar(120)         not null,
   TELEMOVEL            int                  not null,
   DATA_NASCIMENTO      datetime             not null,
   GENERO               varchar(20)          null,
   constraint PK_UTILIZADORES primary key (ID_UTILIZADOR)
)
go

/*==============================================================*/
/* Table: PUBLICACAO                                            */
/*==============================================================*/
create table PUBLICACAO (
   ID_PUBLICACAO        int                  not null,
   ID_UTILIZADOR        int                  null,
   TITULO_PUBLICACAO    varchar(256)         not null,
   DATA_PUBLICACAO      datetime             not null,
   DESCRICAO_PUBLICACAO varchar(256)         not null,
   COMENTARIO_PUBLICACAO varchar(256)         not null,
   constraint PK_PUBLICACAO primary key (ID_PUBLICACAO),
   constraint FK_PUBLICAC_CRIAR_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR)
)
go

/*==============================================================*/
/* Table: ANEXO_PUBLICACAO                                      */
/*==============================================================*/
create table ANEXO_PUBLICACAO (
   IDANEXO_PUBLICACAO   int                  not null,
   ID_PUBLICACAO        int                  not null,
   constraint PK_ANEXO_PUBLICACAO primary key (IDANEXO_PUBLICACAO),
   constraint FK_ANEXO_PU_ANEXO_PUB_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO)
)
go

/*==============================================================*/
/* Table: AREA_PARTILHA                                         */
/*==============================================================*/
create table AREA_PARTILHA (
   ID_AREA              int                  not null,
   ID_PUBLICACAO        int                  not null,
   constraint PK_AREA_PARTILHA primary key (ID_AREA, ID_PUBLICACAO),
   constraint FK_AREA_PAR_AREA_PART_AREA foreign key (ID_AREA)
      references AREA (ID_AREA),
   constraint FK_AREA_PAR_AREA_PART_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO)
)
go

/*==============================================================*/
/* Table: FORMANDO                                              */
/*==============================================================*/
create table FORMANDO (
   ID_UTILIZADOR        int                  not null,
   ID_FORMANDO          int                  not null,
   NOME                 varchar(120)         not null,
   EMAIL                varchar(120)         not null,
   PALAVRA_PASSE        varchar(120)         not null,
   TELEMOVEL            int                  not null,
   DATA_NASCIMENTO      datetime             not null,
   GENERO               varchar(20)          null,
   N_CURSOSACABADOS     int                  not null,
   N_CURSOSINSCRITOS    int                  not null,
   DESCRICAO_FORMANDO   varchar(256)         not null,
   EDUCACAO_FORMANDO    varchar(256)         not null,
   HABILIDADES_FORMANDO varchar(256)         not null,
   CERTIFICACOES_FORMANDO varchar(256)         not null,
   FOTO_PERFIL          image                null,
   DATA_INSCRICAO       datetime             not null,
   constraint PK_FORMANDO primary key (ID_UTILIZADOR, ID_FORMANDO),
   constraint FK_FORMANDO_TIPO_UTIL_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR)
)
go

/*==============================================================*/
/* Table: AVALIACAO_CURSO                                       */
/*==============================================================*/
create table AVALIACAO_CURSO (
   ID_AVALIACAO         int                  not null,
   ID_UTILIZADOR        int                  not null,
   ID_FORMANDO          int                  not null,
   ID_CURSO             int                  null,
   N_ESTRELAS           decimal              not null,
   COMENTARIO           varchar(256)         null,
   DATA                 datetime             null,
   HORA                 datetime             null,
   constraint PK_AVALIACAO_CURSO primary key (ID_AVALIACAO),
   constraint FK_AVALIACA_DAR_FORMANDO foreign key (ID_UTILIZADOR, ID_FORMANDO)
      references FORMANDO (ID_UTILIZADOR, ID_FORMANDO),
   constraint FK_AVALIACA_DO_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: AVALIACAO_PUBLICACAO                                  */
/*==============================================================*/
create table AVALIACAO_PUBLICACAO (
   ID_AVALIACAO_PUBLICACAO int                  not null,
   ID_UTILIZADOR        int                  not null,
   ID_PUBLICACAO        int                  not null,
   UPVOTE               int                  not null,
   DOWNVOTE             int                  null,
   constraint PK_AVALIACAO_PUBLICACAO primary key (ID_AVALIACAO_PUBLICACAO),
   constraint FK_AVALIACA_UTILIZADO_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR),
   constraint FK_AVALIACA_AVALIACAO_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO)
)
go

/*==============================================================*/
/* Table: CATEGORIA_PUBLICACAO                                  */
/*==============================================================*/
create table CATEGORIA_PUBLICACAO (
   ID_CATEGORIA         int                  not null,
   ID_PUBLICACAO        int                  not null,
   constraint PK_CATEGORIA_PUBLICACAO primary key (ID_CATEGORIA, ID_PUBLICACAO),
   constraint FK_CATEGORI_CATEGORIA_CATEGORI foreign key (ID_CATEGORIA)
      references CATEGORIA (ID_CATEGORIA),
   constraint FK_CATEGORI_CATEGORIA_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO)
)
go

/*==============================================================*/
/* Table: COMENTARIO                                            */
/*==============================================================*/
create table COMENTARIO (
   IDCOMENTARIO         int                  not null,
   ID_PUBLICACAO        int                  not null,
   COM_IDCOMENTARIO     int                  null,
   ID_UTILIZADOR        int                  not null,
   DATA_COMENTARIO      datetime             not null,
   DESCRICAO_COMENTARIO varchar(256)         not null,
   COMENTARIO_PAI       int                  not null,
   constraint PK_COMENTARIO primary key (IDCOMENTARIO),
   constraint FK_COMENTAR_COMENTARI_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO),
   constraint FK_COMENTAR_UTILIZADO_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR),
   constraint FK_COMENTAR_RESPOSTA__COMENTAR foreign key (COM_IDCOMENTARIO)
      references COMENTARIO (IDCOMENTARIO)
)
go

/*==============================================================*/
/* Table: CURSO_ASSINCRONO                                      */
/*==============================================================*/
create table CURSO_ASSINCRONO (
   ID_CURSO             int                  not null,
   ID_ASSINCRONO        int                  not null,
   ID_AREA              int                  null,
   ID_TOPICO            int                  null,
   ID_CATEGORIA         int                  null,
   DURACAO              integer              not null,
   MEMBROS              int                  not null,
   DESCRICAO            varchar(256)         not null,
   TITULO               varchar(60)          not null,
   AVALIACAO            decimal(4,2)         null,
   TUMBNAIL             image                null,
   DATA_INICIO          datetime             not null,
   DATA_FIM             datetime             not null,
   INTRODUCAO_CURSO     varchar(256)         not null,
   NUM_VAGAS            int                  null,
   constraint PK_CURSO_ASSINCRONO primary key (ID_CURSO, ID_ASSINCRONO),
   constraint FK_CURSO_AS_TIPO_CURS_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: FORMADOR                                              */
/*==============================================================*/
create table FORMADOR (
   ID_UTILIZADOR        int                  not null,
   ID_FORMADOR          int                  not null,
   NOME                 varchar(120)         not null,
   EMAIL                varchar(120)         not null,
   PALAVRA_PASSE        varchar(120)         not null,
   TELEMOVEL            int                  not null,
   DATA_NASCIMENTO      datetime             not null,
   GENERO               varchar(20)          null,
   TOTAL_FORMANDOS      int                  not null,
   TOTAL_CURSOS         int                  not null,
   DESCRICAO_FORMADOR   varchar(256)         not null,
   EDUCACAO_FORMADOR    varchar(256)         not null,
   HABILIDADES_FORMADOR varchar(256)         not null,
   CERTIFICACOES_FORMADOR varchar(256)         not null,
   FOTO_PERFIL          image                null,
   DATA_INSCRICAO       datetime             not null,
   constraint PK_FORMADOR primary key (ID_UTILIZADOR, ID_FORMADOR),
   constraint FK_FORMADOR_TIPO_UTIL_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR)
)
go

/*==============================================================*/
/* Table: CURSO_SINCRONO                                        */
/*==============================================================*/
create table CURSO_SINCRONO (
   ID_CURSO             int                  not null,
   ID_SINCRONO          int                  not null,
   ID_UTILIZADOR        int                  null,
   ID_FORMADOR          int                  null,
   ID_AREA              int                  null,
   ID_TOPICO            int                  null,
   ID_CATEGORIA         int                  null,
   DURACAO              integer              not null,
   MEMBROS              int                  not null,
   DESCRICAO            varchar(256)         not null,
   TITULO               varchar(60)          not null,
   AVALIACAO            decimal(4,2)         null,
   TUMBNAIL             image                null,
   DATA_INICIO          datetime             not null,
   DATA_FIM             datetime             not null,
   INTRODUCAO_CURSO     varchar(256)         not null,
   NUM_VAGAS            int                  not null,
   constraint PK_CURSO_SINCRONO primary key (ID_CURSO, ID_SINCRONO),
   constraint FK_CURSO_SI_LECIONAR_FORMADOR foreign key (ID_UTILIZADOR, ID_FORMADOR)
      references FORMADOR (ID_UTILIZADOR, ID_FORMADOR),
   constraint FK_CURSO_SI_TIPO_CURS_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: DENUNCIA_POST                                         */
/*==============================================================*/
create table DENUNCIA_POST (
   ID_DENUNCIA          int                  not null,
   ID_UTILIZADOR        int                  not null,
   ID_PUBLICACAO        int                  not null,
   MOTIVO               varchar(256)         not null,
   DATA_DENUNCIA        datetime             not null,
   constraint PK_DENUNCIA_POST primary key (ID_DENUNCIA),
   constraint FK_DENUNCIA_UTILIZADO_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR),
   constraint FK_DENUNCIA_DENUNCIA__PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO)
)
go

/*==============================================================*/
/* Table: GESTOR                                                */
/*==============================================================*/
create table GESTOR (
   ID_UTILIZADOR        int                  not null,
   ID_GESTOR            int                  not null,
   NOME                 varchar(120)         not null,
   EMAIL                varchar(120)         not null,
   PALAVRA_PASSE        varchar(120)         not null,
   TELEMOVEL            int                  not null,
   DATA_NASCIMENTO      datetime             not null,   GENERO               varchar(20)          null,
   constraint PK_GESTOR primary key (ID_UTILIZADOR, ID_GESTOR),
   constraint FK_GESTOR_TIPO_UTIL_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR)
)
go

/*==============================================================*/
/* Table: GERIR                                                 */
/*==============================================================*/
create table GERIR (
   ID_UTILIZADOR        int                  not null,
   ID_GESTOR            int                  not null,
   ID_CURSO             int                  not null,
   constraint PK_GERIR primary key (ID_UTILIZADOR, ID_GESTOR, ID_CURSO),
   constraint FK_GERIR_GERIR_GESTOR foreign key (ID_UTILIZADOR, ID_GESTOR)
      references GESTOR (ID_UTILIZADOR, ID_GESTOR),
   constraint FK_GERIR_GERIR2_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: INSCRICAO                                             */
/*==============================================================*/
create table INSCRICAO (
   ID_INSCRICAO         int                  not null,
   ID_CURSO             int                  null,
   ID_UTILIZADOR        int                  not null,
   ID_FORMANDO          int                  not null,
   ESTADO               varchar(256)         not null,
   DATA_INSCRICAO       datetime             null,
   NOTATESTE            decimal              null,
   constraint PK_INSCRICAO primary key (ID_INSCRICAO),
   constraint FK_INSCRICA_FAZER_FORMANDO foreign key (ID_UTILIZADOR, ID_FORMANDO)
      references FORMANDO (ID_UTILIZADOR, ID_FORMANDO),
   constraint FK_INSCRICA_NUM_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: NOTIFICACAO                                           */
/*==============================================================*/
create table NOTIFICACAO (
   ID_NOTIFICACAO       int                  not null,
   ID_CURSO             int                  null,
   TITULO_NOTIFICACAO   varchar(256)         not null,
   DATA_NOTIFICACAO     datetime             not null,
   constraint PK_NOTIFICACAO primary key (ID_NOTIFICACAO),
   constraint FK_NOTIFICA_NOTIFICAC_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: NOTIFICAR                                             */
/*==============================================================*/
create table NOTIFICAR (
   ID_UTILIZADOR        int                  not null,
   ID_NOTIFICACAO       int                  not null,
   constraint PK_NOTIFICAR primary key (ID_UTILIZADOR, ID_NOTIFICACAO),
   constraint FK_NOTIFICA_NOTIFICAR_UTILIZAD foreign key (ID_UTILIZADOR)
      references UTILIZADORES (ID_UTILIZADOR),
   constraint FK_NOTIFICA_NOTIFICAR_NOTIFICA foreign key (ID_NOTIFICACAO)
      references NOTIFICACAO (ID_NOTIFICACAO)
)
go

/*==============================================================*/
/* Table: QUIZ                                                  */
/*==============================================================*/
create table QUIZ (
   ID_QUIZ              int                  not null,
   ID_CURSO             int                  not null,
   ANEXO_QUIZ           varchar(256)         not null,
   DESCRICAO_QUIZ       varchar(256)         not null,
   TITULO_QUIZ          varchar(256)         not null,
   DATAENTREGA_QUIZ     datetime             null,
   constraint PK_QUIZ primary key (ID_QUIZ),
   constraint FK_QUIZ_QUIZ_CURS_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: RESPOSTAS_QUIZ                                        */
/*==============================================================*/
create table RESPOSTAS_QUIZ (
   ID_RESPOSTAQUIZ      int                  not null,
   ID_UTILIZADOR        int                  not null,
   ID_FORMANDO          int                  not null,
   ID_QUIZ              int                  not null,
   NOTAQUIZ             decimal              null,
   DATA                 datetime             null,
   HORA                 datetime             null,
   constraint PK_RESPOSTAS_QUIZ primary key (ID_RESPOSTAQUIZ),
   constraint FK_RESPOSTA_RESPOSTAS_QUIZ foreign key (ID_QUIZ)
      references QUIZ (ID_QUIZ)
)
go

/*==============================================================*/
/* Table: TESTE                                                 */
/*==============================================================*/
create table TESTE (
   ID_TESTE             int                  not null,
   ID_CURSO             int                  not null,
   ID_SINCRONO          int                  not null,
   ANEXO_TESTE          varchar(256)         not null,
   TITULO_TESTE         varchar(256)         not null,
   DESCRICAO_TESTE      varchar(256)         not null,
   DATAENTREGA_TESTE    datetime             not null,
   constraint PK_TESTE primary key (ID_TESTE),
   constraint FK_TESTE_TEM_CURSO_SI foreign key (ID_CURSO, ID_SINCRONO)
      references CURSO_SINCRONO (ID_CURSO, ID_SINCRONO)
)
go

/*==============================================================*/
/* Table: RESPOSTAS_TESTE                                       */
/*==============================================================*/
create table RESPOSTAS_TESTE (
   ID_RESPOSTATESTE     int                  not null,
   ID_TESTE             int                  not null,
   ID_UTILIZADOR        int                  not null,
   ID_FORMANDO          int                  not null,
   NOTATESTE            decimal              null,
   DATA                 datetime             null,
   HORA                 datetime             null,
   URL                  varchar(50)          null,
   constraint PK_RESPOSTAS_TESTE primary key (ID_RESPOSTATESTE),
   constraint FK_RESPOSTA_RESPOSTAS_TESTE foreign key (ID_TESTE)
      references TESTE (ID_TESTE)
)
go

/*==============================================================*/
/* Table: SUBMETER_FICHEIRO                                     */
/*==============================================================*/
create table SUBMETER_FICHEIRO (
   ID_SUBMISSAO         int                  not null,
   ID_CURSO             int                  null,
   ID_UTILIZADOR        int                  null,
   ID_FORMANDO          int                  null,
   FORMATO              varchar(256)         not null,
   constraint PK_SUBMETER_FICHEIRO primary key (ID_SUBMISSAO),
   constraint FK_SUBMETER_SUBMETER_FORMANDO foreign key (ID_UTILIZADOR, ID_FORMANDO)
      references FORMANDO (ID_UTILIZADOR, ID_FORMANDO),
   constraint FK_SUBMETER_NO_CURSO foreign key (ID_CURSO)
      references CURSO (ID_CURSO)
)
go

/*==============================================================*/
/* Table: TOPICO_PUBLICACAO                                     */
/*==============================================================*/
create table TOPICO_PUBLICACAO (
   ID_PUBLICACAO        int                  not null,
   ID_TOPICO            int                  not null,
   constraint PK_TOPICO_PUBLICACAO primary key (ID_PUBLICACAO, ID_TOPICO),
   constraint FK_TOPICO_P_TOPICO_PU_PUBLICAC foreign key (ID_PUBLICACAO)
      references PUBLICACAO (ID_PUBLICACAO),
   constraint FK_TOPICO_P_TOPICO_PU_TOPICO foreign key (ID_TOPICO)
      references TOPICO (ID_TOPICO)
)
go

