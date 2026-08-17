import { App, PluginSettingTab, Setting } from 'obsidian';
import type OdaiPlugin from './main';

export interface OdaiPluginSettings {
	topicsFilePath: string;
}

export const DEFAULT_SETTINGS: OdaiPluginSettings = {
	topicsFilePath: '',
};

export class OdaiSettingTab extends PluginSettingTab {
	plugin: OdaiPlugin;

	constructor(app: App, plugin: OdaiPlugin) {
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
				text.inputEl.addClass('odai-settings-path-input');
			});
	}
}
