import pathExists from 'jrf-path-exists'

export default class Schedules {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async add({date, filmCode, hallId, ticketId, cost}) {

    const schedules = await this.get({date, filmCode, hallId, ticketId});

    const values = [];

    if (!schedules || !schedules.length) {

      const text = `INSERT INTO schedules(date, code_film, id_hall, id_ticket, cost, created, version)
                    VALUES ($1, $2, $3, $4, $5, NOW(), 1) RETURNING * ;`;

      values.push(date);
      values.push(filmCode);
      values.push(hallId);
      values.push(ticketId);
      values.push(cost);

      const res = await this.postgres.query({text, values});

      return res.rows;

    }

    const schedule = pathExists(schedules, '[0]');
    if (!schedule) return;

    const update = Number(schedule.cost) !== cost;
    if (update) {
      const res = await this.edit({date, filmCode, hallId, ticketId, cost, version: schedule.version});
      return res;
    }

    return [schedule];

  }

  async get({date, filmCode, hallId, ticketId}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const strWhere = [];
    let valueNumber = 0;
    const values = [];

    if (date) {
      strWhere.push(`date = $${++valueNumber}`);
      values.push(date);
    }

    if (filmCode) {
      strWhere.push(`code_film = $${++valueNumber}`);
      values.push(filmCode);
    }

    if (hallId) {
      strWhere.push(`id_hall = $${++valueNumber}`);
      values.push(hallId);
    }

    if (ticketId) {
      strWhere.push(`id_ticket = $${++valueNumber}`);
      values.push(ticketId);
    }

    let text = `SELECT * FROM schedules`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';
    text += ';';

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  async edit({date, filmCode, hallId, ticketId, cost, version}) {

    const schedules = await this.get({date, filmCode, hallId, ticketId});

    const schedule = pathExists(schedules, '[0]');
    if (!schedule) throw new Error(`Not fount schedule with date: ${date}; film code: ${filmCode}; hall id: ${hallId}; ticket id: ${ticketId}`);

    const curVersion = schedule.version;
    const badVersion = version !== curVersion;
    if (badVersion) {
      throw new Error(`Schedule has already been updated current version: ${curVersion}, our version: ${version}. Last update: ${schedule.updated}`);
    }

    const values = [];

    const text = `UPDATE schedules SET (date, code_film, id_hall, id_ticket, cost, updated, version) 
                  = ($1, $2, $3, $4, $5, NOW(), $6)
                  WHERE id = ${schedule.id} RETURNING * ;`;

    values.push(date);
    values.push(filmCode);
    values.push(hallId);
    values.push(ticketId);
    values.push(cost);
    values.push(++version);

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

}
