const emirateIconByKey = {
  dubai: '/emiratesIcon/dubai.png',
  abudhabi: '/emiratesIcon/abudhabi.png',
  ajman: '/emiratesIcon/ajman.png',
  sharjah: '/emiratesIcon/sharjah.png',
  fujairah: '/emiratesIcon/fujairah.png',
  rasalkhaimah: '/emiratesIcon/rasAlKhaaimah.png',
  ummalquwain: '/emiratesIcon/ummAlQuwain.png',
};

export const normalizeEmirateKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

export const getEmirateIcon = (value) => {
  const key = normalizeEmirateKey(value);
  return emirateIconByKey[key] || '';
};

export const resolveClientTypeIcon = (item, parent) => {
  const type = String(item?.type || '').toLowerCase();
  const parentType = String(parent?.type || '').toLowerCase();
  const relationship = String(item?.relationship || '').toLowerCase();

  const emirateIcon =
    getEmirateIcon(item?.registeredEmirate) ||
    getEmirateIcon(item?.poBoxEmirate) ||
    getEmirateIcon(parent?.registeredEmirate) ||
    getEmirateIcon(parent?.poBoxEmirate);
  if (emirateIcon) return emirateIcon;

  if (type === 'company') return '/company.png';
  if (type === 'individual') return '/individual.png';
  if (parentType === 'company' || relationship === 'employee') return '/employee.png';
  return '/dependent.png';
};
