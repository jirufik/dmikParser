const strAddColumnsTable = `

ALTER TABLE films ADD COLUMN vote numeric;
ALTER TABLE films ADD COLUMN original_name varchar(150);
ALTER TABLE films ADD COLUMN id_tmdb integer;
ALTER TABLE films ADD COLUMN runtime integer;

CREATE INDEX films_vote_index ON films (vote);

CREATE INDEX films_runtime_index ON films (runtime);

CREATE INDEX films_original_name_trgm ON films USING GIN (original_name gin_trgm_ops);

`;

const addColumnsTableFilms = (params) => {
  return {
    name: 'addColumnsTableFilms',
    text: strAddColumnsTable
  }
};

export {addColumnsTableFilms};
