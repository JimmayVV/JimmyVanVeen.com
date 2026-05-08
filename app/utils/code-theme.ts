// Empty Prism style — react-syntax-highlighter expects a style object that
// maps token classes to inline styles. We return empty objects so the actual
// colors come from CSS variables defined in app.css under `.prose-editorial`.
// This lets light/dark mode work without remounting the highlighter.

type PrismStyle = Record<string, React.CSSProperties>;

const empty: React.CSSProperties = {};

export const editorialPrismStyle: PrismStyle = {
  'code[class*="language-"]': empty,
  'pre[class*="language-"]': empty,
  ':not(pre) > code[class*="language-"]': empty,
  comment: empty,
  prolog: empty,
  doctype: empty,
  cdata: empty,
  punctuation: empty,
  property: empty,
  tag: empty,
  boolean: empty,
  number: empty,
  constant: empty,
  symbol: empty,
  deleted: empty,
  selector: empty,
  "attr-name": empty,
  string: empty,
  char: empty,
  builtin: empty,
  inserted: empty,
  operator: empty,
  entity: empty,
  url: empty,
  ".language-css .token.string": empty,
  ".style .token.string": empty,
  atrule: empty,
  "attr-value": empty,
  keyword: empty,
  function: empty,
  "class-name": empty,
  regex: empty,
  important: empty,
  variable: empty,
  bold: { fontWeight: 600 },
  italic: { fontStyle: "italic" },
};
