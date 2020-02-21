const config = require("../../../config");
import pathExists from 'jrf-path-exists'
import ConnectorPG from "../conectorPG";
import runScript from "./index";

const host = pathExists(config, 'postgres.host');
const port = pathExists(config, 'postgres.port');
const user = pathExists(config, 'postgres.user');
const password = pathExists(config, 'postgres.password');
const database = pathExists(config, 'postgres.database');

async function createDb() {

  const postgres = new ConnectorPG({host, port, user, password, database});
  await postgres.testConnect();

  await runScript({postgres, rebuild: process.env.REBUILD_DB, update: process.env.UPDATE_DB});

  await postgres.end();

}

Promise.resolve().then(createDb);
