import Nightmare from 'nightmare'

const config = require("../../config");

const TIMEOUT = config.timeouts.parse;
const URL = config.url;

async function getFilms(n) {

  const films = await n.evaluate(() => {

    const films = [];
    const tags = document.querySelectorAll('body > div.container > div.workplace > div.main > .main_block');
    for (const tag of tags) {

      const age = parseInt(tag.querySelector(' div > span.limit').innerHTML);
      const url = tag.querySelector(' div > a').href;
      const img = tag.querySelector(' div > a > img').src;
      const code = Number(url.match(/[0-9]{4,6}/)[0]);

      const film = {age, url, img, code};

      films.push(film);

    }

    return films;

  });

  return films;

}

async function fillFilm(n) {

  const params = await n.evaluate(() => {

    const name = document.querySelector('body > div.container > div.workplace > div.main > div span').innerHTML;

    let blocks = document.querySelector('body > div.container > div.workplace > div.main > p').innerHTML;
    blocks = blocks.split('<b>');

    const paramsMap = {
      год: 'year',
      страна: 'country',
      слоган: 'tagline',
      ограничения: 'limit',
      жанр: 'genre',
      режиссер: 'producer',
      'о фильме': 'about'
    };

    const monthsMap = {
      'января': 0,
      'февраля': 1,
      'марта': 2,
      'апреля': 3,
      'мая': 4,
      'июня': 5,
      'июля': 6,
      'августа': 7,
      'сентября': 8,
      'октября': 9,
      'ноября': 10,
      'декабря': 11
    };

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    const res = {
      name,
      schedule: []
    };

    for (let block of blocks) {

      if (block.includes('<img')) continue;

      block = block.replace(/<br>\n/g, '');
      block = block.split(':</b> ');
      if (block.length !== 2) continue;

      res[paramsMap[block[0].trim().toLowerCase()]] = block[1].replace(/<br>/g, '');

    }

    let scheduleTable;
    let scheduleRows;
    try {
      scheduleTable = document.querySelector('body > div.container > div.workplace > div.main > div.PricesBlock > table > tbody');
      scheduleRows = scheduleTable.querySelectorAll('tr');
    } catch (e) {
      return res;
    }

    let date = null;
    let sessions = [];

    for (let i = 0; i < scheduleRows.length; i++) {

      let cells = scheduleRows[i].querySelectorAll('td');

      if (cells.length === 1) {

        if (date) res.schedule.push({date: {...date}, sessions: [...sessions]});

        date = cells[0].innerHTML.split('</b>');
        date = date[1].trim();
        date = date.replace(/\(/g, '');
        date = date.replace(/\)/g, '');
        date = date.split(' ');
        const month = monthsMap[date[1].toLowerCase()];
        date = {day: +date[0], month, year: nowYear};

        const endYear = nowMonth === 10 || nowMonth === 11;
        const youngMonth = month < 2;
        if (endYear && youngMonth) {
          date.year = nowYear + 1;
        }

        sessions = [];

        continue;
      }

      const time = cells[1].innerHTML;

      const tickets = [];
      const hall = {type: '', description: ''};

      for (let j = 2; j < 6; j++) {

        const cell = cells[j];
        const className = cell.className;

        if (className === 'price') {

          const ticket = cell.querySelector('a');
          const cost = Number(ticket.textContent);
          if (!cost) continue;

          let title = ticket.title;
          title = title.replace(/<b>/g, '');
          title = title.replace(/<\/b>/g, '');
          title = title.replace(/\n/g, '');
          title = title.split('<br>');

          if (!title.length) continue;

          const type = title.shift();
          const description = title.join('');

          tickets.push({cost, type, description});

          continue;
        }

        if (className === 'hall') {

          const typeHall = cell.querySelector('a');
          const type = typeHall.textContent;
          if (!type) continue;

          hall.type = type;
          hall.description = typeHall.title;

        }

      }

      sessions.push({time, hall: {...hall}, tickets: [...tickets]});

    }

    res.schedule.push({date: {...date}, sessions: [...sessions]});

    return res;

  });

  return params;

}

async function dmikParse({logs}) {

  let n;
  try {

    const nightmare = Nightmare({show: false});
    n = nightmare.goto(URL);
    await n.wait(TIMEOUT);

    const dataFilms = [];

    // Get films
    let films;
    try {

      films = await getFilms(n);

    } catch (e) {

      console.error(e);
      await logs.add({type: 'error', log: `Error in getFilms: ${e.message}`, data: {error: e.stack}});

    }
    if (!films || !films.length) return dataFilms;
    await logs.add({type: 'info', log: `Get ${films.length} films`});

    // Fill films
    for (const film of films) {

      n = nightmare.goto(film.url);
      await n.wait(TIMEOUT);

      let params;
      try {

        params = await fillFilm(n);

      } catch (e) {

        console.error(e);
        await logs.add({type: 'error', log: `Error in fillFilm: ${e.message}`, data: {error: e.stack, film}});
        continue;

      }

      dataFilms.push({...film, ...params});

    }

    return dataFilms;

  } catch (err) {

    console.error(err);

  } finally {

    if (n) {
      await n.end();
    }

  }

}

export default dmikParse;
