# MeetAt.app - Acceptance Tests

**Version**: 1.0
**Last Updated**: 2025-12-14
**Test Approach**: End-to-End Scenario-based Testing

---

## 📋 Test Overview

이 문서는 MeetAt.app의 인수 테스트(Acceptance Tests)를 정의합니다. 실제 사용자 시나리오를 기반으로 전체 애플리케이션의 통합 동작을 검증합니다.

### Test Environment
- **Browser**: Chromium (Playwright)
- **Test Framework**: Playwright + Vitest
- **Scope**: End-to-End User Flows

---

## 🎯 Test Scenarios

### Scenario 1: 채용 인터뷰 일정 조율 (Primary Use Case)

**참여자**:
- 인사담당자 김민수 (이벤트 생성자, 일정 확정자)
- 면접관 A 박지영 (내부 담당자 1)
- 면접관 B 이준호 (내부 담당자 2)
- 지원자 최수진 (외부 참여자)

**비즈니스 목표**:
4명이 모두 참석 가능한 면접 시간을 찾아 확정하기

**시나리오 흐름**:

```
1. [이벤트 생성] 인사담당자 김민수
   └─> 이벤트명: "백엔드 개발자 면접 - 최수진님"
   └─> 소요시간: 90분
   └─> 후보 날짜: 2025-12-16 (월), 2025-12-17 (화)
   └─> 시간대: 09:00 - 18:00
   └─> 점심시간 제외: 12:00 - 13:00
   └─> 비밀번호 설정: "interview2025"

2. [내부 일정 입력] 인사담당자가 면접관들의 일정 확인 후 대리 입력
   a) 박지영 면접관의 가능 시간 입력
      - 2025-12-16: 09:00-12:00, 14:00-16:00
      - 2025-12-17: 09:00-11:00, 15:00-18:00

   b) 이준호 면접관의 가능 시간 입력
      - 2025-12-16: 10:00-12:00, 13:00-15:00
      - 2025-12-17: 09:00-12:00, 14:00-16:00

   c) 김민수 본인의 가능 시간 입력
      - 2025-12-16: 09:00-18:00 (종일 가능)
      - 2025-12-17: 09:00-18:00 (종일 가능)

3. [필수 참여자 설정]
   └─> 김민수, 박지영, 이준호를 필수 참여자로 지정 (⭐)
   └─> 지원자는 선택 참여자로 유지 (최종 일정 조정 가능성 고려)

4. [URL 공유] 이벤트 URL을 지원자에게 공유
   └─> 이메일/메신저로 URL 전송
   └─> QR 코드 생성하여 공유

5. [지원자 일정 입력] 최수진 지원자가 URL 접속
   └─> 비밀번호 입력: "interview2025"
   └─> 본인의 가능 시간 입력:
       - 2025-12-16: 09:00-11:00, 14:00-18:00
       - 2025-12-17: 09:00-18:00 (종일 가능)

6. [결과 확인] 인사담당자가 결과 화면 확인
   └─> 히트맵에서 모든 필수 참여자가 가능한 시간 확인
   └─> 타임라인에서 최적 시간대 확인
   └─> 4명 모두 가능: 2025-12-16 10:00-11:30 (90분)
   └─> 4명 모두 가능: 2025-12-17 09:00-10:30 (90분)

7. [시간 확정] 인사담당자가 최종 시간 확정
   └─> 2025-12-16 10:00-11:30 선택
   └─> 확정자: "김민수"
   └─> 메모: "1층 회의실 A에서 진행 예정입니다. 이력서와 포트폴리오를 지참해 주세요."

8. [확정 확인] 모든 참여자가 확정된 시간 확인
   └─> 노란색 배너로 확정 시간 표시
   └─> 확정 세부사항 (날짜, 시간, 장소, 메모) 확인
```

---

## ✅ Acceptance Criteria

### AC-1: 이벤트 생성 및 설정
- [ ] 이벤트 이름, 소요시간, 날짜 범위를 올바르게 설정할 수 있다
- [ ] 시간 범위와 점심시간 제외가 정확히 적용된다
- [ ] 비밀번호 설정 후 이벤트에 접근할 때 인증이 요구된다
- [ ] 이벤트 생성 후 고유 URL이 생성된다

### AC-2: 투표 (일정 입력)
- [ ] 여러 참여자가 각자의 이름으로 투표할 수 있다
- [ ] 동일한 이름으로 중복 투표가 차단된다 (대소문자 무시)
- [ ] 참여자가 본인의 투표를 수정/삭제할 수 있다
- [ ] 시간대별 선택이 올바르게 저장된다
- [ ] 대량 선택 (전체, 오전, 오후, 초기화) 기능이 정상 작동한다

### AC-3: 필수 참여자 필터링
- [ ] 참여자를 필수로 지정할 수 있다 (⭐ 표시)
- [ ] 필수 참여자가 모두 가능한 시간만 결과에 표시된다
- [ ] 필수 참여자 필터가 히트맵과 타임라인 모두에 적용된다
- [ ] 필터 상태가 시각적으로 명확히 표시된다

