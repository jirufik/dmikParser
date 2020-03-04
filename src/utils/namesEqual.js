export default function namesEqual({nameA, nameB}) {

  nameA = processName(nameA);
  nameB = processName(nameB);

  // return nameA === nameB;
  let isEqual = nameA.includes(nameB);
  if (!isEqual) isEqual = nameB.includes(nameA);

  return isEqual;

}

function processName(name) {

  name = name.trim().toLowerCase().replace(/ё/g, 'е');
  name = name.trim().replace(/э/g, 'е');

  return name;

}
