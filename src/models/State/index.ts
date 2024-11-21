import _ from 'lodash'
import moment from 'moment'
import { Config, Version } from '@/components'
import getBotState from './BotState.js'
import getCPU from './CPU.js'
import getFastFetch from './FastFetch.js'
import { getDiskSpeed, getFsSize } from './FsSize.js'
import getGPU from './GPU.js'
import Monitor from './Monitor.js'
import { getNetwork, getNetworkTestList } from './Network.js'
import getNode from './NodeInfo.js'
import getOtherInfo, { getCopyright } from './OtherInfo.js'
import getRAM from './RAM.js'
import getSWAP from './SWAP.js'
import getStyle, { getBackground } from './style.js'
import { logger } from 'node-karin'
import fs from 'fs'

export async function getData (e: any) {
  e.isPro = e.msg.includes('pro')
  e.isDebug = e.msg.includes('debug')
  const timeStr: string[] = []
  const _nameMap1 = ['CPU', 'RAM', 'SWAP', 'GPU', 'Node']
  const _nameMap2 = ['visualData', 'FastFetch', 'FsSize', 'NetworkTest', 'BotState', 'Style']
  const startUsage = {
    mem: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
  function timePromiseExecution (promiseFn: Promise<any>, name: string) {
    const start = Date.now()
    return promiseFn.then((result: any) => {
      const end = Date.now()
      logger.debug(`Promise ${name}: ${end - start} ms`)
      timeStr.push(`${name}: ${end - start} ms`)
      return result
    })
  }

  const visualDataPromise = Promise.all([
    getCPU(),
    getRAM(),
    getSWAP(),
    getGPU(),
    getNode()
  ].map((v, i) => timePromiseExecution(v, _nameMap1[i])))
  const promiseTaskList = [
    visualDataPromise,
    getFastFetch(e),
    getFsSize(),
    getNetworkTestList(e),
    getBotState(e),
    getStyle()
  ].map((v, i) => timePromiseExecution(v, _nameMap2[i]))
  const start = Date.now()
  const [
    visualData,
    FastFetch,
    HardDisk, psTest, BotStatusList, style
  ] = await Promise.all(promiseTaskList).then(res => {
    const end = Date.now()
    logger.debug(`Promise all: ${end - start} ms`)
    timeStr.push(`all: ${end - start} ms`)
    return res
  })
  const endUsage = {
    mem: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
  e.isDebug && e.reply([
    timeStr.join('\n'),
    `\nstartCpuUsageUser: ${startUsage.cpu.user}\n`,
    `endCpuUsageUser: ${endUsage.cpu.user}\n`,
    `startCpuUsageSystem: ${startUsage.cpu.system}\n`,
    `endCpuUsageSystem: ${endUsage.cpu.system}\n`,
    `startMemUsageUser: ${startUsage.mem.rss}\n`,
    `endMemUsageUser: ${endUsage.mem.rss}`
  ])
  const chartData = JSON.stringify(
    checkIfEmpty(Monitor.chartData, ['echarts_theme', 'cpu', 'ram'])
      ? ''
      : Monitor.chartData
  )

  // 配置
  const { closedChart } = Config.getYaml('config', 'state')

  return {
    BotStatusList,
    chartData: closedChart ? false : chartData,
    visualData: _.compact(visualData),
    otherInfo: getOtherInfo(e),
    psTest: _.isEmpty(psTest) ? undefined : psTest,
    fsStats: getDiskSpeed(),
    copyright: await getCopyright(),
    network: getNetwork(),
    Config: JSON.stringify(Config.getYaml('config', 'state')),
    FastFetch,
    HardDisk,
    style,
    time: moment().format('YYYY-MM-DD HH:mm:ss'),
    isPro: e.isPro,
    chartCfg: JSON.stringify(getChartCfg())
  }
}

export async function getMonitorData () {
  return {
    chartData: JSON.stringify(Monitor.chartData),
    backdrop: await getBackground(),
    chartCfg: JSON.stringify(getChartCfg())
  }
}

function getChartCfg () {
  const echarts_theme = readJSON('resources/state/theme_westeros.json')

  return {
    echarts_theme
  }
}

function checkIfEmpty (data: any, omits: string[] = []): any {
  const filteredData = _.omit(data, omits)
  return _.every(filteredData, (value) =>
    _.isPlainObject(value) ? checkIfEmpty(value) : _.isEmpty(value))
}

function readJSON (file = '') {
  if (fs.existsSync(`${Version.pluginPath}/${file}`)) {
    try {
      return JSON.parse(fs.readFileSync(`${Version.pluginPath}/${file}`, 'utf8'))
    } catch (e) {
      console.log(e)
    }
  }
  return {}
}
