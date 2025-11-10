import { CSSProperties } from 'react';

export const OUTER_WRAPPER_STYLE: CSSProperties = {
  position: 'absolute',
  top: 32,
  right: 32,
  width: 360,
  maxWidth: 'calc(100% - 48px)',
  zIndex: 1100,
};

export const DEFAULT_DELTA = { lat: 0.0045, lng: 0.0055 };

