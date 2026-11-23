# 워치메이커 Android

패키지 이름은 `com.yyjlpk.watchmaker`이며 Android 10 이상을 지원합니다. 기존 웹 편집기를 앱에 포함하고, 사진과 ZIP 선택 및 QR PNG 저장에는 Android 시스템 기능을 사용합니다.

- 워치 화면을 편집한 뒤 **저장·설치**에서 배경 PNG 또는 Zeus 프로젝트를 저장합니다.
- Zepp 계정으로 발급받은 설치 링크를 앱에 붙여넣어 QR PNG를 만들거나, 해당 QR 이미지를 가져옵니다. PNG를 갤러리에 저장한 뒤 공식 Zepp 앱의 개발자 모드에서 스캔합니다.
- 개인 Zepp 계정으로 동작하는 웹 미리보기 서버는 Android 앱에서 연결되지 않습니다. 사용자별 프로젝트 QR 발급은 Zepp 도구에서 진행합니다.

## 다시 빌드하기

JDK 17, Gradle 8.13 및 Android SDK 36을 준비한 뒤 이 디렉터리에서 `gradle :app:bundleRelease`를 실행합니다. CI는 서명 전 번들을 생성합니다. Play Console에 올릴 번들은 소유자의 업로드 키로 서명하세요. 같은 앱을 업데이트할 때는 패키지 이름과 업로드 키를 유지하고 `versionCode`를 올립니다.
