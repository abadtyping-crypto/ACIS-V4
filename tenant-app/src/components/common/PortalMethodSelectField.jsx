import { useMemo } from 'react';
import IconSelect from './IconSelect';
import { resolveDefaultTransactionMethodIcon, resolvePortalMethodDefinitions } from '../../lib/transactionMethodConfig';

const PortalMethodSelectField = ({
  label = 'Transaction Method',
  value = '',
  onChange,
  portal = null,
  placeholder = 'Select Method',
  disabled = false,
}) => {
  const options = useMemo(() => (
    resolvePortalMethodDefinitions(portal?.customMethods || [])
      .filter((method) => Array.isArray(portal?.methods) && portal.methods.includes(method.id))
      .map((method) => ({
        value: method.id,
        label: method.label || method.id,
        icon: method.iconUrl || resolveDefaultTransactionMethodIcon(method.id) || method.Icon || null,
      }))
  ), [portal]);

  return (
    <div>
      <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{label}</label>
      <div className="mt-1">
        <IconSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default PortalMethodSelectField;
