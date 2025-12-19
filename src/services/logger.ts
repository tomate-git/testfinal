type Level = 'debug' | 'info' | 'warn' | 'error'

const format = (level: Level, scope: string, msg: string, extra?: any) => {
  const time = new Date().toISOString()
  const base = `[${time}] [${scope}] ${msg}`
  return extra !== undefined ? `${base} ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : base
}

export const logger = {
  debug: (scope: string, msg: string, extra?: any) => console.debug(format('debug', scope, msg, extra)),
  info: (scope: string, msg: string, extra?: any) => console.info(format('info', scope, msg, extra)),
  warn: (scope: string, msg: string, extra?: any) => console.warn(format('warn', scope, msg, extra)),
  error: (scope: string, msg: string, extra?: any) => console.error(format('error', scope, msg, extra))
}
