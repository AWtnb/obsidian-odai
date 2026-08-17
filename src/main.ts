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
	OdaiPluginSettings,
	OdaiSettingTab,
} from './settings';

const PLACEHOLDER = '{{topic}}';

// Templaterなど非同期でテンプレートを流し込む環境向けの猶予時間(ms)
const CREATE_EVENT_DELAY_MS = 100;

export default class OdaiPlugin extends Plugin {
	settings!: OdaiPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new OdaiSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (!this.app.workspace.layoutReady) return;
				if (!(file instanceof TFile)) return;
				if (file.extension !== 'md') return;

				window.setTimeout(() => {
					void this.replacePlaceholder(file);
				}, CREATE_EVENT_DELAY_MS);
			}),
		);

		this.addCommand({
			id: 'insert-at-random',
			name: 'Insert at random',
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
				const [topic] = await this.drawTopics(topics, 1);
				editor.replaceSelection(topic!);
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<OdaiPluginSettings>,
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

	/**
	 * シャッフルバッグ方式でトピックを引く。
	 *
	 * this.settings.topicQueue に「まだ使っていない候補」をシャッフル済みの順序で
	 * 保持しておき、先頭から順に消費する。空になったら候補全体を再シャッフルして
	 * 補充するため、全候補を一巡するまでは同じトピックが再登場しない。
	 * data.json に永続化しているので、アプリ再起動やノートをまたいでも効果が続く。
	 *
	 * 候補ノートが編集された場合、現行の候補に存在しない項目はキューから自動的に除外する。
	 *
	 * @param topics 現在の候補一覧
	 * @param count 引きたい件数
	 * @returns 重複のないトピックの配列 (候補数が count に満たない場合は短くなる)
	 */
	private async drawTopics(
		topics: string[],
		count: number,
	): Promise<string[]> {
		// 候補ノートと同期（削除したものが選択肢に残らないようにする）
		const topicSet = new Set(topics);
		let queue = (this.settings.topicQueue ?? []).filter((t) =>
			topicSet.has(t),
		);

		const drawn: string[] = [];
		while (drawn.length < count && drawn.length < topics.length) {
			if (queue.length === 0) {
				// 今回すでに引いた分とすぐ被らないよう、drawn を除いた残りから補充する。
				const rest = topics.filter((t) => !drawn.includes(t));
				queue = this.shuffle(0 < rest.length ? rest : topics);
			}
			const next = queue.shift();
			if (next === undefined) break;
			drawn.push(next);
		}

		this.settings.topicQueue = queue;
		await this.saveSettings();
		return drawn;
	}

	private async replacePlaceholder(file: TFile) {
		// {{topic}} を含まないノートで無駄にトピックノートを読みに行かないよう、
		// まずプレースホルダーの有無だけ軽くチェックしてから読み込む。
		const raw = await this.app.vault.read(file);
		if (!raw.includes(PLACEHOLDER)) return;

		const placeholderCount = raw.split(PLACEHOLDER).length - 1;
		if (placeholderCount === 0) return;

		const topics = await this.getTopicList();
		if (topics.length === 0) {
			new Notice(
				'トピック候補が読み込めなかったため {{topic}} を置換できませんでした。',
			);
			return;
		}

		// シャッフルバッグから出現箇所の数だけ重複なく引く。
		// n < m の場合、超えた分の {{topic}} はそのまま残す。
		const drawn = await this.drawTopics(topics, placeholderCount);

		await this.app.vault.process(file, (content) => {
			const parts = content.split(PLACEHOLDER);
			const replaced = parts.reduce((acc, part, i) => {
				if (i === 0) return part;
				const replacement =
					i - 1 < drawn.length ? drawn[i - 1] : PLACEHOLDER;
				return acc + replacement + part;
			});

			return replaced;
		});
	}
}
