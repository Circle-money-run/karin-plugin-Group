import { segment } from 'node-karin'
import { Version } from '@/components'

const puppeteer = await (async () => {
  const m = await import('node-karin')
  const Renderer = m.render || m.Renderer
  return {
    screenshot: async (path: string, options: { data: any; name: string; file: any; tplFile: any; type: any; imgType: string; fileID: any; saveId: any; screensEval: string }) => {
      options.data = { ...options }
      options.name = Version.pluginName + '/' + path
      options.file = options.tplFile
      options.type = options.imgType || 'jpeg'
      options.fileID = options.saveId
      options.screensEval = '#containter'
      const img = await Renderer.render(options)
      return segment.image(img)
    },
  }
})()

export default puppeteer
