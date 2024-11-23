import _ from 'lodash'
import YAML from 'yaml'
import fs from 'node:fs'
import { logger } from 'node-karin'
import chokidar from 'chokidar'
import Version from './Version.js'
import YamlReader from './YamlReader.js'

interface Config {
  [key: string]: any; // 表示可以使用字符串索引，值可以是任何类型
}
class Config {
  constructor () {
    this.config = {}
    /** 监听文件 */
    this.watcher = { config: {}, defSet: {} }

    this.initCfg()
  }

  /** 初始化配置 */
  initCfg () {
    const path = `./config/plugin/${Version.pluginName}/`
    if (!fs.existsSync(path)) fs.mkdirSync(path)
    const pathDef = `${Version.pluginPath}/config/default_config/`
    const files = fs.readdirSync(pathDef).filter(file => file.endsWith('.yaml'))
    for (const file of files) {
      if (!fs.existsSync(`${path}${file}`)) {
        fs.copyFileSync(`${pathDef}${file}`, `${path}${file}`)
      } else {
        const config = YAML.parse(fs.readFileSync(`${path}${file}`, 'utf8'))
        const defConfig = YAML.parse(fs.readFileSync(`${pathDef}${file}`, 'utf8'))
        const { differences, result } = this.mergeObjectsWithPriority(config, defConfig)
        if (differences) {
          fs.copyFileSync(`${pathDef}${file}`, `${path}${file}`)
          for (const key in result) {
            this.modify(file.replace('.yaml', ''), key, result[key])
          }
        }
      }
      this.watch(`${path}${file}`, file.replace('.yaml', ''), 'config')
    }
  }

  /** 其他 */
  get Other () {
    return this.getDefOrConfig('other')
  }

  get Cof () {
    return this.getDefOrConfig('COF')
  }

  get state () {
    return this.getDefOrConfig('state')
  }

  get GroupYaml () {
    return this.getDefOrConfig('group')
  }

  /** 默认配置和用户配置 */
  getDefOrConfig (name: string) {
    const def = this.getdefSet(name)
    const config = this.getConfig(name)
    return { ...def, ...config }
  }

  get package () {
    if (this._package) return this._package
    this._package = JSON.parse(fs.readFileSync(`${Version.pluginPath}/package.json`, 'utf8'))
    return this._package
  }

  /** 默认配置 */
  getdefSet (name: any) {
    return this.getYaml('default_config', name)
  }

  /** 用户配置 */
  getConfig (name: any) {
    return this.getYaml('config', name)
  }

  /**
   * 获取配置yaml
   * @param type 默认跑配置-defSet，用户配置-config
   * @param name 名称
   */
  getYaml (type: string | undefined, name: any) {
    let file = ''
    if (type === 'default_config') {
      file = `${Version.pluginPath}/config/${type}/${name}.yaml`
    } else if (type === 'config') {
      file = `./config/plugin/${Version.pluginName}/${name}.yaml`
    }
    const key = `${type}.${name}`

    if (this.config[key]) return this.config[key]

    this.config[key] = YAML.parse(
      fs.readFileSync(file, 'utf8')
    )

    this.watch(file, name, type)

    return this.config[key]
  }

  /** 监听配置文件 */
  watch (file: string | readonly string[], name: string, type = 'default_config') {
    const key = `${type}.${name}`
    if (this.watcher[key]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', async path => {
      delete this.config[key]
      logger.mark(`[${Version.pluginName}][修改配置文件][${type}][${name}]`)
    })

    this.watcher[key] = watcher
  }

  /**
   * 修改设置
   * @param {String} name 文件名
   * @param {String} key 修改的key值
   * @param {String|Number} value 修改的value值
   * @param {'config'|'default_config'} type 配置文件或默认
   */
  modify (name: string, key: string, value: any, type: 'config' | 'default_config' = 'config') {
    let path = ''
    if (type === 'config') {
      path = `./config/plugin/${Version.pluginName}/${name}.yaml`
    } else if (type === 'default_config') {
      path = `${Version.pluginPath}/config/${type}/${name}.yaml`
    }
    new YamlReader(path).set(key, value)
    delete this.config[`${type}.${name}`]
  }

  mergeObjectsWithPriority (objA: any, objB: any) {
    let differences = false

    function customizer (objValue: undefined, srcValue: any, key: any, object: any, source: any, stack: any) {
      if (_.isArray(objValue) && _.isArray(srcValue)) {
        return objValue
      } else if (_.isPlainObject(objValue) && _.isPlainObject(srcValue)) {
        if (!_.isEqual(objValue, srcValue)) {
          return _.mergeWith({}, objValue, srcValue, customizer)
        }
      } else if (!_.isEqual(objValue, srcValue)) {
        differences = true
        return objValue !== undefined ? objValue : srcValue
      }
      return objValue !== undefined ? objValue : srcValue
    }

    const result = _.mergeWith({}, objA, objB, customizer)

    return {
      differences,
      result,
    }
  }
}

export default new Config()
