/** 독립 채점기의 공용 타입 — dsmith 패키지를 import하지 않는다 */

export type OccKind = "color" | "length" | "palette" | "var" | "dsComp" | "localComp" | "themeRef";

/** 한 파일 안의 등장 하나. 같은 (kind, value)끼리 다중집합으로 비교한다 */
export interface Occurrence {
  kind: OccKind;
  value: string;
}

export const occKey = (o: Occurrence): string => `${o.kind}|${o.value}`;

export interface IndepCounts {
  /** (a) 색 리터럴(hex·rgb()·hsl()·oklch()·이름 색) */
  colorLiterals: number;
  /** (b) px·rem 길이 리터럴(0 제외) */
  lengthLiterals: number;
  /** (c) Tailwind 기본 팔레트·스케일 유틸리티 */
  tailwindPalette: number;
  /** (d) CSS에 선언된 이름을 가리키는 var(--name) (테마 키 클래스 포함) */
  varDefined: number;
  /** (d) CSS 어디에도 선언되지 않은 이름의 var(--name) */
  varUndefined: number;
  /** (e) import가 DS 모듈로 풀리는 JSX 요소 */
  dsComponents: number;
  /** (e) import가 DS가 아닌 로컬 경로로 풀리는 JSX 요소 */
  otherLocalComponents: number;
  /** (f) React Native: 로컬 객체 모듈(테마)에서 import한 바인딩으로 시작하는 멤버 식·스프레드. 웹 파일은 0 */
  themeRefs: number;
}

export interface IndepFileScore {
  /** 복사본 root 상대 POSIX */
  file: string;
  status: "added" | "modified";
  parseFailed: boolean;
  counts: IndepCounts;
  /** 새로 생긴 정의 없는 var 이름(중복 제거, 정렬) */
  undefinedVars: string[];
}

export interface IndependentScore {
  files: IndepFileScore[];
  /** 채점하지 않은 경로(하네스 관리 파일·DS 스캐폴드 등) */
  excluded: string[];
  /** 대상 확장자가 아니라 건너뛴 경로 */
  ignored: string[];
  totals: IndepCounts & { parseFailed: number; files: number };
  /** (varDefined + themeRefs) / (varDefined + varUndefined + colorLiterals + lengthLiterals + tailwindPalette + themeRefs), 분모 0이면 null, 소수 4자리. 웹은 themeRefs가 0이라 이전 식과 같다 */
  indepUsage: number | null;
  /** 실행 전체의 정의 없는 var 이름(중복 제거, 정렬) */
  undefinedVars: string[];
}

export const emptyIndepCounts = (): IndepCounts => ({
  colorLiterals: 0,
  lengthLiterals: 0,
  tailwindPalette: 0,
  varDefined: 0,
  varUndefined: 0,
  dsComponents: 0,
  otherLocalComponents: 0,
  themeRefs: 0,
});

/** 타입 검사 결과(실행 하나) */
export interface TypeCheckRecord {
  /**
   * "구문·의미 검사(의존성 타입 없이)": 복사본에 node_modules가 없어 react 등 외부 패키지 타입 없이 검사
   * "타입 검사": 외부 패키지 타입이 풀리는 상태에서 검사
   * "검사 안 함": 검사할 파일이 없거나 검사기가 던짐(error에 이유)
   */
  mode: "구문·의미 검사(의존성 타입 없이)" | "타입 검사" | "검사 안 함";
  /** 검사 대상(에이전트가 바꾼 ts·tsx·js·jsx) 수 */
  filesChecked: number;
  /** 바뀐 파일에 위치한 진단(오류) 수 */
  typeErrors: number;
  /** 앞 10개 */
  diagnostics: { file: string; line: number; code: number; message: string }[];
  error?: string;
}
