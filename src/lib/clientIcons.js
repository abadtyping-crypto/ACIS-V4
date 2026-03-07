const emirateIconByKey = {
  dubai: '/emiratesIcon/dubai.png',
  abudhabi: '/emiratesIcon/abudhabi.png',
  ajman: '/emiratesIcon/ajman.png',
  sharjah: '/emiratesIcon/sharjah.png',
  fujairah: '/emiratesIcon/fujairah.png',
  rasalkhaimah: '/emiratesIcon/rasAlKhaaimah.png',
  ummalquwain: '/emiratesIcon/ummAlQuwain.png',
};

const relationIconByKey = {
  employee: '/employee.png',
  investor: '/onboardingIcons/investor.svg',
  partner: '/onboardingIcons/partner.svg',
  wife: '/onboardingIcons/wife.svg',
  husband: '/onboardingIcons/husband.svg',
  son: '/onboardingIcons/son.svg',
  daughter: '/onboardingIcons/daughter.svg',
  father: '/onboardingIcons/father.svg',
  mother: '/onboardingIcons/mother.svg',
  domesticworker: '/onboardingIcons/domesticWorker.svg',
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
  const relationshipRaw = String(item?.relationship || item?.relation || '').toLowerCase();
  const relationshipKey = relationshipRaw.replace(/\s+/g, '');

  const emirateIcon =
    getEmirateIcon(item?.registeredEmirate) ||
    getEmirateIcon(item?.poBoxEmirate) ||
    getEmirateIcon(parent?.registeredEmirate) ||
    getEmirateIcon(parent?.poBoxEmirate);
  if (emirateIcon) return emirateIcon;

  if (type === 'company') return '/company.png';
  if (type === 'individual') return '/individual.png';
  if (relationIconByKey[relationshipKey]) return relationIconByKey[relationshipKey];
  if (parentType === 'company' || relationshipKey === 'employee') return '/employee.png';
  return '/dependent.png';
};
