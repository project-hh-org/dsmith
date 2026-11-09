# 릴리스 절차

`dsmith`와 `@dsmith-dev/*` 패키지는 changesets의 fixed 그룹이라 항상 같은 버전으로 올라간다. 현재 npm 최신은 0.5.0이고 패키지는 18개다(0.1.0 첫 게시 이후 0.2.0·0.2.1·0.3.0·0.4.0·0.5.0).

## 절차

1. 변경이 있는 PR에서 `pnpm changeset`으로 changeset 파일을 만든다(bump 종류와 한 줄 설명). 0.x 동안은 기능 추가·호환성 깨짐 모두 `minor`, 버그 수정은 `patch`.
2. PR을 올린다. CI(`ci.yml`, Node 20·22)가 install(frozen)·build·test·typecheck를 돌린다.
3. PR을 `main`에 머지한다.
4. `release.yml`이 `chore: 버전 올림 (Version Packages)` PR을 만들거나 갱신한다. 버전·CHANGELOG 변경이 여기에 모인다. 이 PR을 머지한다.
5. 머지된 `main`에서 `release.yml`이 `pnpm release`(`pnpm build && node scripts/publish.mjs && changeset tag`)를 실행해 npm에 게시하고 git 태그를 만든다. `scripts/publish.mjs`는 패키지마다 레지스트리에 그 버전이 이미 있는지 먼저 보고 없는 것만 `pnpm publish`로 올린다. 반영 지연으로 409(previously published)가 나도 "이미 있음"으로 넘어간다. `pnpm publish`를 쓰는 이유: `changeset publish`는 `npm publish`를 호출해 `workspace:*`를 실제 버전으로 치환하지 못한다(pnpm 공식 안내). npm 패키지 페이지에서 새 버전과 provenance 배지를 확인한다.
6. 대기 중인 changeset이 없는 실행(`hasChangesets`가 `false`)에서 마지막 단계 "릴리스 태그 push"가 `git push origin --tags`로 5단계에서 만든 태그(`dsmith@0.5.0`처럼 패키지마다 하나)를 GitHub에 올린다. 이미 있는 태그는 그대로 두므로 게시가 없는 실행에서도 안전하다. 워크플로의 `contents: write` 권한이 필요하다. Version Packages PR만 만든 실행에서는 이 단계가 건너뛰어진다.

`pnpm changeset status --verbose`로 대기 중인 changeset과 예정 버전을 미리 볼 수 있다. `changeset version`·`changeset publish`는 로컬에서 실행하지 않는다(릴리스 PR과 Actions가 한다).

## 필요한 secret

GitHub `project-hh-org/dsmith` → Settings → Secrets and variables → Actions에 `NPM_TOKEN` 하나. `GITHUB_TOKEN`은 Actions가 제공한다.

`NPM_TOKEN`이 없으면 4단계(Version Packages PR 생성)까지만 동작하고, 5단계 게시가 인증 오류로 실패한다.

## 토큰 권한

npmjs.com → Access Tokens → Generate New Token → Granular Access Token.

- Packages and scopes: `Read and write`
- 범위: `dsmith-dev` org 전체와 `dsmith` 패키지. `dsmith`와 `@dsmith-dev/*`는 이미 게시돼 있어 각 패키지를 골라 권한을 줄 수 있다(새 패키지를 처음 올릴 때만 "All packages"가 필요하다).
- Bypass 2FA 체크(Actions에서 OTP를 입력할 수 없다)
- 만료 90일 이상. 만료되면 게시가 인증 오류로 실패하므로 갱신 시점을 기록해 둔다.

provenance는 `NPM_CONFIG_PROVENANCE=true`와 워크플로의 `id-token: write`로 켜진다. npm이 `package.json`의 `repository.url`과 워크플로가 실행된 저장소가 일치하는지 검증하므로 두 값이 같아야 한다.

## 새 패키지의 첫 게시

npm에 아직 없는 새 패키지(예: 0.4.0의 `@dsmith-dev/extractor-react-native`)가 처음 올라가는 릴리스에서는 다음을 확인한다. fixed 그룹이라 새 패키지도 다른 패키지와 같은 버전으로 오른다.

- `NPM_TOKEN`이 `dsmith-dev` org의 **"All packages"** 권한이어야 한다. 위 "토큰 권한"처럼 기존 패키지를 하나씩 고른 토큰은 아직 없는 패키지를 만들 수 없어 5단계 게시가 권한 오류로 실패한다. 릴리스 PR을 머지하기 전에 토큰을 바꾼다.
- trusted publishing은 패키지가 npm에 있어야 등록할 수 있다. 새 패키지는 첫 게시 뒤에 Settings → Trusted Publisher를 등록한다(아래 "trusted publishing으로 옮기기"). 모든 패키지를 trusted publishing으로 옮긴 뒤에 새 패키지를 더하는 릴리스라면 첫 게시만 `NPM_TOKEN`으로 하고, 게시 뒤 그 패키지를 등록한다.
- 게시 전에 `npm view <새 패키지>`가 404인지(이름이 비어 있는지) 확인한다. 첫 게시 일부만 실패해도 "게시가 실패했을 때"의 재실행으로 이어서 올릴 수 있다.

## 게시가 실패했을 때

- 게시 단계만 실패한 경우(토큰 만료·권한 누락·npm 장애): 원인을 고치고 Actions → Release → 실패한 run에서 "Re-run failed jobs"를 누른다. 이미 올라간 패키지는 건너뛰고 나머지만 게시한다.
- 일부 패키지만 올라간 경우에도 같은 방법으로 다시 실행한다. 버전을 다시 올리지 않는다.
- 이미 게시된 버전은 덮어쓸 수 없다. 코드를 고쳐야 하면 새 changeset(`patch`)으로 다음 버전을 낸다.
- 직접 `npm publish`를 하지 않는다. `workspace:*` 의존성이 실제 버전으로 치환되지 않는다.

## trusted publishing으로 옮기기

npm trusted publishing(OIDC)은 패키지가 npm에 이미 있어야 설정할 수 있어 첫 배포에는 `NPM_TOKEN`을 썼다. 이제 패키지가 모두 올라가 있으니 패키지 각각의 Settings → Trusted Publisher에 이 저장소와 `release.yml`을 등록하면 장기 토큰 없이 게시할 수 있다. 전환하면 `NPM_TOKEN` secret과 `NODE_AUTH_TOKEN` 설정을 제거한다. 전환 전에 한 번 시험 게시(patch)로 동작을 확인한다.
