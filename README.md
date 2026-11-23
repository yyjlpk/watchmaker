# 워치메이커 설치 QR

[워치메이커](https://watchmaker.cilaapps.workers.dev/)에서 T-Rex 3 Pro 44mm 또는 48mm를 선택하고 **저장·설치 → Zepp 설치 QR 만들기**를 누릅니다. 최초 발급 시 접속 코드를 입력하면 이 브라우저에서 30일간 기억합니다. GitHub Actions에서 공식 Zeus 미리보기를 빌드한 뒤 QR PNG가 같은 화면에 표시됩니다. Zepp 개발자 모드의 스캔 메뉴에서 저장한 QR 이미지를 선택하세요.

## 배포 설정

Cloudflare의 기존 `watchmaker` Worker는 이 저장소의 기본 브랜치를 사용합니다. 배포 명령은 `npx wrangler deploy`이며, `wrangler.jsonc`가 정적 파일 경로와 미리보기 KV 연결을 지정합니다. GitHub에서 기본 브랜치에 워크플로가 올라온 뒤 Worker에 다음 값을 설정합니다.

| 위치 | 이름 | 값 |
| --- | --- | --- |
| Cloudflare Worker Secret | `GITHUB_ACTIONS_TOKEN` | 이 저장소만 접근 가능한 GitHub 세분화 토큰, Actions 읽기 및 쓰기 |
| Cloudflare Worker Secret | `WATCHMAKER_ACCESS_KEY` | 사용자가 폰에 입력할 임의 접속 코드, 24자 이상 |
| Cloudflare Worker Secret | `WATCHMAKER_RUNNER_KEY` | 빌드 결과 업로드용 임의 값, 24자 이상 |
| GitHub Actions Repository Secret | `WATCHMAKER_RUNNER_KEY` | Cloudflare에 설정한 업로드용 값과 동일한 값 |
| GitHub Actions Repository Secret | `WATCHMAKER_ZEUS_SESSION` | 같은 Zepp 계정으로 로그인한 Zeus CLI의 `~/.zepp/.zeus` 파일을 Base64로 인코딩한 값 |

GitHub Actions Linux 표준 러너와 Workers Free의 KV를 사용합니다. 소스 프로젝트는 KV에 최대 15분, QR PNG는 최대 30분 저장됩니다. 워치페이스 설치 패키지는 Zeus가 Zepp에 업로드합니다. 워크플로가 Zepp 로그인 오류를 반환하면 CLI에서 로그인 세션을 갱신하고 GitHub Secret을 교체하세요.
