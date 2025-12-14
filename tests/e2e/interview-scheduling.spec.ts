import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: 채용 인터뷰 일정 조율
 *
 * 시나리오:
 * - 인사담당자 김민수가 이벤트를 생성
 * - 면접관 2명(박지영, 이준호)의 일정을 대리 입력
 * - 본인(김민수)의 일정을 입력
 * - 3명을 필수 참여자로 지정
 * - URL을 지원자 최수진에게 공유
 * - 지원자가 본인 일정을 입력
 * - 4명 모두 가능한 시간대를 확인하고 확정
 */

test.describe.skip('TC-001: 채용 인터뷰 일정 조율 (End-to-End)', () => {
  let eventUrl: string;
  const password = 'interview2025';

  test('인사담당자가 이벤트를 생성하고 비밀번호를 설정한다', async ({ page }) => {
    // 홈페이지 접속
    await page.goto('/');

    // 이벤트 정보 입력
    await page.fill('input[name="name"]', '백엔드 개발자 면접 - 최수진님');
    await page.fill('input[name="duration"]', '90');

    // 날짜 선택 (2025-12-16, 2025-12-17)
    await page.fill('input[name="candidateDates"]', '2025-12-16,2025-12-17');

    // 시간 범위 설정
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');

    // 점심시간 제외 체크
    await page.check('input[name="excludeLunch"]');

    // 비밀번호 설정
    await page.fill('input[name="password"]', password);

    // 이벤트 생성
    await page.click('button:has-text("이벤트 만들기")');

    // URL 추출
    await page.waitForURL(/\/#\/event\/.+/);
    eventUrl = page.url();

    // URL이 올바르게 생성되었는지 확인
    expect(eventUrl).toMatch(/\/#\/event\/[a-z0-9]{8}/);

    // 이벤트 제목이 표시되는지 확인
    await expect(page.locator('text=백엔드 개발자 면접 - 최수진님')).toBeVisible();
  });

  test('인사담당자가 면접관 박지영의 일정을 입력한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 비밀번호 입력
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("확인")');

    // 참여자 이름 입력
    await page.fill('input[placeholder*="이름"]', '박지영');

    // 2025-12-16: 09:00-12:00 (09:00, 09:30, 10:00, 10:30, 11:00, 11:30)
    // 슬롯 선택
    const slots_day1 = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];
    for (const slot of slots_day1) {
      await page.click(`button:has-text("${slot}")`);
    }

    // 2025-12-17: 09:00-11:00, 15:00-18:00
    const slots_day2 = ['09:00', '09:30', '10:00', '10:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    for (const slot of slots_day2) {
      await page.click(`button:has-text("${slot}")`);
    }

    // 투표 제출
    await page.click('button:has-text("투표하기")');

    // 성공 메시지 확인
    await expect(page.locator('text=투표가 성공적으로 제출되었습니다')).toBeVisible();

    // 참여자 목록에 추가되었는지 확인
    await expect(page.locator('text=박지영')).toBeVisible();
  });

  test('인사담당자가 면접관 이준호의 일정을 입력한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 참여자 이름 입력
    await page.fill('input[placeholder*="이름"]', '이준호');

    // 2025-12-16: 10:00-12:00, 13:00-15:00
    const slots_day1 = ['10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30'];
    for (const slot of slots_day1) {
      await page.click(`button:has-text("${slot}")`);
    }

    // 2025-12-17: 09:00-12:00, 14:00-16:00
    const slots_day2 = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];
    for (const slot of slots_day2) {
      await page.click(`button:has-text("${slot}")`);
    }

    // 투표 제출
    await page.click('button:has-text("투표하기")');

    // 참여자 목록에 추가되었는지 확인
    await expect(page.locator('text=이준호')).toBeVisible();
  });

  test('인사담당자가 본인(김민수)의 일정을 입력한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 참여자 이름 입력
    await page.fill('input[placeholder*="이름"]', '김민수');

    // 전체 선택 (종일 가능)
    await page.click('button:has-text("전체")');

    // 투표 제출
    await page.click('button:has-text("투표하기")');

    // 참여자 목록에 추가되었는지 확인
    await expect(page.locator('text=김민수')).toBeVisible();
  });

  test('인사담당자가 3명을 필수 참여자로 지정한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 각 참여자를 필수로 지정 (⭐ 클릭)
    const participants = ['김민수', '박지영', '이준호'];

    for (const name of participants) {
      // 참여자 행에서 별 버튼 찾기
      const starButton = page.locator(`text=${name}`).locator('..').locator('button:has-text("☆")');
      await starButton.click();

      // ⭐로 변경되었는지 확인
      await expect(page.locator(`text=${name}`).locator('..').locator('button:has-text("⭐")')).toBeVisible();
    }

    // Required 배지가 표시되는지 확인
    for (const name of participants) {
      await expect(page.locator(`text=${name}`).locator('..').locator('text=Required')).toBeVisible();
    }
  });

  test('지원자 최수진이 URL로 접속하여 본인 일정을 입력한다', async ({ page }) => {
    // 새로운 세션으로 URL 접속 (지원자 시점)
    await page.goto(eventUrl);

    // 비밀번호 입력
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("확인")');

    // 참여자 이름 입력
    await page.fill('input[placeholder*="이름"]', '최수진');

    // 2025-12-16: 09:00-11:00, 14:00-18:00
    const slots_day1 = ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    for (const slot of slots_day1) {
      await page.click(`button:has-text("${slot}")`);
    }

    // 2025-12-17: 종일 가능
    await page.click('button:has-text("전체")');

    // 투표 제출
    await page.click('button:has-text("투표하기")');

    // 성공 메시지 확인
    await expect(page.locator('text=투표가 성공적으로 제출되었습니다')).toBeVisible();

    // 참여자 목록에 4명 모두 있는지 확인
    await expect(page.locator('text=김민수')).toBeVisible();
    await expect(page.locator('text=박지영')).toBeVisible();
    await expect(page.locator('text=이준호')).toBeVisible();
    await expect(page.locator('text=최수진')).toBeVisible();
  });

  test('결과 화면에서 4명 모두 가능한 시간대를 확인한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 결과 보기 탭으로 이동
    await page.click('button:has-text("결과 보기")');

    // 필수 참여자 필터 배너가 표시되는지 확인
    await expect(page.locator('text=필수 참여자 필터 적용 중')).toBeVisible();
    await expect(page.locator('text=김민수')).toBeVisible();
    await expect(page.locator('text=박지영')).toBeVisible();
    await expect(page.locator('text=이준호')).toBeVisible();

    // 타임라인으로 이동
    await page.click('button:has-text("타임라인")');

    // 4명 모두 가능한 시간 블록 확인
    // 예상: 2025-12-16 10:00-11:30 (90분)
    const block_1216 = page.locator('text=2025-12-16').locator('..').locator('text=10:00');
    await expect(block_1216).toBeVisible();

    // 예상: 2025-12-17 09:00-10:30 (90분)
    const block_1217 = page.locator('text=2025-12-17').locator('..').locator('text=09:00');
    await expect(block_1217).toBeVisible();

    // 블록에 4명 표시 확인
    await expect(page.locator('text=4명')).toBeVisible();
  });

  test('인사담당자가 최종 시간을 확정한다', async ({ page }) => {
    await page.goto(eventUrl);

    // 결과 보기 탭으로 이동
    await page.click('button:has-text("결과 보기")');
    await page.click('button:has-text("타임라인")');

    // 첫 번째 블록 클릭하여 확장
    await page.click('button:has-text("10:00")').first();

    // "이 시간으로 확정하기" 버튼 클릭
    await page.click('button:has-text("이 시간으로 확정하기")');

    // 프롬프트에서 확정자 이름 입력 (Playwright는 dialog 이벤트 처리 필요)
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('확정자 이름')) {
        await dialog.accept('김민수');
      } else if (dialog.message().includes('메모')) {
        await dialog.accept('1층 회의실 A에서 진행 예정입니다. 이력서와 포트폴리오를 지참해 주세요.');
      }
    });

    // 확정 배너가 표시되는지 확인
    await expect(page.locator('text=회의 시간이 확정되었습니다')).toBeVisible();
    await expect(page.locator('text=김민수님이')).toBeVisible();
    await expect(page.locator('text=1층 회의실 A')).toBeVisible();

    // 타임라인에서 확정된 블록이 노란색으로 표시되는지 확인 (✅ 이모지)
    await expect(page.locator('text=✅')).toBeVisible();
  });

  test('확정을 취소할 수 있다', async ({ page }) => {
    await page.goto(eventUrl);

    // 결과 보기 탭으로 이동
    await page.click('button:has-text("결과 보기")');

    // 확정 취소 버튼 클릭
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('확정을 취소')) {
        await dialog.accept();
      }
    });

    await page.click('button:has-text("확정 취소")');

    // 확정 배너가 사라졌는지 확인
    await expect(page.locator('text=회의 시간이 확정되었습니다')).not.toBeVisible();

    // 타임라인에서 ✅ 이모지가 사라졌는지 확인
    await page.click('button:has-text("타임라인")');
    await expect(page.locator('text=✅')).not.toBeVisible();
  });
});

