export const logger = {
	log: (...args: unknown[]) => {
		globalThis.console.log(...args);
	},
	info: (...args: unknown[]) => {
		globalThis.console.info(...args);
	},
	warn: (...args: unknown[]) => {
		globalThis.console.warn(...args);
	},
	error: (...args: unknown[]) => {
		globalThis.console.error(...args);
	},
};
