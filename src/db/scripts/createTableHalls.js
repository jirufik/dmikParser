const strCreateTable = `

CREATE TABLE halls (
  id          serial CONSTRAINT halls_id PRIMARY KEY,
  name        varchar(150),
  description text,
  created     timestamp,
  updated     timestamp,
  version     integer NOT NULL
);

CREATE INDEX halls_name_index ON halls (name);

CREATE INDEX halls_created_index ON halls (created);

CREATE INDEX halls_updated_index ON halls (updated);

CREATE INDEX halls_version_index ON halls (version);

CREATE INDEX halls_name_trgm ON halls USING GIN (name gin_trgm_ops);

CREATE INDEX halls_description_trgm ON halls USING GIN (description gin_trgm_ops);

`;

const createTableHalls = (params) => {
  return {
    name: 'createTableHalls',
    text: strCreateTable
  }
};

const rebuildTableHalls = (params) => {
  return {
    name: 'createTableHalls',
    text: `DROP TABLE IF EXISTS halls CASCADE; ${strCreateTable}`
  }
};

export {createTableHalls, rebuildTableHalls};
