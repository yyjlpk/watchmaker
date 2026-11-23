# 워치메이커 Android

패키지 이름은 `com.yyjlpk.watchmaker`이며 Android 10 이상을 지원합니다. 기존 웹 편집기를 앱에 포함하고, 사진과 ZIP 선택 및 QR PNG 저장에는 Android 시스템 기능을 사용합니다.

- 디자인과 워치 모델을 선택하고 **설치 QR → Zepp 설치 QR 만들기**를 누릅니다.
- 처음에는 공식 Zepp 로그인 화면에서 워치에 연결된 계정으로 로그인합니다. **워치메이커로 돌아가기**를 누르면 앱에 QR이 표시됩니다.
- **갤러리에 저장 → Zepp 앱 열기**를 누르고 Zepp **개발자 모드 → 스캔**에서 QR을 선택합니다.
- 앱 발급은 28개 모델에 제공됩니다. GTR 3, GTR 3 Pro, GTS 3, GTS 4 mini, Cheetah 2 Ultra는 모델별 크기의 배경 PNG 내보내기를 제공합니다.

## 모바일 QR 발급 서버

이 버전의 Worker와 `watchface-preview.yml`의 러너 코드를 함께 배포합니다. Worker `PREVIEW_ACTIONS_REF`가 해당 러너 코드를 가리키는지 확인한 뒤 `PREVIEW_PERSONAL_ENABLED=true`를 설정하면 앱에 개인 발급 버튼이 활성화됩니다. 기존 `PREVIEW_JOBS`, `GITHUB_ACTIONS_TOKEN`, `WATCHMAKER_RUNNER_KEY` 설정을 사용합니다.

워치메이커는 디자인과 설치 패키지를 발급 작업의 수명 동안 KV에 저장합니다. 패키지를 조회하려면 작업 ID와 휴대폰에 전달한 임시 접근 키가 필요합니다. Zepp 로그인 토큰은 Android Keystore 키로 암호화해 기기에 보관하며, 패키지 업로드 시 Zepp에만 전송됩니다.

## 다시 빌드하기

JDK 17, Gradle 8.13 및 Android SDK 36을 준비한 뒤 이 디렉터리에서 `gradle :app:bundleRelease`를 실행합니다. CI는 서명 전 번들을 생성합니다. Play Console에 올릴 번들은 소유자의 업로드 키로 서명하세요. 같은 앱을 업데이트할 때는 패키지 이름과 업로드 키를 유지하고 `versionCode`를 올립니다.
