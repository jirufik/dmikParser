const strCreateTable = `

CREATE TABLE schedules (
  id          serial CONSTRAINT schedules_id PRIMARY KEY,
  date        timestamp,
  code_film   integer REFERENCES films,
  id_hall     integer REFERENCES halls,
  id_ticket   integer REFERENCES tickets,
  cost        numeric,
  created     timestamp,
  updated     timestamp,
  version     integer NOT NULL
);

CREATE INDEX schedules_date_index ON schedules (date);

CREATE INDEX schedules_code_film_index ON schedules (code_film);

CREATE INDEX schedules_id_hall_index ON schedules (id_hall);

CREATE INDEX schedules_id_ticket_index ON schedules (id_ticket);

CREATE INDEX schedules_cost_index ON schedules (cost);

CREATE INDEX schedules_created_index ON schedules (created);

CREATE INDEX schedules_updated_index ON schedules (updated);

CREATE INDEX schedules_version_index ON schedules (version);

`;

const createTableSchedules = (params) => {
  return {
    name: 'createTableSchedules',
    text: strCreateTable
  }
};

const rebuildTableSchedules = (params) => {
  return {
    name: 'createTableSchedules',
    text: `DROP TABLE IF EXISTS schedules CASCADE; ${strCreateTable}`
  }
};

export {createTableSchedules, rebuildTableSchedules};