### AC-4: 결과 시각화
- [ ] 히트맵에서 참여 가능 인원수가 색상으로 구분된다
- [ ] 타임라인에서 연속된 시간대가 하나의 블록으로 표시된다
- [ ] 최소 소요시간을 만족하는 블록만 표시된다
- [ ] 참여자 상세 정보가 툴팁/확장 화면에 표시된다

### AC-5: 시간 확정
- [ ] 최적 시간대 중 하나를 선택하여 확정할 수 있다
- [ ] 확정 시 확정자 이름과 메모를 입력할 수 있다
- [ ] 확정된 시간이 노란색 배너로 강조 표시된다
- [ ] 확정된 시간 정보 (날짜, 시간, 확정자, 메모)가 모두 표시된다
- [ ] 확정을 취소할 수 있다

### AC-6: URL 공유
- [ ] 이벤트 URL을 클립보드에 복사할 수 있다
- [ ] QR 코드를 생성하여 표시할 수 있다
- [ ] QR 코드를 이미지로 다운로드할 수 있다
- [ ] 공유된 URL로 접속 시 동일한 이벤트에 접근된다

### AC-7: 데이터 영속성
- [ ] 이벤트 데이터가 LocalStorage에 저장된다
- [ ] 페이지 새로고침 후에도 데이터가 유지된다
- [ ] 브라우저 탭을 닫았다가 다시 열어도 데이터가 유지된다

---

## 🧪 Test Cases

### TC-001: 채용 인터뷰 일정 조율 (E2E)
**Priority**: 🔴 Critical
**Type**: End-to-End Integration Test

**Given**: 인사담당자가 4명의 면접 일정을 조율하려고 한다

**When**:
1. 인사담당자가 새 이벤트를 생성한다
2. 내부 면접관 2명의 일정을 대리 입력한다
3. 본인의 일정을 입력한다
4. 3명을 필수 참여자로 지정한다
5. URL을 지원자에게 공유한다
6. 지원자가 URL로 접속하여 본인 일정을 입력한다
7. 인사담당자가 결과를 확인한다
8. 4명 모두 가능한 시간대 중 하나를 확정한다

**Then**:
- ✅ 4명의 투표가 모두 정상적으로 저장된다
- ✅ 필수 참여자 필터가 정확히 작동한다
- ✅ 히트맵과 타임라인에 4명 모두 가능한 시간이 표시된다
- ✅ 시간 확정 후 노란색 배너로 표시된다
- ✅ 확정 정보 (확정자, 메모)가 모두 표시된다

---

### TC-002: 비밀번호 보호 검증
**Priority**: 🔴 High
**Type**: Security Test

**Given**: 비밀번호가 설정된 이벤트가 존재한다

**When**:
1. 사용자가 이벤트 URL로 접속한다
2. 잘못된 비밀번호를 입력한다
3. 올바른 비밀번호를 입력한다

**Then**:
- ✅ 잘못된 비밀번호로는 접근이 차단된다
- ✅ 5회 실패 시 30분간 잠금된다
- ✅ 올바른 비밀번호로 이벤트에 접근할 수 있다

---

### TC-003: 중복 투표 방지
**Priority**: 🟡 Medium
**Type**: Validation Test

**Given**: 이미 "김민수" 이름으로 투표가 존재한다

**When**:
1. 다른 사용자가 "김민수" 이름으로 투표를 시도한다
2. "김MIN수" (대소문자 다름)로 투표를 시도한다

**Then**:
- ✅ 정확히 같은 이름의 투표가 차단된다
- ✅ 대소문자를 다르게 한 투표도 차단된다
- ✅ 에러 메시지가 표시된다

---

### TC-004: 투표 수정 및 삭제
**Priority**: 🟡 Medium
**Type**: CRUD Test

**Given**: "박지영" 이름으로 투표가 존재한다

**When**:
1. 박지영이 본인의 투표를 수정한다
2. 박지영이 본인의 투표를 삭제한다

**Then**:
- ✅ 투표 수정이 정상적으로 반영된다
- ✅ 결과 화면에 수정된 내용이 표시된다
- ✅ 투표 삭제 후 결과에서 제거된다

---

### TC-005: 필수 참여자 필터링 정확성
**Priority**: 🔴 High
**Type**: Logic Test

**Given**:
- 4명의 투표가 존재한다
- A, B, C가 필수 참여자로 지정되었다
- A는 슬롯1,2,3 가능
- B는 슬롯2,3,4 가능
- C는 슬롯3,4,5 가능
- D는 슬롯1,2,3,4,5 모두 가능

**When**: 결과 화면을 확인한다

**Then**:
- ✅ 슬롯3만 4명 모두 가능으로 표시된다
- ✅ 슬롯1은 0명으로 표시된다 (C 불가능)
- ✅ 슬롯2는 0명으로 표시된다 (C 불가능)
- ✅ 슬롯4는 0명으로 표시된다 (A 불가능)
- ✅ 슬롯5는 0명으로 표시된다 (A, B 불가능)

---

### TC-006: 연속 시간 블록 계산
**Priority**: 🟡 Medium
**Type**: Algorithm Test

