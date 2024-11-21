import { Config, Version } from '@/components'
import Monitor from './Monitor.js'
import { getFileSize, createAbortCont } from './utils.js'
import { logger } from 'node-karin'

const defList = [
  { name: 'Baidu', url: 'https://baidu.com' },
  { name: 'Google', url: 'https://google.com' },
  { name: 'Github', url: 'https://github.com' },
  { name: 'Gitee', url: 'https://gitee.com' }
]
/**
 * 获取网络测试列表。
 * @param e
 * @returns {Promise<Array>} 返回一个Promise，该Promise解析为网络测试结果的数组。
 */
export function getNetworkTestList (e: any) {
  const { psTestSites, psTestTimeout } = Config.getYaml('config', 'state')
  if (!psTestSites) {
    return Promise.resolve([])
  }
  const parsedData = parseConfig(psTestSites, psTestTimeout)

  if (!parsedData.show) {
    return Promise.resolve([])
  }
  if (parsedData.show === 'pro' && !e.isPro) {
    return Promise.resolve([])
  }
  if (parsedData.list.length === 0) {
    return Promise.resolve([])
  }

  // 使用Promise.all集中处理所有Promise
  let currentRequests = 0
  return Promise.all(parsedData.list.map((site) => {
    currentRequests++
    return handleSite(site).finally(() => {
      if (--currentRequests === 0) {
        logger.debug(`[${Version.pluginName}][状态]已完成所有网络测试`)
      }
    })
  }))
}

const handleSite = (site: any) => {
  return getNetworkLatency(site.url, site.timeout, site.useProxy)
    .then(res => ({ first: site.name, tail: res }))
    .catch(error => {
      const errorMsg = handleError(error, site.name)
      const errorSpan = `<span style='color:#F44336'>${errorMsg}</span>`
      return { first: site.name, tail: errorSpan }
    })
}

const handleError = (error: { name: string; message: string | string[] }, siteName: any) => {
  let errorMsg = 'error'
  const prefix = `[${Version.pluginName}][状态]`
  if (error.name === 'AbortError') {
    logger.warn(`${prefix}请求 ${siteName} 超时`)
    errorMsg = 'timeout'
  } else if (error.message.includes('ECONNRESET')) {
    logger.warn(`${prefix}请求 ${siteName} 发生了 ECONNRESET 错误:`, error.message)
    errorMsg = 'econnreset'
  } else {
    logger.error(`${prefix}请求 ${siteName} 过程中发生错误:`, error.message)
  }
  return errorMsg
}
/**
 * 解析配置参数并返回配置对象。
 * @param {Array | string | boolean} psTestSites - 预期应该是对象包含show,list,timeout
 * @param {number} psTestTimeout - 保留老配置文件psTestTimeout
 * @returns {object} 包含配置信息的对象。
 */
function parseConfig (psTestSites: { show?: string | boolean; list?: any[]; timeout?: number } | never[], psTestTimeout: any) {
  let data: { show: string | boolean; list: any[]; timeout: number } = {
    show: 'pro',
    list: [],
    timeout: psTestTimeout ?? 5000
  }
  if (Array.isArray(psTestSites)) {
    data.list = psTestSites
  } else if (typeof psTestSites === 'object') {
    data = { ...data, ...psTestSites }
  } else if (
    (typeof psTestSites === 'boolean' && psTestSites === true) ||
    (typeof psTestSites === 'string' && psTestSites === 'default')
  ) {
    data.show = true
    data.list = defList
  }

  return data
}
/**
 * 网络测试
 * @param {string} url 测试的url
 * @param {number} [timeoutTime] 超时时间
 * @param {boolean} useProxy 是否使用代理
 * @returns {string}
 */
async function getNetworkLatency (url: string | URL | Request, timeoutTime = 5000, useProxy = false) {
  const { controller, clearTimeout } = await createAbortCont(timeoutTime)

  try {
    const startTime = Date.now()
    // const { status } = await request.get(url, {
    //   signal: controller.signal,
    //   origError: true,
    //   outErrorLog: false,
    //   agent: !!useProxy
    // })
    const status = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36'
      }
    }).then(res => res.status).catch(error => {
      logger.error(`[${Version.pluginName}][状态]请求网络时发生错误:`, error.message)
    })
    const endTime = Date.now()
    const delay = endTime - startTime

    const COLOR_DELAY_GOOD = '#188038'
    const COLOR_DELAY_AVERAGE = '#d68100'
    const COLOR_DELAY_BAD = '#F44336'
    const COLOR_STATUS_OK = '#188038'
    const COLOR_STATUS_WARNING = '#FF9800'
    const COLOR_STATUS_DANGER = '#9C27B0'
    const COLOR_STATUS_INFO = '#03A9F4'
    const COLOR_STATUS_BAD = '#F44336'

    const color = delay > 2000
      ? COLOR_DELAY_BAD
      : delay > 500
        ? COLOR_DELAY_AVERAGE
        : COLOR_DELAY_GOOD

    const statusColor = (status as number) >= 500
      ? COLOR_STATUS_DANGER
      : (status as number) >= 400
          ? COLOR_STATUS_BAD
          : (status as number) >= 300
              ? COLOR_STATUS_WARNING
              : (status as number) >= 200
                  ? COLOR_STATUS_OK
                  : (status as number) >= 100
                      ? COLOR_STATUS_INFO
                      : ''

    return `<span style='color:${statusColor}'>${status}</span> | <span style='color:${color}'>${delay}ms</span>`
  } finally {
    clearTimeout()
  }
}
/** 获取当前网速 */
export function getNetwork () {
  const network = Monitor.network
  if (!network || network.length === 0) {
    return false
  }
  const data = []
  for (const v of network) {
    if (v.rx_sec != null && v.tx_sec != null) {
      const _rx = getFileSize(v.rx_sec, { showByte: false, showSuffix: false })
      const _tx = getFileSize(v.tx_sec, { showByte: false, showSuffix: false })
      data.push({
        first: v.iface,
        tail: `↑${_tx}/s | ↓${_rx}/s`
      })
    }
  }
  return data.length === 0 ? false : data
}
