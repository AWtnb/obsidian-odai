import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Notice,
	Plugin,
	TFile,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	RandomTopicPluginSettings,
	RandomTopicSettingTab,
} from './settings';

const TOPIC_PLACEHOLDER = '{{topic}}';

// Templaterなど非同期でテンプレートを流し込む環境向けの猶予時間(ms)
const CREATE_EVENT_DELAY_MS = 100;

export default class RandomTopicPlugin extends Plugin {
	settings!: RandomTopicPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new RandomTopicSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (!this.app.workspace.layoutReady) return;
				if (!(file instanceof TFile)) return;
				if (file.extension !== 'md') return;

				window.setTimeout(() => {
					void this.replaceTopicPlaceholder(file);
				}, CREATE_EVENT_DELAY_MS);
			}),
		);

		this.addCommand({
			id: 'insert-random-topic',
			name: 'Insert random topic',
			editorCallback: async (
				editor: Editor,
				_ctx: MarkdownView | MarkdownFileInfo,
			) => {
				const topics = await this.getTopicList();
				if (topics.length === 0) {
					new Notice(
						'トピック候補が読み込めませんでした。設定画面でノートのパスを確認してください。',
					);
					return;
				}
				const topic = topics[Math.floor(Math.random() * topics.length)];
				editor.replaceSelection(topic!);
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<RandomTopicPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Fisher-Yates algorithm */
	private shuffle<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; 0 < i; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j]!, result[i]!];
		}
		return result;
	}

	private resolveTopicsFile(path: string): TFile | null {
		if (!path) return null;
		const file = this.app.metadataCache.getFirstLinkpathDest(path, '');
		return file;
	}

	/** 設定で指定されたパスのノートを読み込み、1行ずつのトピック候補に変換する */
	private async getTopicList(): Promise<string[]> {
		const path = this.settings.topicsFilePath;
		if (!path) return [];

		const file = this.resolveTopicsFile(path);
		if (!file) {
			new Notice(`トピックノートが見つかりません: ${path}`);
			return [];
		}

		const content = await this.app.vault.read(file);
		return content
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => 0 < line.length);
	}

	private async replaceTopicPlaceholder(file: TFile) {
		// {{topic}} を含まないノートで無駄にトピックノートを読みに行かないよう、
		// まずプレースホルダーの有無だけ軽くチェックしてから読み込む。
		const raw = await this.app.vault.read(file);
		if (!raw.includes(TOPIC_PLACEHOLDER)) return;

		const topics = await this.getTopicList();

		await this.app.vault.process(file, (content) => {
			const parts = content.split(TOPIC_PLACEHOLDER);
			const placeholderCount = parts.length - 1;
			if (placeholderCount === 0) return content;

			if (topics.length === 0) {
				new Notice(
					'トピック候補が読み込めなかったため {{topic}} を置換できませんでした。',
				);
				return content;
			}

			// n個の候補をシャッフルし、出現箇所ごとに先頭から重複なく消費する。
			// n < m の場合、超えた分の {{topic}} はそのまま残す。
			const shuffled = this.shuffle(topics);
			const replaced = parts.reduce((acc, part, i) => {
				if (i === 0) return part;
				const replacement =
					i - 1 < shuffled.length
						? shuffled[i - 1]
						: TOPIC_PLACEHOLDER;
				return acc + replacement + part;
			});

			return replaced;
		});
	}
}