/**
 * TC-002: 비밀번호 보호 검증
 */
test.describe.skip('TC-002: 비밀번호 보호', () => {
  test('잘못된 비밀번호로는 접근이 차단된다', async ({ page }) => {
    // 비밀번호가 설정된 이벤트 생성
    await page.goto('/');

    await page.fill('input[name="name"]', '비밀번호 테스트');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="candidateDates"]', '2025-12-20');
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');
    await page.fill('input[name="password"]', 'secret123');

    await page.click('button:has-text("이벤트 만들기")');
    await page.waitForURL(/\/#\/event\/.+/);

    const eventUrl = page.url();

    // 새 컨텍스트로 접속 (비밀번호 잊은 상태)
    await page.goto(eventUrl);

    // 잘못된 비밀번호 입력
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("확인")');

    // 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();

    // 올바른 비밀번호 입력
    await page.fill('input[type="password"]', 'secret123');
    await page.click('button:has-text("확인")');

    // 이벤트 페이지로 이동 확인
    await expect(page.locator('text=비밀번호 테스트')).toBeVisible();
  });
});

/**
 * TC-003: 중복 투표 방지
 */
test.describe.skip('TC-003: 중복 투표 방지', () => {
  test('동일한 이름으로 중복 투표가 차단된다', async ({ page }) => {
    // 이벤트 생성
    await page.goto('/');

    await page.fill('input[name="name"]', '중복 투표 테스트');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="candidateDates"]', '2025-12-20');
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');

    await page.click('button:has-text("이벤트 만들기")');
    await page.waitForURL(/\/#\/event\/.+/);

    // 첫 번째 투표
    await page.fill('input[placeholder*="이름"]', '김민수');
    await page.click('button:has-text("09:00")').first();
    await page.click('button:has-text("투표하기")');

    await expect(page.locator('text=투표가 성공적으로 제출되었습니다')).toBeVisible();

    // 동일한 이름으로 재투표 시도
    await page.fill('input[placeholder*="이름"]', '김민수');
    await page.click('button:has-text("09:30")').first();
    await page.click('button:has-text("투표하기")');

    // 중복 에러 확인
    await expect(page.locator('text=이미 투표하셨습니다')).toBeVisible();

    // 대소문자 다르게 시도
    await page.fill('input[placeholder*="이름"]', '김MIN수');
    await page.click('button:has-text("투표하기")');

    // 중복 에러 확인 (대소문자 무시)
    await expect(page.locator('text=이미 투표하셨습니다')).toBeVisible();
  });
});

