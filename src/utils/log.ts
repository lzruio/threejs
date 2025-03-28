import log from 'loglevel'

const isProd = import.meta.env.PROD

// 日志级别
if (isProd) {
  log.setLevel('warn')
} else {
  log.setLevel('debug')
}

export default log
