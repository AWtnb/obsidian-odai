import { App, PluginSettingTab, Setting } from 'obsidian';
import type RandomTopicPlugin from './main';

const defaultTopics = [
	'今日見た夢',
	'印象的なやり取り',
	'学び',
	'できるようになったこと',
	'感動したこと',
	'驚いたこと',
	'嬉しかったこと',
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
