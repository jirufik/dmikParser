import RunScripts from "./RunScripts";
import {createTableFilms, rebuildTableFilms} from "../scripts/createTableFilms"
import {createTableHalls, rebuildTableHalls} from "../scripts/createTableHalls"
import {createTableTickets, rebuildTableTickets} from "../scripts/createTableTickets"
import {createTableSchedules, rebuildTableSchedules} from "../scripts/createTableSchedules"
import {createTableLogs, rebuildTableLogs} from "../scripts/createTableLogs"
import {addColumnsTableFilms} from "../scripts/addColumnsTableFilms"

export default async function runScript({postgres, rebuild = false, update = false}) {

  const scripts = [];

  const isCreate = !rebuild && !update;
  const isRebuild = rebuild && !update;
  const isUpdate = update && !rebuild;

  if (isRebuild) {

    scripts.push(rebuildTableFilms);
    scripts.push(rebuildTableHalls);
    scripts.push(rebuildTableTickets);
    scripts.push(rebuildTableSchedules);
    scripts.push(rebuildTableLogs);
    scripts.push(addColumnsTableFilms);

  } else if (isCreate) {

    scripts.push(createTableFilms);
    scripts.push(createTableHalls);
    scripts.push(createTableTickets);
    scripts.push(createTableSchedules);
    scripts.push(createTableLogs);
    scripts.push(addColumnsTableFilms);

  } else if (isUpdate) {

    scripts.push(addColumnsTableFilms);

  }


  const runScript = new RunScripts({postgres});
  await runScript.run({scripts, transaction: true});

}
