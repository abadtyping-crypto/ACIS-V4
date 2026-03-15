export const INDIVIDUAL_RELATION_ICON_BASE_PATH = '/individualRelations';

export const COMPANY_RELATION_OPTIONS = [
  { value: 'employee', label: 'Employee', icon: '/employee.png' },
  { value: 'investor', label: 'Investor', icon: '/onboardingIcons/investor.svg' },
  { value: 'partner', label: 'Partner', icon: '/onboardingIcons/partner.svg' },
];

export const INDIVIDUAL_RELATION_OPTIONS = [
  { value: 'wife', label: 'Wife', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/wife.png` },
  { value: 'husband', label: 'Husband', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/husband.png` },
  { value: 'son', label: 'Son', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/son.png` },
  { value: 'daughter', label: 'Daughter', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/daughter.png` },
  { value: 'father', label: 'Father', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/father.png` },
  { value: 'mother', label: 'Mother', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/mother.png` },
  { value: 'domestic worker', label: 'Domestic Worker', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/domestic worker.png` },
  { value: 'boy', label: 'Boy', icon: `${INDIVIDUAL_RELATION_ICON_BASE_PATH}/boy.png` },
];

export const normalizeRelationValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const getRelationOptionsForParentType = (parentType) =>
  String(parentType || '').toLowerCase() === 'company'
    ? COMPANY_RELATION_OPTIONS
    : INDIVIDUAL_RELATION_OPTIONS;

export const findRelationOption = (value, parentType) => {
  const normalizedValue = normalizeRelationValue(value);
  return getRelationOptionsForParentType(parentType).find(
    (item) => normalizeRelationValue(item.value) === normalizedValue,
  ) || null;
};

export const getRelationIcon = (value, parentType = 'individual') =>
  findRelationOption(value, parentType)?.icon || '';
