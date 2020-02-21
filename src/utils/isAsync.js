export default function isAsync(func) {

  let args = /\(\s*([^)]+?)\s*\)/.exec(func.toString());
  if (!args) args = /\(\)/.exec(func.toString());

  const isAsync = /^async/.test(args.input);

  return isAsync;

}
