import fs from 'fs'
import YAML from 'yaml'
import _ from 'lodash'

/**
 * YamlReader类提供了对YAML文件的动态读写功能
 */
export default class YamlReader {
  filePath: string
  document: YAML.Document.Parsed<YAML.Alias.Parsed, true> | YAML.Document.Parsed<YAML.Scalar.Parsed, true> | YAML.Document.Parsed<YAML.YAMLMap.Parsed<YAML.ParsedNode, YAML.ParsedNode | null>, true> | YAML.Document.Parsed<YAML.YAMLSeq.Parsed<YAML.ParsedNode>, true>
  /**
     * 创建一个YamlReader实例。
     * @param {string} filePath - 文件路径
     */
  constructor (filePath: string) {
    this.filePath = filePath
    this.document = this.parseDocument()
  }

  /**
     * 解析YAML文件并返回Document对象，保留注释。
     * @returns {Document} 包含YAML数据和注释的Document对象
     */
  parseDocument () {
    const fileContent = fs.readFileSync(this.filePath, 'utf8')
    return YAML.parseDocument(fileContent)
  }

  /**
   * 修改指定参数的值。
   * @param {string} key - 参数键名
   * @param {any} value - 新的参数值
   */
  set (key: string, value: any) {
    this.document.set(key, value)
    this.write()
  }

  /**
   * 从YAML文件中删除指定参数。
   * @param {string} key - 要删除的参数键名
   */
  rm (key: any) {
    this.document.delete(key)
    this.write()
  }

  get (keyPath: any) {
    return _.get(this.jsonData, keyPath)
  }

  addIn (keyPath: string, value: any) {
    this.document.addIn(keyPath.split('.'), value)
    this.write()
  }

  get jsonData () {
    if (!this.document) {
      return null
    }
    return this.document.toJSON()
  }

  /**
     * 将更新后的Document对象写入YAML文件中。
     */
  write () {
    fs.writeFileSync(this.filePath, this.document.toString(), 'utf8')
  }
}
