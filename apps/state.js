import { CPU, RAM, Disk } from '#state'
import karin from 'node-karin'

export const State = karin.command(/^#系统信息$/, async (e) => {
  try {
    // 获取系统信息
    const systemInfo = state.getSystemInfo()
    // 获取CPU信息
    const CPUA = await CPU.CPUUsage()
    const CPUB = await CPU.CPUInfo()
    const RAMA = await RAM.RAM()
    const RAMB = await RAM.SwapRAMUsage()
    const adapter = e.bot.adapter.name
    const implementation = e.bot.version.app_name || e.bot.version.name
    const Disk = Disk.Disk()

    // 组装消息
    const msg = `系统架构：${systemInfo.system}
CPU：${CPUA}
CPU信息: ${CPUB}
内存：${RAMA}
内存交换: ${RAMB}
储存: \n${Disk}
运行环境：NodeJS ${process.version}
标准协议: ${adapter}
适配器: ${implementation}`

    // 回复消息
    return e.reply(msg)
  } catch (error) {
    // 处理错误
    return e.reply(`发生错误: ${error.message}`)
  }
}, { name: '系统信息', priority: '-1' })
