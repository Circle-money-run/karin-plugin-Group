import fs from 'node:fs';
import { YamlEditor } from 'node-karin';
class Config {
    getFilePath(name, type) {
        const config_path = `./config/${type}/`;
        const file = `${config_path}${name}.yaml`;
        try {
            if (!fs.existsSync(file)) {
                const default_file = `${config_path}default/${name}.yaml`;
                fs.copyFileSync(default_file, file);
            }
        }
        catch (err) { }
        return file;
    }
    save(name, type, data, other) {
        try {
            const file = this.getFilePath(name, type);
            const Yaml = new YamlEditor(file);
            Yaml.set(data, other);
            Yaml.save();
        }
        catch (error) {
            console.error(error);
        }
    }
}
export default new Config();
