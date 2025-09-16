// The entire point of this file is to make use of console
import { DEBUG, ERROR, FATAL, INFO, TRACE, WARN } from "browser-bunyan";

/**
 * Formatting for the console output. Can be overridden by passing in a `css`
 * object to the constructor.
 */
export const DEFAULT_CSS = {
  levels: {
    trace: "color: DeepPink",
    debug: "color: GoldenRod",
    info: "color: DarkTurquoise",
    warn: "color: Purple",
    error: "color: Crimson",
    fatal: "color: Black",
  },
  // Make bold
  date: "color: Green; font-weight: bold",
  def: "color: DimGray",
  msg: "",
  src: "color: DimGray; font-style: italic; font-size: 0.9em",
} as const;

const nameFromLevel = {
  [TRACE]: "trace",
  [DEBUG]: "debug",
  [INFO]: "info",
  [WARN]: "warn",
  [ERROR]: "error",
  [FATAL]: "fatal",
} as const;

export interface ConsoleRecord {
  childName?: string;
  nestedName?: string;
  component?: string;
  module?: string;
  name: string;
  level: keyof typeof nameFromLevel;
  levelName: (typeof nameFromLevel)[keyof typeof nameFromLevel];
  time: Date;
  msg: string;
  src: string;
  obj: unknown;
  err?: Error;
  [key: string]: unknown;
}

/**
 * Custom console formatter for jimmyvanveen.com
 * Modified version of the ConsoleFormattedStream from `browser-bunyan`
 */
export class ConsoleFormattedStream {
  logByLevel: boolean;
  css: typeof DEFAULT_CSS;

  constructor({ logByLevel = false, css = DEFAULT_CSS } = {}) {
    this.logByLevel = logByLevel;
    this.css = css;
  }

  write(rec: ConsoleRecord) {
    const keys = Object.keys(rec);

    // Create a clone of `rec` but with several properties removed (`src`, `obj`, `err`)
    const data = keys.reduce((acc: Record<string, unknown>, key) => {
      if (
        // These are the properties that are handled by the stringified output. What's left is ok to include in the data object.
        ![
          "level",
          "levelName",
          "name",
          "component",
          "module",
          "childName",
          "nestedName",
          "msg",
          "src",
          "time",
          "v",
        ].includes(key) &&
        key in rec
      ) {
        acc[key] = rec[key];
      }
      return acc;
    }, {});

    let levelCss;
    const defaultCss = this.css.def;
    const msgCss = this.css.msg;
    const srcCss = this.css.src;

    const levelName = nameFromLevel[rec.level];

    let consoleMethod:
      | typeof console.log
      | typeof console.trace
      | typeof console.debug
      | typeof console.info
      | typeof console.warn
      | typeof console.error = console.log;

    if (this.logByLevel) {
      if (levelName === "info" && typeof console.info === "function") {
        consoleMethod = console.info;
      } else if (levelName === "warn" && typeof console.warn === "function") {
        consoleMethod = console.warn;
      } else if (levelName === "error" && typeof console.error === "function") {
        consoleMethod = console.error;
      }
    }

    const divider = "/";

    const childName = rec.component || rec.module || rec.childName;

    const loggerName = childName
      ? `${rec.name}${divider}${childName}`
      : rec.name;

    const leadingPadding = rec.level <= INFO ? "  " : "";

    const formattedLevelName = (
      leadingPadding +
      levelName +
      Array(6 - levelName.length).join(" ")
    ).toUpperCase();

    if (rec.level < DEBUG) {
      levelCss = this.css.levels.trace;
    } else if (rec.level < INFO) {
      levelCss = this.css.levels.debug;
    } else if (rec.level < WARN) {
      levelCss = this.css.levels.info;
    } else if (rec.level < ERROR) {
      levelCss = this.css.levels.warn;
    } else if (rec.level < FATAL) {
      levelCss = this.css.levels.error;
    } else {
      levelCss = this.css.levels.fatal;
    }

    const amountOfData = Object.keys(data).length;

    const lastLine = amountOfData > 0 ? "\n" : "";

    const logArgs = [];
    logArgs.push(
      `%c%s %c(%s): %c%s: %c%s ${rec.src ? "\n%c%s" + lastLine : lastLine}`,
    );
    logArgs.push(levelCss);
    logArgs.push(formattedLevelName);
    logArgs.push(this.css.date);
    logArgs.push(
      rec.time.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      }),
    );
    logArgs.push(defaultCss);
    logArgs.push(loggerName);
    logArgs.push(msgCss);
    logArgs.push(rec.msg);
    if (rec.src) {
      logArgs.push(srcCss);
      logArgs.push(rec.src);
    }
    if (rec.obj) {
      logArgs.push("\n");
      logArgs.push(rec.obj);
    }
    if (rec.err?.stack) {
      logArgs.push("\n");
      logArgs.push(rec.err.stack);
    }
    // Add the additional data (beyond just the message) that was provided
    if (amountOfData > 0) {
      logArgs.push(data);
    }
    consoleMethod.apply(console, logArgs);
  }

  static getDefaultCss() {
    return DEFAULT_CSS;
  }
}
