export default {
  semi: true,
  trailingComma: "all",
  singleQuote: false,
  printWidth: 80,
  tabWidth: 2,
  arrowParens: "always",
  endOfLine: "lf",
  importOrder: ["^react", "^react-router", "^@?\\w", "^~/", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
}
