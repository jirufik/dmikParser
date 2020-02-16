import RunScripts from "./RunScripts";
import {createTableFilms, rebuildTableFilms} from "../scripts/createTableFilms"
import {createTableHalls, rebuildTableHalls} from "../scripts/createTableHalls"
import {createTableTickets, rebuildTableTickets} from "../scripts/createTableTickets"
import {createTableSchedules, rebuildTableSchedules} from "../scripts/createTableSchedules"
import {createTableLogs, rebuildTableLogs} from "../scripts/createTableLogs"

export default async function runScript({postgres, rebuild = false}) {

  const scripts = [];
  if (rebuild) {

    scripts.push(rebuildTableFilms);
    scripts.push(rebuildTableHalls);
    scripts.push(rebuildTableTickets);
    scripts.push(rebuildTableSchedules);
    scripts.push(rebuildTableLogs);

  } else {

    scripts.push(createTableFilms);
    scripts.push(createTableHalls);
    scripts.push(createTableTickets);
    scripts.push(createTableSchedules);
    scripts.push(createTableLogs);

  }

  const runScript = new RunScripts({postgres});
  await runScript.run({scripts, transaction: true});

}
