export default class RunScripts {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async run({scripts = [], transaction = false}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const postgres = transaction ? await this.postgres.transaction() : this.postgres;
    if (transaction) {
      await postgres.begin();
    }

    const prevScripts = {};

    for (const script of scripts) {

      const {name, text, value} = script(prevScripts);
      const res = await postgres.query({text});

      prevScripts[name] = {
        text,
        value,
        rows: res.rows
      };

    }

    if (transaction) {
      await postgres.commit();
    }

  }

}
