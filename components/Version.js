import fs from 'fs'
import lodash from 'lodash'
import { fileURLToPath } from 'url'
import { join, dirname, basename } from 'path'

const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const getLine = function (line) {
  line = line.replace(/(^\s*[*-]|\r)/g, '')
  line = line.replace(/\s*`([^`]+`)/g, '<span class="cmd">$1')
  line = line.replace(/`\s*/g, '</span>')
  line = line.replace(/\s*[*-][*-]([^*]+[*-][*-])/g, '<span class="strong">$1')
  line = line.replace(/[*-][*-]\s*/g, '</span>')
  line = line.replace(/ⁿᵉʷ/g, '<span class="new"></span>')
  return line
}

const readLogFile = function (root, versionCount = 5) {
  const logPath = `${root}/CHANGELOG.md`
  let logs = {}
  const changelogs = []
  let currentVersion

  try {
    if (fs.existsSync(logPath)) {
      logs = fs.readFileSync(logPath, 'utf8') || ''
      logs = logs.split('\n')

      let temp = {}
      let lastLine = {}
      lodash.forEach(logs, (line) => {
        if (versionCount <= -1) {
          return false
        }
        const versionRet = /^#\s*([0-9a-zA-Z\\.~\s]+?)\s*$/.exec(line)
        if (versionRet && versionRet[1]) {
          const v = versionRet[1].trim()
          if (!currentVersion) {
            currentVersion = v
          } else {
            changelogs.push(temp)
            versionCount--
          }

          temp = {
            version: v,
            logs: [],
          }
        } else {
          if (!line.trim()) {
            return
          }
          if (/^[*-]/.test(line)) {
            lastLine = {
              title: getLine(line),
              logs: [],
            }
            temp.logs.push(lastLine)
          } else if (/^\s{2,}[*-]/.test(line)) {
            lastLine.logs.push(getLine(line))
          }
        }
      })
      if (temp.logs.length) {
        changelogs.push(temp)
      }
    }
  } catch (e) {
    // do nth
  }
    if (!currentVersion) currentVersion = fs.existsSync(`${root}/package.json`) ? JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8')).version : '0.0.0'
  return { changelogs, currentVersion }
}

const pluginPath = join(__dirname, '..').replace(/\\/g, '/')

const pluginName = basename(pluginPath)

/**
 * @type
 */

const BotVersion = packageJson.version

const { changelogs, currentVersion: version } = readLogFile(pluginPath)

export default {
  version,
  changelogs,
  readLogFile,
  pluginName,
  pluginPath,
  BotVersion,
}