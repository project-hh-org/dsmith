---
"dsmith": patch
---

실제 레포 전 구간 실행에서 드러난 문제 여섯 가지를 고쳤다.

- **migrate**: 대상 컴포넌트의 props를 읽지 못할 때(npm 패키지가 설치되지 않았거나 카탈로그에 props가 없음) 호출부 prop을 확인하지 않고 import만 바꾸던 문제. 이제 `children`·`className`·`style`·`key`·`ref`·`id`·`data-*`·`aria-*` 또는 `decide --map`에 나온 prop만 쓰는 호출이 아니면 새 사유 `target-props-unknown`으로 보류하고, 확인할 수 없는 prop 목록을 detail에 싣는다. props를 아는 대상의 동작은 그대로다.
- **decide**: 이름만 같은 컴포넌트(npm DS와 사내 구현)의 `ds-module` 추천이 항상 `high`였던 문제. 관측 props의 겹침(Jaccard)이 0.5 미만이거나 한쪽 props만 알면 `medium`으로 낮추고 "이름만 같고 props가 달라 같은 컴포넌트인지 확인 필요" 안내(`recommendation.note`)를 붙인다. 사내 구현의 사용 수가 DS의 3배 이상이면 사용 수도 안내에 적는다.
- **init / ai**: init 스캐폴드가 `function X()`로 props를 받지 않아 `ai`가 props를 0개로 읽던 문제. 스캐폴드가 `export function X(_props: XProps)`로 props 타입을 매개변수에 달아 `ai`가 읽을 수 있게 한다(구조 분해는 `noUnusedParameters`에서 컴파일 오류가 나서 쓰지 않는다). 사용자가 고친 스캐폴드는 이전처럼 덮어쓰지 않는다.
- **audit**: init이 만든 `design-system/`(또는 `--out`으로 정한 디렉터리)까지 스캔해, init 뒤에 스캔 파일 수가 늘던 문제. migrate와 같은 init 산출 디렉터리를 인덱싱에서 뺀다. 토큰 파일 감지에는 그대로 쓰인다.
- **토큰 이름**: `--color-gray-50`이 `#ffffff`이고 `--color-gray-50-2`·`--color-red-500-6`처럼 접미사가 붙던 문제. 같은 계열 안에서 OKLCH 밝기가 밝을수록 작은 단계를 받는다(25…975 사다리에 한 번에 배정, 표준 단계 50·100…900·950 우선, 한 계열이 39개를 넘을 때만 접미사). 순백·순흑은 `--color-white`·`--color-black`이다. 결정적이다. gray 판정 채도 상한도 밝기에 따라 달라져 어두운 slate는 gray, 연한 파랑(blue-50)은 blue로 남는다. init을 다시 실행하면 손대지 않은(managed) 토큰 파일은 새 이름으로 다시 쓰이고, 사용자가 고친 토큰 파일은 그대로 둔다. 이전 이름을 가리키는 `var()`·token-cluster 결정은 다시 확인해야 할 수 있다.
- **migrate / decide 보완**: `--only components`에서 컴포넌트 편집만 있을 때 "치환할 것이 없음"이라고 하던 문제를 고쳤다("파일 N (컴포넌트만 N) · 토큰 치환 없음"). 대상 props를 모를 때 값 대응(`--map variant=a:variant=b`)만 있으면 대응에 없는 값(`variant="primary"`)도 `target-props-unknown`으로 보류한다. `ds-decide` 명령은 `recommendation.note`를 보여 주라고 안내한다.
- **migrate 출력**: 사람용 계획 요약의 파일 수(14)가 `--json`의 `plan.files`(15)와 달랐던 문제. 컴포넌트 편집만 있는 파일도 세어 "파일 15 (토큰 14 · 컴포넌트만 1)"로 보인다.
