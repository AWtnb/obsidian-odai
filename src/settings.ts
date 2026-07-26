import { App, PluginSettingTab, Setting } from 'obsidian';
import type RandomTopicPlugin from './main';

const defaultTopics = [
	'今朝の夢',
	'印象的なやり取り',
	'学び',
	'できるようになったこと',
	'感動',
	'驚き',
	'嬉しかったこと',
	'ふと思い出したこと',
	'欲しくなったもの',
	'食べ物',
	'天気の印象',
	'目に留まったもの',
	'今日聞いた音楽や音',
	'やってみたくなったこと',
	'誰かの何気ない一言',
	'笑ったこと',
	'頭の中で流れていた曲',
	'買おうか迷ったもの',
	'服装や身につけたもの',
	'ラッキーだったこと',
	'心残り',
];

export interface RandomTopicPluginSettings {
	topics: string[];
}

export const DEFAULT_SETTINGS: RandomTopicPluginSettings = {
	topics: defaultTopics,
};

export class RandomTopicSettingTab extends PluginSettingTab {
	plugin: RandomTopicPlugin;

	constructor(app: App, plugin: RandomTopicPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Topic candidates')
			.setDesc(
				'1行につき1つのトピック候補を入力してください。' +
					'新規ノート作成時に、この中からランダムに1つ選んで {{topic}} を置換します。',
			)
			.addTextArea((text) => {
				text.setPlaceholder(defaultTopics.join('\n'))
					.setValue(this.plugin.settings.topics.join('\n'))
					.onChange(async (value) => {
						this.plugin.settings.topics = value.split('\n');
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 10;
				text.inputEl.addClass('random-topic-settings-textarea');
			});
	}
}
