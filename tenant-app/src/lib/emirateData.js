export const EMIRATE_ICON_BASE_PATH = '/emiratesIcon';

export const EMIRATE_OPTIONS = [
  { value: 'Dubai', label: 'Dubai', icon: `${EMIRATE_ICON_BASE_PATH}/dubai.png` },
  { value: 'Abu Dhabi', label: 'Abu Dhabi', icon: `${EMIRATE_ICON_BASE_PATH}/abudhabi.png` },
  { value: 'Sharjah', label: 'Sharjah', icon: `${EMIRATE_ICON_BASE_PATH}/sharjah.png` },
  { value: 'Ajman', label: 'Ajman', icon: `${EMIRATE_ICON_BASE_PATH}/ajman.png` },
  { value: 'Fujairah', label: 'Fujairah', icon: `${EMIRATE_ICON_BASE_PATH}/fujairah.png` },
  { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah', icon: `${EMIRATE_ICON_BASE_PATH}/rasAlKhaaimah.png` },
  { value: 'Umm Al Quwain', label: 'Umm Al Quwain', icon: `${EMIRATE_ICON_BASE_PATH}/ummAlQuwain.png` },
];

export const findEmirateOption = (value) =>
  EMIRATE_OPTIONS.find((item) => item.value === value) || null;
