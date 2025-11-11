import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const ENV_FILE = join(ROOT_DIR, '.env');
const ENV_EXAMPLE_FILE = join(ROOT_DIR, '.env.example');
const ENV_LOCAL_FILE = join(ROOT_DIR, '.env.local');

// 개발용 기본 API 키값 (프로젝트 공통 키)
// ⚠️ 주의: 이 키는 개발/테스트용이며, 프로덕션에서는 개별 키를 사용해야 합니다.
const DEFAULT_KEYS = {
  VITE_VWORLD_API_KEY: '6BBBB65E-AEEF-3351-A3E2-98D77ED68BB3',
  VITE_KAKAO_JS_KEY: '8d52864d50257802a4d9a556f6f25e31',
};

function setupEnv() {
  // .env 파일이 이미 있으면 건너뛰기
  if (existsSync(ENV_FILE)) {
    console.log('✅ .env 파일이 이미 존재합니다.');
    return;
  }

  // 환경 변수에서 먼저 읽기 (CI/CD 또는 로컬 환경 변수)
  const vworldKey = process.env.VITE_VWORLD_API_KEY;
  const kakaoKey = process.env.VITE_KAKAO_JS_KEY;

  // .env.local 파일이 있으면 거기서 읽기
  let localKeys = {};
  if (existsSync(ENV_LOCAL_FILE)) {
    try {
      const localContent = readFileSync(ENV_LOCAL_FILE, 'utf-8');
      const vworldMatch = localContent.match(/VITE_VWORLD_API_KEY=(.+)/);
      const kakaoMatch = localContent.match(/VITE_KAKAO_JS_KEY=(.+)/);
      if (vworldMatch) localKeys.VITE_VWORLD_API_KEY = vworldMatch[1].trim();
      if (kakaoMatch) localKeys.VITE_KAKAO_JS_KEY = kakaoMatch[1].trim();
    } catch {
      // 무시
    }
  }

  // 우선순위: 환경 변수 > .env.local > 기본 키값 > 플레이스홀더
  const finalVworldKey = vworldKey || localKeys.VITE_VWORLD_API_KEY || DEFAULT_KEYS.VITE_VWORLD_API_KEY;
  const finalKakaoKey = kakaoKey || localKeys.VITE_KAKAO_JS_KEY || DEFAULT_KEYS.VITE_KAKAO_JS_KEY;

  let envContent = '';

  // .env.example이 있으면 복사, 없으면 기본 템플릿 생성
  if (existsSync(ENV_EXAMPLE_FILE)) {
    envContent = readFileSync(ENV_EXAMPLE_FILE, 'utf-8');
    // 플레이스홀더를 실제 키값으로 교체
    envContent = envContent.replace(
      /VITE_VWORLD_API_KEY=.*/g,
      `VITE_VWORLD_API_KEY=${finalVworldKey}`
    );
    envContent = envContent.replace(
      /VITE_KAKAO_JS_KEY=.*/g,
      `VITE_KAKAO_JS_KEY=${finalKakaoKey}`
    );
  } else {
    // .env.example이 없으면 기본 템플릿 생성
    envContent = `# V-World API 키
# 발급: https://www.vworld.kr/dev/v4dev_guide.do
VITE_VWORLD_API_KEY=${finalVworldKey}

# 카카오 지도 API 키
# 발급: https://developers.kakao.com/
# JavaScript 키: 지도 SDK 로드용
VITE_KAKAO_JS_KEY=${finalKakaoKey}
`;
  }

  writeFileSync(ENV_FILE, envContent, 'utf-8');
  console.log('✅ .env 파일이 자동으로 생성되었습니다!');
  
  if (finalVworldKey === DEFAULT_KEYS.VITE_VWORLD_API_KEY && finalKakaoKey === DEFAULT_KEYS.VITE_KAKAO_JS_KEY) {
    console.log('📝 기본 개발용 키가 설정되었습니다. 바로 개발을 시작할 수 있습니다!');
  } else if (vworldKey || kakaoKey) {
    console.log('📝 환경 변수에서 키를 가져왔습니다.');
  } else if (localKeys.VITE_VWORLD_API_KEY || localKeys.VITE_KAKAO_JS_KEY) {
    console.log('📝 .env.local에서 키를 가져왔습니다.');
  }
}

setupEnv();

