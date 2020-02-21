export default function namesEqual({nameA, nameB}) {

  nameA = processName(nameA);
  nameB = processName(nameB);

  return nameA === nameB;

}

function processName(name) {

  name = name.trim().toLowerCase().replace(/ё/g, 'е');
  name = name.trim().replace(/э/g, 'е');

  return name;

}
