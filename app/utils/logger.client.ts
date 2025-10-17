// Browser-bunyan logger with SSR-safe initialization
// Determine log level based on environment
// Production: WARN and higher only (no debug/info in production for privacy/performance)
// Development: DEBUG and all levels for comprehensive debugging
// Override: Set JVV_ANALYTICS_DEBUG=true in production env to temporarily enable debug logs
const logLevel =
  import.meta.env.PROD && import.meta.env.JVV_ANALYTICS_DEBUG !== "true"
    ? "warn"
    : "debug";

interface Logger {
  debug: (data: unknown, message?: string) => void;
  info: (data: unknown, message?: string) => void;
  warn: (data: unknown, message?: string) => void;
  error: (data: unknown, message?: string) => void;
  child: (fields: { module: string }) => Logger;
}

// Initialize bunyan logger client-side only
let rootLogger: Logger;

// Helper function to wrap a bunyan logger with our interface
function createBunyanLoggerWrapper(bunyanLogger: {
  debug: (data: unknown, message?: string) => void;
  info: (data: unknown, message?: string) => void;
  warn: (data: unknown, message?: string) => void;
  error: (data: unknown, message?: string) => void;
  child: (fields: { module: string }) => unknown;
}): Logger {
  return {
    debug: (data: unknown, message?: string) => {
      if (message) {
        bunyanLogger.debug(data, message);
      } else {
        bunyanLogger.debug(data);
      }
    },
    info: (data: unknown, message?: string) => {
      if (message) {
        bunyanLogger.info(data, message);
      } else {
        bunyanLogger.info(data);
      }
    },
    warn: (data: unknown, message?: string) => {
      if (message) {
        bunyanLogger.warn(data, message);
      } else {
        bunyanLogger.warn(data);
      }
    },
    error: (data: unknown, message?: string) => {
      if (message) {
        bunyanLogger.error(data, message);
      } else {
        bunyanLogger.error(data);
      }
    },
    child: (fields: { module: string }) => {
      return createFallbackLogger(fields.module); // Fallback for child loggers
    },
  };
}

if (typeof window !== "undefined") {
  // Browser environment - dynamically import bunyan
  // Dynamically load bunyan for browser-only usage
  Promise.all([import("./console-formatted-stream"), import("browser-bunyan")])
    .then(([{ ConsoleFormattedStream }, bunyan]) => {
      const consoleStream = new ConsoleFormattedStream();

      const bunyanLogger = bunyan.createLogger({
        name: "jimmyvanveen.com",
        level: logLevel,
        streams: [{ stream: consoleStream }],
      });

      // Create bunyan-based logger implementation
      const bunyanLoggerImpl = createBunyanLoggerWrapper(bunyanLogger);

      // Replace the fallback logger with real bunyan
      rootLogger = bunyanLoggerImpl;
      console.log("✨ Bunyan logger initialized with custom console formatter");
    })
    .catch((error) => {
      console.error("Failed to load bunyan, using fallback logger:", error);
    });
}

// Fallback logger for SSR or if bunyan fails to load
function createFallbackLogger(moduleName = "jimmyvanveen.com"): Logger {
  const shouldLog =
    logLevel === "debug" || import.meta.env.JVV_ANALYTICS_DEBUG === "true";

  return {
    debug: (data: unknown, message?: string) => {
      if (!shouldLog) return;
      console.log(`[DEBUG:${moduleName}]`, message || "", data);
    },
    info: (data: unknown, message?: string) => {
      if (!shouldLog) return;
      console.info(`[INFO:${moduleName}]`, message || "", data);
    },
    warn: (data: unknown, message?: string) => {
      console.warn(`[WARN:${moduleName}]`, message || "", data);
    },
    error: (data: unknown, message?: string) => {
      console.error(`[ERROR:${moduleName}]`, message || "", data);
    },
    child: (fields: { module: string }) => createFallbackLogger(fields.module),
  };
}

// Start with fallback logger, upgrade to bunyan when available
rootLogger = createFallbackLogger();

/**
 * Get a child logger for a specific module/component
 * @param name - The name of the module (e.g., 'analytics', 'index-route', 'blog-route')
 * @returns A child logger instance
 */
export function getLogger(name: string) {
  return rootLogger.child({ module: name });
}

// Export root logger for direct use if needed
export { rootLogger };

// Pre-configured loggers for common modules
export const analyticsLogger = getLogger("analytics");
export const routeLogger = getLogger("route");
