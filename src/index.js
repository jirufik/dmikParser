import dmikParse from "./parser";
import ConnectorPG from "./db/conectorPG";
import pathExists from 'jrf-path-exists'
import Halls from "./model/Halls";
import Tickets from "./model/Tickets";
import Films from "./model/Films";
import Schedules from "./model/Schedules";
import Logs from "./model/Logs";
import moment from "moment";
import generateId from "./utils/generateId";
import TMDB from "./tmdb";

const config = require("../config");

const TIMEOUT = config.timeouts.updateFilms;

async function updateFilms() {

  const processId = generateId();

  const host = pathExists(config, 'postgres.host');
  const port = pathExists(config, 'postgres.port');
  const user = pathExists(config, 'postgres.user');
  const password = pathExists(config, 'postgres.password');
  const database = pathExists(config, 'postgres.database');

  const postgres = new ConnectorPG({host, port, user, password, database});
  await postgres.testConnect();

  const logs = new Logs({postgres, processId});
  const tmdb = new TMDB({logs});
  const start = Date.now();

  await logs.add({type: 'info', log: 'start parse'});

  try {

    await logs.add({type: 'info', log: 'start parse dmik'});

    const dataFilms = await dmikParse({logs});

    const endParse = Date.now();
    await logs.add({type: 'info', log: 'end parse dmik', data: {time: endParse - start}});

    if (!dataFilms || !dataFilms.length) return;

    const startAddFilms = Date.now();
    await logs.add({type: 'info', log: 'start add films'});

    const cache = {
      halls: [],
      tickets: []
    };

    const getFromCache = ({findName, typeCache}) => {

      if (!findName || !typeCache) return;

      const arr = cache[typeCache];
      if (!arr || !arr.length) return;

      const el = arr.find(el => el.name === findName);
      return el;

    };

    const hallsModel = new Halls({postgres});
    const ticketsModel = new Tickets({postgres});
    const filmsModel = new Films({postgres});
    const schedulesModel = new Schedules({postgres});

    for (const dataFilm of dataFilms) {

      try {
        await addFilm({dataFilm, filmsModel, tmdb, logs});
      } catch (e) {
        console.error(e);
        await logs.add({type: 'error', log: `Error in addFilm: ${e.message}`, data: {error: e.stack, dataFilm}});
        continue;
      }

      const schedule = dataFilm.schedule;
      if (!schedule || !schedule.length) continue;

      try {
        const codeFilm = Number(dataFilm.code);
        await schedulesModel.del({codeFilm});
      } catch (e) {
        console.error(e);
        await logs.add({type: 'error', log: `Error in del schedules: ${e.message}`, data: {error: e.stack, dataFilm}});
        continue;
      }

      for (const date of schedule) {

        const sessions = date.sessions;

        if (!sessions || !sessions.length) continue;

        for (const session of sessions) {

          const hall = session.hall;
          const time = session.time;
          const tickets = session.tickets;
          let hallId = null;
          let ticketId = null;

          if (hall) {

            try {

              const name = hall.type;
              const description = hall.description;

              const cacheEl = getFromCache({findName: name, typeCache: 'halls'});
              if (!cacheEl) {
                const hallRows = await hallsModel.add({name, description});
                hallId = pathExists(hallRows, '[0].id');
                cache.halls.push({name, id: hallId});
              } else {
                hallId = cacheEl.id;
              }

            } catch (e) {
              console.error(e);
              await logs.add({type: 'error', log: `Error in addHall: ${e.message}`, data: {error: e.stack, hall}});
              continue;
            }

          }

          if (tickets) {

            for (const ticket of tickets) {

              const cost = ticket.cost;

              try {

                const name = ticket.type;
                const description = ticket.description;

                const cacheEl = getFromCache({findName: name, typeCache: 'tickets'});
                if (!cacheEl) {
                  const ticketRows = await ticketsModel.add({name, description});
                  ticketId = pathExists(ticketRows, '[0].id');
                  cache.tickets.push({name, id: ticketId});
                } else {
                  ticketId = cacheEl.id;
                }

              } catch (e) {
                console.error(e);
                await logs.add({
                  type: 'error',
                  log: `Error in addTicket: ${e.message}`,
                  data: {error: e.stack, session}
                });
                continue;
              }

              try {

                await addSchedule({
                  filmCode: dataFilm.code,
                  date: date.date,
                  time,
                  hallId,
                  ticketId,
                  cost,
                  schedulesModel
                });

              } catch (e) {
                console.error(e);
                await logs.add({
                  type: 'error',
                  log: `Error in addSchedule: ${e.message}`,
                  data: {error: e.stack, schedule}
                });
              }

            }

          }

        }

      }

    }

    await logs.add({type: 'info', log: 'end add films', data: {time: Date.now() - startAddFilms}});

  } catch (e) {

    console.error(e);
    await logs.add({type: 'error', log: e.message, data: {error: e.stack}});

  } finally {

    try {

      await logs.add({type: 'info', log: 'end parse', data: {time: Date.now() - start}});
      await postgres.end();

    } catch (e) {

      console.error(e);

    }

  }

}

async function addSchedule({date, filmCode, time, hallId, ticketId, cost, schedulesModel}) {

  date = moment(`${date.month + 1}-${date.day}-${date.year} ${time}:00`, 'MM-DD-YYYY HH:mm:ss');
  date = date.format('YYYY-MM-DD HH:mm:ss');
  cost = Number(cost);
  await schedulesModel.add({date, filmCode, hallId, ticketId, cost});

}

async function addFilm({dataFilm, filmsModel, tmdb, logs}) {

  if (!dataFilm || typeof dataFilm !== 'object') return;

  const code = Number(dataFilm.code);
  const name = dataFilm.name || '';
  const year = Number(dataFilm.year);
  const tagline = dataFilm.tagline || '';
  const country = pathExists(dataFilm, 'country', '').split(',').map(el => el.trim());
  const age = Number(dataFilm.age || 0);
  const about = dataFilm.about || '';
  const genre = pathExists(dataFilm, 'genre', '').split(',').map(el => el.trim().toLowerCase());
  const producer = dataFilm.producer || '';
  const img = dataFilm.img || '';
  const data = dataFilm;

  const film = {code, name, year, tagline, country, age, about, genre, producer, img, data};
  await updateInfoFromTMDB({film, tmdb, logs});

  await filmsModel.add(film);

}

async function updateInfoFromTMDB({film, tmdb, logs}) {

  try {

    const info = await tmdb.getInfo({name: film.name, year: film.year});

    if (!info) {

      if (!film.idTmdb) film.idTmdb = 0;
      if (!film.vote) film.vote = 0;
      if (!film.runtime) film.runtime = 0;
      if (!film.originalName) film.originalName = '';

      return;
    }

    film.idTmdb = info.id;
    film.img = info.img;
    film.vote = info.vote;
    film.runtime = info.runtime;
    film.tagline = info.tagline;
    film.originalName = info.originalName;

    if (info.genres) {
      film.genre = [...info.genres]
    }

  } catch (e) {
    await logs.add({type: 'error', log: `Error in updateInfoFromTMDB: ${e.message}`, data: {error: e.stack, film}});
  }

}

setInterval(async () => {
  await updateFilms();
}, TIMEOUT);
