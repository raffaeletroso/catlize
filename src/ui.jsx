import React from 'react';
import { Icon } from './icons.jsx';

export function Thumb({ label, icon = 'image', style, className = '', showIcon = true }) {
  return (
    <div className={`cz-ph ${className}`} style={style}>
      <span className="cz-ph-label">
        {showIcon && <Icon name={icon} size={13} stroke={2} />}
        {label}
      </span>
    </div>
  );
}

export function BarcodeBars() {
  const bars = React.useMemo(() => (
    Array.from({ length: 34 }, () => 2 + Math.round(Math.random() * 5))
  ), []);
  return (
    <div className="cz-fakecode" aria-hidden="true">
      {bars.map((w, i) => (
        <i key={i} style={{ width: w + 'px', height: (28 + ((i * 37) % 26)) + 'px' }} />
      ))}
    </div>
  );
}
