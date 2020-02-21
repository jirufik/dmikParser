import axios from 'axios'
import runAttempts from "../utils/runAttempts";
import pathExists from 'jrf-path-exists'
import namesEqual from "../utils/namesEqual";
import processUrlQuery from "../utils/processUrlQuery";
import processFilm from "../utils/processFilm";

const config = require("../../config");
const API_KEY = config.tmdb.apiKey;
const URL = config.tmdb.url;
const ATTEMPTS = config.tmdb.attempts;

export default class TMDB {

  constructor({url = URL, apiKey = API_KEY, attempts = ATTEMPTS, logs} = {}) {

    this.url = url;
    this.apiKey = apiKey;
    this.attempts = attempts;
    this.logs = logs;

  }

  async log({type = 'info', log, data}) {

    if (this.logs) {
      await this.logs.add({type, log, data});
    } else {
      console.log({type, log, data});
    }

  }

  async execAxios({url}) {

    const func = async () => {

      const res = await axios.get(url);

      if (res.status !== 200) {
        throw new Error(res.statusText);
      }

      return res;

    };

    const res = await runAttempts({func, attempts: this.attempts});

    return res.data;

  }


  async findMovie({query, year, lang = 'ru', adult = false, page = 1}) {

    let url = `${this.url}/search/movie?api_key=${this.apiKey}`;
    query = processUrlQuery({query});
    url += `&year=${year}&language=${lang}&query=${encodeURIComponent(query)}&page=${page}&include_adult=${adult}`;

    const res = await this.execAxios({url});
    const films = pathExists(res, 'results', []);
    if (films.length === 1) return films[0];

    for (const film of films) {

      const equal = namesEqual({nameA: film.title, nameB: query});
      if (equal) return film;

    }

  }

  async getMovieById({id, lang = 'ru'}) {

    if (!id) return;

    const url = `${this.url}/movie/${id}?api_key=${this.apiKey}&language=${lang}`;
    const res = await this.execAxios({url});

    return res;

  }

  async getInfo({name, year}) {

    if (!name) return;

    let film = await this.findMovie({query: name, year});

    if (!film) {
      await this.log({type: 'info', log: `tmdb not found film name: ${name}; year: ${year}`, data: {name, year}});
      return;
    }

    const id = film.id;
    film = await this.getMovieById({id});
    if (!film) {

      await this.log({
        type: 'info',
        log: `tmdb not found film by id: ${id}; name: ${name}; year: ${year}`,
        data: {name, year}
      });

      return;
    }

    film = processFilm({film});

    return film;

  }

}