**Given**:
- 이벤트 소요시간: 90분
- 슬롯 간격: 30분
- 투표 결과: 09:00(4명), 09:30(4명), 10:00(4명), 10:30(2명), 11:00(4명)

**When**: 타임라인을 확인한다

**Then**:
- ✅ 09:00-10:30 블록이 표시된다 (90분, 4명)
- ✅ 10:30-11:00은 90분 미만이므로 별도 블록으로 표시되지 않는다
- ✅ 블록이 가능 인원 수 기준으로 정렬된다

---

### TC-007: 데이터 영속성
**Priority**: 🔴 High
**Type**: Persistence Test

**Given**: 이벤트가 생성되고 투표가 입력되었다

**When**:
1. 페이지를 새로고침한다
2. 브라우저 탭을 닫고 다시 연다

**Then**:
- ✅ 모든 이벤트 데이터가 유지된다
- ✅ 모든 투표 데이터가 유지된다
- ✅ 필수 참여자 설정이 유지된다
- ✅ 확정된 시간 정보가 유지된다

---

### TC-008: URL 공유 및 QR 코드
**Priority**: 🟡 Medium
**Type**: Sharing Test

**Given**: 이벤트가 생성되었다

**When**:
1. URL 복사 버튼을 클릭한다
2. QR 코드 표시 버튼을 클릭한다
3. QR 코드 다운로드 버튼을 클릭한다
4. 복사된 URL로 새 탭에서 접속한다

**Then**:
- ✅ URL이 클립보드에 복사된다
- ✅ QR 코드가 올바르게 생성된다
- ✅ QR 코드 이미지가 다운로드된다
- ✅ 공유된 URL로 동일한 이벤트에 접근할 수 있다

---

### TC-009: 시간 확정 및 취소
**Priority**: 🔴 High
**Type**: Confirmation Test

**Given**:
- 투표가 완료되었다
- 여러 개의 최적 시간대가 존재한다

**When**:
1. 인사담당자가 하나의 시간대를 선택하여 확정한다
2. 확정자 이름과 메모를 입력한다
3. 확정을 취소한다

**Then**:
- ✅ 선택한 시간대가 노란색으로 하이라이트된다
- ✅ 확정 배너가 상단에 표시된다
- ✅ 확정 정보 (날짜, 시간, 확정자, 메모)가 모두 표시된다
- ✅ 확정 취소 시 모든 하이라이트가 제거된다

---

## 📊 Test Execution Results

### Latest Test Run: 2025-12-14

| Test Case | Status | Duration | Notes |
|-----------|--------|----------|-------|
| TC-001 | ⏳ Pending | - | E2E test to be implemented |
| TC-002 | ⏳ Pending | - | E2E test to be implemented |
| TC-003 | ⏳ Pending | - | E2E test to be implemented |
| TC-004 | ⏳ Pending | - | E2E test to be implemented |
| TC-005 | ⏳ Pending | - | E2E test to be implemented |
| TC-006 | ⏳ Pending | - | E2E test to be implemented |
| TC-007 | ⏳ Pending | - | E2E test to be implemented |
| TC-008 | ⏳ Pending | - | E2E test to be implemented |
| TC-009 | ⏳ Pending | - | E2E test to be implemented |

**Test Coverage**: 0/9 (0%)
**Pass Rate**: N/A

---

## 🔧 Test Environment Setup

### Prerequisites
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install chromium
```

### Run Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- interview-scheduling

# Run with UI mode
npm run test:e2e -- --ui

# Run with debug mode
npm run test:e2e -- --debug
```

---

## 📝 Test Data

### Sample Event Configuration
```typescript
{
  name: "백엔드 개발자 면접 - 최수진님",
  duration: 90,
  candidateDates: ["2025-12-16", "2025-12-17"],
  timeRange: { start: "09:00", end: "18:00" },
  excludeLunch: true,
  lunchRange: { start: "12:00", end: "13:00" },
  password: "interview2025"
}
```

### Sample Participant Votes
```typescript
// 김민수 (인사담당자)
{ participantName: "김민수", selections: [전체 true] }

// 박지영 (면접관 A)
{ participantName: "박지영", selections: [부분적] }

// 이준호 (면접관 B)
{ participantName: "이준호", selections: [부분적] }

// 최수진 (지원자)
{ participantName: "최수진", selections: [부분적] }
```

---

## 🎯 Success Criteria

인수 테스트는 다음 조건을 모두 만족해야 성공으로 간주됩니다:

1. ✅ 모든 테스트 케이스가 통과해야 한다 (9/9)
2. ✅ E2E 테스트 실행 시간이 5분 이내여야 한다
3. ✅ 테스트 실패 시 명확한 에러 메시지가 제공되어야 한다
4. ✅ 테스트가 독립적으로 실행 가능해야 한다 (순서 무관)
5. ✅ 테스트 데이터가 각 테스트 전후로 정리되어야 한다

---

## 📚 References

- [Playwright Documentation](https://playwright.dev/)
- [FEATURE_SPECS.md](./FEATURE_SPECS.md) - Feature Requirements
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development Standards
- [PROGRESS.md](./PROGRESS.md) - Development Progress
