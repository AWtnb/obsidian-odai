import { App, PluginSettingTab, Setting } from 'obsidian';
import type RandomTopicPlugin from './main';

export interface RandomTopicPluginSettings {
	topicsFilePath: string;
}

export const DEFAULT_SETTINGS: RandomTopicPluginSettings = {
	topicsFilePath: '',
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
			.setName('Topics note path')
			.setDesc(
				'トピック候補を1行ずつ書いたノートのパス（例: templates/topics）。' +
					'新規ノート作成時にこのノートの各行からランダムに1つ選んで {{topic}} を置換する。',
			)
			.addText((text) => {
				text.setPlaceholder('templates/topics')
					.setValue(this.plugin.settings.topicsFilePath)
					.onChange(async (value) => {
						this.plugin.settings.topicsFilePath = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.addClass('random-topic-settings-path-input');
			});
	}
}
