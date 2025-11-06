# 🛰️ SafetyGPS

> **시민의 야간 보행 안전을 돕고 치안을 강화하기 위한 지도 기반 웹 플랫폼**

---

## 📘 프로젝트 개요

최근 1~2년간 **한국형사정책연구원(KICJ)** 조사에 따르면,  
폭력범죄 피해는 주로 **오후 6시부터 자정(18:00–24:00)** 사이에  
가장 많이 발생하는 것으로 나타났습니다.  

또한 성인 여성의 <b>63%</b>가 야간 보행 중  
**성폭력·성희롱 피해에 대한 불안감**을 느낀다고 응답했습니다.   

이러한 사회적 배경 속에서 **‘SafetyGPS’** 프로젝트는  
실제 **가로등, 치안 센터, CCTV** 위치 정보를 기반으로  
야간 보행의 **안전도를 시각화한 지도 플랫폼**을 제공합니다.

---

## 💡 주요 기능 (Key Features)

1. **실시간 안전 지도 표시**
   - 실제 **가로등, 치안 센터, CCTV 위치** 데이터를 지도 위에 시각화  
   - 주변 환경에 따른 **안전 점수(Safety Score)** 제공

2. **LLM 기반 위험도 분석**
   - 대규모 언어모델(LLM)을 활용하여  
     사용자의 위치 기반으로 **지역별 치안 위험도 분석 및 안내**

3. **참여형 커뮤니티 시스템**
   - 사용자가 직접 **별점 평가 및 의견 제공**  
   - 데이터 신뢰도 향상 및 지역 안전성 개선에 기여

---

## 🛠️ 기술 스택 (Tech Stack)

| 분야 | 기술 |
|------|------|
| Frontend | **React**, **TypeScript**, **Vanila-extract** |
| Package Manager | **pnpm** |
| Version Control | **GitHub** |

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=Typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![vanilaextract](https://img.shields.io/badge/Vanilla_Extract-F786AD?style=flat-square&logo=vanillaextract&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

- global vars 기반 편리한 스타일링 적용 및 타입 안정성 기능 사용을 위해 스타일링 도구로 `vanilla-extract`를 선택하였습니다.
---

## 👥 팀 구성 (Team)

| 이름 | 역할 |
|------|------|
| **박준서** | UI 설계 및 프론트엔드 개발, 기능 점검 및 유지보수 |
| **김현섭** | UI 설계 및 프론트엔드 개발, 기능 점검 및 유지보수 |

---

## 🚀 향후 개선 계획 (Future Plans)

| 주차 | 계획 내용 |
|------|------------|
| **1주차** | 지도 API 연동 및 기본 UI 구성 |
| **2주차** | 가로등, CCTV, 치안 센터 위치 표시 기능 구현 |
| **3주차** | LLM 기반 위험도 분석 기능 추가 |
| **4주차** | 사용자 참여형 커뮤니티 시스템 구축 및 최종 점검 |

---

## 🗺️ 프로젝트 목표 (Goal)

> “야간 보행자에게 **실시간 안전 정보를 제공**하고,  
> **지역 사회의 치안 인식 개선**에 기여하는 스마트 지도 플랫폼 구축”

---

## 📄 라이선스 (License)

This project is licensed under the **MIT License**.  
자유롭게 수정 및 배포가 가능합니다.

---

### 🌐 Repository Information

- **Repository Name**: `safetygps`
- **Visibility**: Public
- **License**: MIT  
- **Initialized with**: ✅ README / ✅ .gitignore (Node) / ✅ License

---

### 🖋️ 작성자

**Team SafetyGPS**  
> “안전한 밤길, 우리의 기술로 밝혀갑니다.”

---

### 📚 참고 자료 (References)

- [한국형사정책연구원 — 전국범죄피해조사 2022~2023](https://kicj.re.kr/board.es?act=view&bid=0001&list_no=14021&mid=a10101000000&tag=)
