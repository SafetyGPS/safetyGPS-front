const HTML_TAG_REGEX = /<[^>]*>/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;

const CITY_SUFFIXES = ['\uC2DC', '\uAD70']; // 시, 군
const DISTRICT_SUFFIXES = ['\uAD6C']; // 구
const NEIGHBORHOOD_SUFFIXES = ['\uB3D9', '\uC74D', '\uBA74', '\uB9AC']; // 동, 읍, 면, 리
const PROVINCE_NAME = '\uACBD\uAE30\uB3C4'; // 경기도

const hasSuffix = (value: string, suffixes: string[]) =>
  suffixes.some((suffix) => value.endsWith(suffix));

export interface AddressParts {
  address: string;
  sigunNm?: string;
  gu?: string;
  dong?: string;
  regionQuery: string;
}

export const sanitizeAddressText = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(HTML_TAG_REGEX, ' ')
    .replace(MULTIPLE_SPACES_REGEX, ' ')
    .trim();
};

export const extractAddressParts = (
  value?: string | null,
  fallbackDong?: string,
): AddressParts | null => {
  const sanitized = sanitizeAddressText(value);
  const tokens = sanitized ? sanitized.split(' ').filter(Boolean) : [];

  if (!tokens.length && !fallbackDong) {
    return null;
  }

  let sigunNm: string | undefined;
  let gu: string | undefined;
  let dong: string | undefined;

  tokens.forEach((token) => {
    if (!sigunNm && hasSuffix(token, CITY_SUFFIXES) && token !== PROVINCE_NAME) {
      sigunNm = token;
      return;
    }

    if (!gu && hasSuffix(token, DISTRICT_SUFFIXES)) {
      gu = token;
      return;
    }

    if (!dong && hasSuffix(token, NEIGHBORHOOD_SUFFIXES)) {
      dong = token;
    }
  });

  if (!dong && fallbackDong) {
    dong = fallbackDong;
  }

  if (!sigunNm) {
    const inferredCity = tokens.find((token) => hasSuffix(token, CITY_SUFFIXES));
    if (inferredCity && inferredCity !== PROVINCE_NAME) {
      sigunNm = inferredCity;
    }
  }

  if (!gu) {
    const inferredGu = tokens.find((token) => hasSuffix(token, DISTRICT_SUFFIXES));
    if (inferredGu) {
      gu = inferredGu;
    }
  }

  const addressText = sanitized || fallbackDong || '';
  const regionQuery = [sigunNm, gu, dong].filter(Boolean).join(' ').trim() || addressText;

  return {
    address: addressText,
    sigunNm,
    gu,
    dong,
    regionQuery,
  };
};
