import pathExists from 'jrf-path-exists'
import {xor} from 'lodash'

export default class Films {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async add({code, name, year, tagline, country, age, about, genre, producer, img, data}) {

    const films = await this.get({code});

    const values = [];

    if (!films || !films.length) {

      const text = `INSERT INTO films(code, name, year, tagline, country, age, about, genre, producer, img, data, created, version)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 1) RETURNING * ;`;

      values.push(code);
      values.push(name);
      values.push(year);
      values.push(tagline);
      values.push(country);
      values.push(age);
      values.push(about);
      values.push(genre);
      values.push(producer);
      values.push(img);
      values.push(data);

      const res = await this.postgres.query({text, values});

      return res.rows;

    }

    const film = pathExists(films, '[0]');
    if (!film) return;

    const update = this._update({film, name, year, tagline, country, age, about, genre, producer, img});
    if (update) {
      const res = await this.edit({
        code,
        name,
        year,
        tagline,
        country,
        age,
        about,
        genre,
        producer,
        img,
        version: film.version
      });
      return res;
    }

    return [film];

  }

  async get({code}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const strWhere = [];
    let valueNumber = 0;
    const values = [];

    if (code) {
      strWhere.push(`code = $${++valueNumber}`);
      values.push(code);
    }

    let text = `SELECT * FROM films`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';
    text += ';';

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  async edit({code, name, year, tagline, country, age, about, genre, producer, img, data, version}) {

    const films = await this.get({code});

    const film = pathExists(films, '[0]');
    if (!film) throw new Error(`Not fount film with code: ${code}`);

    const curVersion = film.version;
    const badVersion = version !== curVersion;
    if (badVersion) {
      throw new Error(`Film has already been updated current version: ${curVersion}, our version: ${version}. Last update: ${film.updated}`);
    }

    const values = [];

    const text = `UPDATE films SET (name, year, tagline, country, age, about, genre, producer, img, data, updated, version) 
                  = ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
                  WHERE code = ${code} RETURNING * ;`;

    values.push(name);
    values.push(year);
    values.push(tagline);
    values.push(country);
    values.push(age);
    values.push(about);
    values.push(genre);
    values.push(producer);
    values.push(img);
    values.push(data);
    values.push(++version);

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  _update({film, name, year, tagline, country, age, about, genre, producer, img}) {

    let update = film.name.toLowerCase() !== name.toLowerCase();
    if (update) return true;

    update = Number(film.year) !== year;
    if (update) return true;

    update = film.tagline.toLowerCase() !== tagline.toLowerCase();
    if (update) return true;

    update = xor(film.country, country).length;
    if (update) return true;

    update = Number(film.age) !== age;
    if (update) return true;

    update = film.about.toLowerCase() !== about.toLowerCase();
    if (update) return true;

    update = xor(film.genre, genre).length;
    if (update) return true;

    update = xor(film.producer, producer).length;
    if (update) return true;

    update = film.img.toLowerCase() !== img.toLowerCase();
    if (update) return true;

    return false;

  }

}
