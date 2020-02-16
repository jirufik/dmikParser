const strCreateTable = `

CREATE TABLE tickets (
  id          serial CONSTRAINT tickets_id PRIMARY KEY,
  name        varchar(150),
  description text,
  created     timestamp,
  updated     timestamp,
  version     integer NOT NULL
);

CREATE INDEX tickets_name_index ON tickets (name);

CREATE INDEX tickets_created_index ON tickets (created);

CREATE INDEX tickets_updated_index ON tickets (updated);

CREATE INDEX tickets_version_index ON tickets (version);

CREATE INDEX tickets_name_trgm ON tickets USING GIN (name gin_trgm_ops);

CREATE INDEX tickets_description_trgm ON tickets USING GIN (description gin_trgm_ops);

`;

const createTableTickets = (params) => {
  return {
    name: 'createTableTickets',
    text: strCreateTable
  }
};

const rebuildTableTickets = (params) => {
  return {
    name: 'createTableTickets',
    text: `DROP TABLE IF EXISTS tickets CASCADE; ${strCreateTable}`
  }
};

export {createTableTickets, rebuildTableTickets};
