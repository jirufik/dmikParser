import pathExists from 'jrf-path-exists'

export default class Halls {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async add({name, description}) {

    const halls = await this.get({name});

    const values = [];

    if (!halls || !halls.length) {

      const text = `INSERT INTO halls(name, description, created, version)
                    VALUES ($1, $2, NOW(), 1) RETURNING * ;`;

      values.push(name);
      values.push(description);

      const res = await this.postgres.query({text, values});

      return res.rows;

    }

    const hall = pathExists(halls, '[0]');
    if (!hall) return;

    const update = hall.description.toLowerCase() !== description.toLowerCase();
    if (update) {
      const res = await this.edit({id: hall.id, description, version: hall.version});
      return res;
    }

    return [hall];

  }

  async get({id, name, search}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const strWhere = [];
    let valueNumber = 0;
    const values = [];

    if (id) {
      strWhere.push(`id = $${++valueNumber}`);
      values.push(id);
    }

    if (name) {
      strWhere.push(`name = $${++valueNumber}`);
      values.push(name);
    }

    if (search) {
      strWhere.push(`(name LIKE ${++valueNumber} OR description LIKE $${valueNumber})`);
      values.push(`%${search}%`);
    }

    let text = `SELECT * FROM halls`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';
    text += ';';

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  async edit({id, description, version}) {

    const halls = await this.get({id});

    const hall = pathExists(halls, '[0]');
    if (!hall) throw new Error(`Not fount hall with id: ${id}`);

    const curVersion = hall.version;
    const badVersion = version !== curVersion;
    if (badVersion) {
      throw new Error(`Hall has already been updated current version: ${curVersion}, our version: ${version}. Last update: ${hall.updated}`);
    }

    const values = [];

    const text = `UPDATE halls SET (description, updated, version) = ($1, NOW(), $2)
                  WHERE id = ${id} RETURNING * ;`;

    values.push(description);
    values.push(++version);

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

}
