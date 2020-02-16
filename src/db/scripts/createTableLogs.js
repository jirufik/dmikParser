const strCreateTable = `

CREATE TABLE logs (
  id          serial CONSTRAINT logs_id PRIMARY KEY,
  date        timestamp DEFAULT NOW(),
  type        varchar(150),
  service     varchar(150),
  process_id  varchar(150),
  log         text,
  data        jsonb
);

CREATE INDEX logs_date_index ON logs (date);
CREATE INDEX logs_type_index ON logs (type);
CREATE INDEX logs_service_index ON logs (service);
CREATE INDEX logs_process_id_index ON logs (process_id);

CREATE INDEX logs_log_trgm ON logs USING GIN (log gin_trgm_ops);

CREATE INDEX logs_data_gin ON logs USING GIN (data);

`;

const createTableLogs = (params) => {
  return {
    name: 'createTableLogs',
    text: strCreateTable
  }
};

const rebuildTableLogs = (params) => {
  return {
    name: 'rebuildTableLogs',
    text: `DROP TABLE IF EXISTS logs CASCADE; ${strCreateTable}`
  }
};

export {createTableLogs, rebuildTableLogs};
