import { YamlEditor, logger } from 'node-karin';
import Version from './Version.js';
const CfgPath = `./config/plugin/${Version.pluginName}`;
const EditAddend = async (e, Msg1, Msg2, term, value, path) => {
    try {
        const yaml = new YamlEditor(`${CfgPath}/${path}.yaml`);
        const data = yaml.get(term);
        if (!Array.isArray(data)) {
            await e.reply('\n配置文件格式错误❌', { at: true });
            return true;
        }
        if (data.includes(value)) {
            await e.reply(Msg2, { at: true });
            return true;
        }
        yaml.append(term, String(value));
        yaml.save();
        await e.reply(Msg1, { at: true });
        return true;
    }
    catch (error) {
        await e.reply('失败: 未知错误❌', { at: true });
        logger.error(error);
        return true;
    }
};
const EditRemove = async (e, Msg1, Msg2, term, value, path) => {
    try {
        const yaml = new YamlEditor(`${CfgPath}/${path}.yaml`);
        const data = yaml.get(term);
        if (!Array.isArray(data)) {
            await e.reply('\n配置文件格式错误❌', { at: true });
            return true;
        }
        if (!data.includes(value)) {
            await e.reply(Msg2, { at: true });
            return true;
        }
        yaml.remove(term, String(value));
        yaml.save();
        await e.reply(Msg1, { at: true });
        return true;
    }
    catch (error) {
        await e.reply('失败: 未知错误❌', { at: true });
        logger.error(error);
        return true;
    }
};
const EditSet = async (e, Msg1, Msg2, term, value, path) => {
    try {
        const yaml = new YamlEditor(`${CfgPath}/${path}.yaml`);
        const data = yaml.get(term);
        if (data === value)
            return await e.reply(Msg2);
        yaml.set(term, value);
        yaml.save();
        await e.reply(Msg1);
        return true;
    }
    catch (error) {
        await e.reply('失败: 未知错误❌');
        logger.error(error);
        return true;
    }
};
const EditTest = async (e) => {
    try {
        const yaml = new YamlEditor(`${CfgPath}/group.yaml`);
        const value = [];
        yaml.set(`${e.group_id}.rule`, 1);
        yaml.set(`${e.group_id}.words`, value);
        yaml.set(`${e.group_id}.enable`, true);
        yaml.set(`${e.group_id}.ban`, true);
        yaml.set(`${e.group_id}.time`, 600);
        yaml.save();
        return true;
    }
    catch (error) {
        logger.error(error);
        return true;
    }
};
export default {
    EditAddend,
    EditRemove,
    EditTest,
    EditSet
};
