import pathExists from 'jrf-path-exists'

export default function processFilm({film}) {

  const info = {
    id: pathExists(film, 'id', 0),
    img: pathExists(film, 'poster_path'),
    vote: pathExists(film, 'vote_average', 0),
    runtime: pathExists(film, 'runtime', 0),
    tagline: pathExists(film, 'tagline', ''),
    originalName: pathExists(film, 'original_title', ''),
  };

  const genres = pathExists(film, 'genres');
  info.genres = genres.map(el => pathExists(el, 'name'));

  return info;

}
