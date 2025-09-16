// Browser-bunyan logger configuration
import { ConsoleFormattedStream } from "@browser-bunyan/console-formatted-stream";
import * as bunyan from "browser-bunyan";

// Determine log level based on environment
// Production: INFO and higher only
// Development: DEBUG and all levels
const logLevel = import.meta.env.PROD ? "info" : "debug";

// Create console formatted stream for better log output
const consoleStream = new ConsoleFormattedStream();

// Root logger configuration
const rootLogger = bunyan.createLogger({
  name: "jimmyvanveen.com",
  level: logLevel,
  streams: [
    {
      stream: consoleStream,
    },
  ],
});

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
