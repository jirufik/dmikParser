export default function processUrlQuery({query}) {

  query = query.trim().toLowerCase().replace(/(2d)/g, '');
  query = query.replace(/(3d)/g, '');

  return query;

}