/**
 * TC-007: 데이터 영속성
 */
test.describe.skip('TC-007: 데이터 영속성', () => {
  test('페이지 새로고침 후에도 데이터가 유지된다', async ({ page }) => {
    // 이벤트 생성
    await page.goto('/');

    await page.fill('input[name="name"]', '영속성 테스트');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="candidateDates"]', '2025-12-20');
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');

    await page.click('button:has-text("이벤트 만들기")');
    await page.waitForURL(/\/#\/event\/.+/);

    const eventUrl = page.url();

    // 투표 입력
    await page.fill('input[placeholder*="이름"]', '박지영');
    await page.click('button:has-text("09:00")').first();
    await page.click('button:has-text("투표하기")');

    await expect(page.locator('text=박지영')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 데이터 유지 확인
    await expect(page.locator('text=영속성 테스트')).toBeVisible();
    await expect(page.locator('text=박지영')).toBeVisible();

    // URL 재접속
    await page.goto(eventUrl);

    // 데이터 유지 확인
    await expect(page.locator('text=영속성 테스트')).toBeVisible();
    await expect(page.locator('text=박지영')).toBeVisible();
  });
});

/**
 * TC-008: URL 공유 및 QR 코드
 */
test.describe.skip('TC-008: URL 공유', () => {
  test('URL 복사 기능이 정상 작동한다', async ({ page, context }) => {
    // 클립보드 권한 허용
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 이벤트 생성
    await page.goto('/');

    await page.fill('input[name="name"]', 'URL 공유 테스트');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="candidateDates"]', '2025-12-20');
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');

    await page.click('button:has-text("이벤트 만들기")');
    await page.waitForURL(/\/#\/event\/.+/);

    const eventUrl = page.url();

    // URL 복사 버튼 클릭
    await page.click('button:has-text("URL 복사")');

    // 클립보드에서 URL 읽기
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // 복사된 URL이 현재 URL과 일치하는지 확인
    expect(clipboardText).toContain(eventUrl);
  });

  test('QR 코드가 생성되고 표시된다', async ({ page }) => {
    // 이벤트 생성
    await page.goto('/');

    await page.fill('input[name="name"]', 'QR 코드 테스트');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="candidateDates"]', '2025-12-20');
    await page.fill('input[name="timeStart"]', '09:00');
    await page.fill('input[name="timeEnd"]', '18:00');

    await page.click('button:has-text("이벤트 만들기")');
    await page.waitForURL(/\/#\/event\/.+/);

    // QR 코드 토글 버튼 클릭
    await page.click('button:has-text("QR")');

    // QR 코드 캔버스가 표시되는지 확인
    await expect(page.locator('canvas')).toBeVisible();

    // 다시 클릭하면 숨겨지는지 확인
    await page.click('button:has-text("QR")');
    await expect(page.locator('canvas')).not.toBeVisible();
  });
});
