import pathExists from 'jrf-path-exists'

export default class Tickets {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async add({name, description}) {

    const tickets = await this.get({name});

    const values = [];

    if (!tickets || !tickets.length) {

      const text = `INSERT INTO tickets(name, description, created, version)
                    VALUES ($1, $2, NOW(), 1) RETURNING * ;`;

      values.push(name);
      values.push(description);

      const res = await this.postgres.query({text, values});

      return res.rows;

    }

    const ticket = pathExists(tickets, '[0]');
    if (!ticket) return;

    const update = ticket.description.toLowerCase() !== description.toLowerCase();
    if (update) {
      const res = await this.edit({id: ticket.id, description, version: ticket.version});
      return res;
    }

    return [ticket];

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

    let text = `SELECT * FROM tickets`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';
    text += ';';

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  async edit({id, description, version}) {

    const tickets = await this.get({id});

    const ticket = pathExists(tickets, '[0]');
    if (!ticket) throw new Error(`Not fount ticket with id: ${id}`);

    const curVersion = ticket.version;
    const badVersion = version !== curVersion;
    if (badVersion) {
      throw new Error(`Ticket has already been updated current version: ${curVersion}, our version: ${version}. Last update: ${ticket.updated}`);
    }

    const values = [];

    const text = `UPDATE tickets SET (description, updated, version) = ($1, NOW(), $2)
                  WHERE id = ${id} RETURNING * ;`;

    values.push(description);
    values.push(++version);

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

}
