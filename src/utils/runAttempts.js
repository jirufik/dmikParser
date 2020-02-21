import isAsync from "./isAsync";

export default async function runAttempts({func, attempts}) {

  if (typeof func !== 'function') return;

  let error = null;

  for (let i = 0; i < attempts; i++) {

    try {

      const res = isAsync(func) ? await func() : func();
      return res;

    } catch (e) {

      error = e;

    }

  }

  if (error) throw error;

}

