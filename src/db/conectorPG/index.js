import {Pool} from 'pg'

export default class ConnectorPG {

  constructor({host = 'localhost', port = 5432, user, password, database, max = 20, idleTimeoutMillis = 30000}) {

    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.database = database;
    this.max = max;
    this.idleTimeoutMillis = idleTimeoutMillis;
    this._pool = null;
    this.initPool();

  }

  initPool() {

    this._pool = new Pool({
      host: this.host,
      port: this.port,
      database: this.database,
      user: this.user,
      password: this.password,
      max: this.max,
      idleTimeoutMillis: this.idleTimeoutMillis
    });

  }

  async testConnect() {

    const client = await this._pool.connect();
    client.release(true);

  }

  async query({text, values}) {

    let res;
    let error;
    let client;

    try {

      client = await this._pool.connect();

      if (!values) {
        res = await client.query(text);
      } else {
        res = await client.query(text, values);
      }

    } catch (e) {

      error = e;

    } finally {

      if (client) client.release(true);

    }

    if (error) throw new Error(error);

    return res;

  }

  async getClient() {

    const client = await this._pool.connect();
    return client;

  }

  async end() {

    if (this._pool) this._pool.end();

  }

  async transaction() {

    let client = await this._pool.connect();

    return {
      begin: async () => {

        if (!client) throw new Error('Transaction Already Completed');

        try {
          await client.query('BEGIN');
        } catch (e) {

          if (client) {
            client.release(true);
            client = null;
          }

          throw new Error(e);
        }

      },

      query: async ({text, values}) => {

        if (!client) throw new Error('Transaction Already Completed');

        let res;
        let error;

        try {

          if (!values) {
            res = await client.query(text);
          } else {
            res = await client.query(text, values);
          }

        } catch (e) {

          error = e;
          await client.query('ROLLBACK');
          if (client) {
            client.release(true);
            client = null;
          }

        }

        if (error) throw new Error(error);

        return res;

      },

      commit: async () => {

        if (!client) throw new Error('Transaction Already Completed');

        try {
          await client.query('COMMIT');
        } catch (e) {

          await client.query('ROLLBACK');
          if (client) {
            client.release(true);
            client = null;
          }
          throw new Error(e);

        }

        if (client) {
          client.release(true);
          client = null;
        }

      },

      rollback: async () => {

        if (!client) throw new Error('Transaction Already Completed');

        try {
          await client.query('ROLLBACK');
        } catch (e) {

          if (client) {
            client.release(true);
            client = null;
          }
          throw new Error(e);

        }
        if (client) {
          client.release(true);
          client = null;
        }

      }

    }

  }

}
