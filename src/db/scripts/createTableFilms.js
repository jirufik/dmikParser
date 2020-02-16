const strCreateTable = `

CREATE TABLE films (
  code     integer CONSTRAINT films_code PRIMARY KEY,
  name     varchar(150),
  year     integer,
  tagline  text,
  country  text[],
  age      integer,
  about    text,
  genre    text[],
  producer text,
  img      varchar(150),
  data     jsonb,
  created  timestamp,
  updated  timestamp,
  version  integer NOT NULL
);

CREATE INDEX films_year_index ON films (year);

CREATE INDEX films_age_index ON films (age);

CREATE INDEX films_producer_index ON films (producer);

CREATE INDEX films_created_index ON films (created);

CREATE INDEX films_updated_index ON films (updated);

CREATE INDEX films_version_index ON films (version);

CREATE INDEX films_country_gin ON films USING GIN (country);

CREATE INDEX films_genre_gin ON films USING GIN (genre);

CREATE INDEX films_name_trgm ON films USING GIN (name gin_trgm_ops);

CREATE INDEX films_tagline_trgm ON films USING GIN (tagline gin_trgm_ops);

CREATE INDEX films_about_trgm ON films USING GIN (about gin_trgm_ops);`;

const createTableFilms = (params) => {
  return {
    name: 'createTableFilms',
    text: strCreateTable
  }
};

const rebuildTableFilms = (params) => {
  return {
    name: 'createTableFilms',
    text: `DROP TABLE IF EXISTS films CASCADE; ${strCreateTable}`
  }
};

export {createTableFilms, rebuildTableFilms};
