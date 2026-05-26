import { App, PluginSettingTab, Setting, TFolder, Vault } from "obsidian";
import EpubPlugin from "./EpubPlugin";

export type ColumnLayout = 'single' | 'double';
export type EpubTheme = 'auto' | 'light' | 'sepia' | 'dark';

export const FONT_OPTIONS: Record<string, string> = {
	'default':                                    'Default (use book fonts)',
	'Georgia, serif':                             'Georgia',
	'"Palatino Linotype", Palatino, serif':       'Palatino',
	'"Times New Roman", Times, serif':            'Times New Roman',
	'Arial, Helvetica, sans-serif':               'Arial',
	'Verdana, Geneva, sans-serif':                'Verdana',
	'"Trebuchet MS", sans-serif':                 'Trebuchet MS',
};

export interface EpubPluginSettings {
	scrolledView: boolean;
	columnLayout: ColumnLayout;
	epubTheme: EpubTheme;
	fontFamily: string;
	notePath: string;
	useSameFolder: boolean;
	tags: string;
	showFontSizeControl: boolean;
	showBrightnessControl: boolean;
	showColumnToggle: boolean;
	showFocusButton: boolean;
}

export const DEFAULT_SETTINGS: EpubPluginSettings = {
	scrolledView: false,
	columnLayout: 'double',
	epubTheme: 'auto',
	fontFamily: 'default',
	notePath: '/',
	useSameFolder: true,
	tags: 'notes/booknotes',
	showFontSizeControl: true,
	showBrightnessControl: true,
	showColumnToggle: true,
	showFocusButton: true,
}

export class EpubSettingTab extends PluginSettingTab {
	plugin: EpubPlugin;

	constructor(app: App, plugin: EpubPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'EPUB Settings' });

		// ── Reading view ──────────────────────────────────────────────
		containerEl.createEl('h3', { text: 'Reading view' });

		new Setting(containerEl)
			.setName("Scrolled view")
			.setDesc("Enables seamless scrolling between pages instead of paged navigation.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.scrolledView)
				.onChange(async (value) => {
					this.plugin.settings.scrolledView = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Default column layout")
			.setDesc("Number of columns when opening an EPUB. Can also be toggled in the reader toolbar.")
			.addDropdown(dropdown => dropdown
				.addOptions({ single: 'Single column', double: 'Double column' })
				.setValue(this.plugin.settings.columnLayout)
				.onChange(async (value) => {
					this.plugin.settings.columnLayout = value as ColumnLayout;
					await this.plugin.saveSettings();
				}));

		let previewEl: HTMLElement;
		const applyPreviewStyle = () => {
			if (!previewEl) return;
			const isDark = document.body.classList.contains('theme-dark');
			const effective = this.plugin.settings.epubTheme === 'auto'
				? (isDark ? 'dark' : 'light')
				: this.plugin.settings.epubTheme;
			const themeColors: Record<string, { background: string; color: string }> = {
				light: { background: '#ffffff', color: '#000000' },
				sepia: { background: '#f4ecd8', color: '#5b4636' },
				dark:  { background: '#000000', color: '#ffffff' },
			};
			const { background, color } = themeColors[effective];
			previewEl.style.background = background;
			previewEl.style.color = color;
			const font = this.plugin.settings.fontFamily;
			previewEl.style.fontFamily = font === 'default' ? '' : font;
			const bright = (() => {
				try { return JSON.parse(localStorage.getItem('epub-brightness') ?? '100') as number; }
				catch { return 100; }
			})();
			previewEl.style.filter = bright < 100 ? `brightness(${bright}%)` : '';
		};

		// ── Theme & font ──────────────────────────────────────────────
		containerEl.createEl('h3', { text: 'Theme & font' });

		new Setting(containerEl)
			.setName("Theme")
			.setDesc("Colour theme for epub content. 'Auto' follows Obsidian's light/dark mode.")
			.addDropdown(dropdown => dropdown
				.addOptions({
					auto:  'Auto (follow Obsidian)',
					light: 'Light',
					sepia: 'Sepia',
					dark:  'Dark',
				})
				.setValue(this.plugin.settings.epubTheme)
				.onChange(async (value) => {
					this.plugin.settings.epubTheme = value as EpubTheme;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
					applyPreviewStyle();
				}));

		new Setting(containerEl)
			.setName("Font")
			.setDesc("Font used for epub content.")
			.addDropdown(dropdown => dropdown
				.addOptions(FONT_OPTIONS)
				.setValue(this.plugin.settings.fontFamily)
				.onChange(async (value) => {
					this.plugin.settings.fontFamily = value;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
					applyPreviewStyle();
				}));

		// ── Font size & brightness ────────────────────────────────────
		containerEl.createEl('h3', { text: 'Font size & brightness' });
		containerEl.createEl('p', {
			text: 'Device-specific — stored locally, not synced across devices.',
			cls: 'setting-item-description',
		});

		const savedSize = (() => {
			try { return JSON.parse(localStorage.getItem('epub-font-size') ?? '100') as number; }
			catch { return 100; }
		})();

		let sliderInput: HTMLInputElement;
		let numberInput: HTMLInputElement;

		const applySize = (val: number) => {
			const clamped = Math.max(80, Math.min(300, isNaN(val) ? 100 : val));
			sliderInput.value = String(clamped);
			numberInput.value = String(clamped);
			previewEl.style.fontSize = `${clamped}%`;
			localStorage.setItem('epub-font-size', JSON.stringify(clamped));
			window.dispatchEvent(new StorageEvent('storage', {
				key: 'epub-font-size',
				newValue: JSON.stringify(clamped),
				storageArea: localStorage,
			}));
		};

		const controlRow = containerEl.createDiv();
		controlRow.style.cssText = 'display:flex; align-items:center; gap:10px; margin:8px 18px 0;';

		sliderInput = controlRow.createEl('input');
		sliderInput.type = 'range';
		sliderInput.min = '80';
		sliderInput.max = '300';
		sliderInput.value = String(savedSize);
		sliderInput.style.flex = '1';
		sliderInput.addEventListener('input', () => applySize(parseInt(sliderInput.value)));

		numberInput = controlRow.createEl('input');
		numberInput.type = 'number';
		numberInput.min = '80';
		numberInput.max = '300';
		numberInput.value = String(savedSize);
		numberInput.style.cssText = 'width:64px;';
		numberInput.addEventListener('change', () => applySize(parseInt(numberInput.value)));

		const percentLabel = controlRow.createSpan({ text: '%' });
		percentLabel.style.color = 'var(--text-muted)';

		previewEl = containerEl.createDiv();
		previewEl.style.cssText = `font-size:${savedSize}%; padding:12px 18px; margin:8px 0 16px; border:1px solid var(--background-modifier-border); border-radius:4px;`;
		previewEl.textContent = 'The quick brown fox jumps over the lazy dog.';
		applyPreviewStyle();

		// brightness slider
		containerEl.createEl('p', { text: 'Brightness', cls: 'setting-item-name' }).style.cssText = 'margin:8px 18px 4px;';

		const savedBrightness = (() => {
			try { return JSON.parse(localStorage.getItem('epub-brightness') ?? '100') as number; }
			catch { return 100; }
		})();

		let brightSlider: HTMLInputElement;
		let brightNumber: HTMLInputElement;

		const applyBrightness = (val: number) => {
			const clamped = Math.max(20, Math.min(100, isNaN(val) ? 100 : val));
			brightSlider.value = String(clamped);
			brightNumber.value = String(clamped);
			localStorage.setItem('epub-brightness', JSON.stringify(clamped));
			window.dispatchEvent(new StorageEvent('storage', {
				key: 'epub-brightness',
				newValue: JSON.stringify(clamped),
				storageArea: localStorage,
			}));
			applyPreviewStyle();
		};

		const brightRow = containerEl.createDiv();
		brightRow.style.cssText = 'display:flex; align-items:center; gap:10px; margin:0 18px 16px;';

		brightSlider = brightRow.createEl('input');
		brightSlider.type = 'range';
		brightSlider.min = '20';
		brightSlider.max = '100';
		brightSlider.value = String(savedBrightness);
		brightSlider.style.flex = '1';
		brightSlider.addEventListener('input', () => applyBrightness(parseInt(brightSlider.value)));

		brightNumber = brightRow.createEl('input');
		brightNumber.type = 'number';
		brightNumber.min = '20';
		brightNumber.max = '100';
		brightNumber.value = String(savedBrightness);
		brightNumber.style.cssText = 'width:64px;';
		brightNumber.addEventListener('change', () => applyBrightness(parseInt(brightNumber.value)));

		const brightLabel = brightRow.createSpan({ text: '%' });
		brightLabel.style.color = 'var(--text-muted)';

		// ── Toolbar ───────────────────────────────────────────────────
		containerEl.createEl('h3', { text: 'Reader toolbar' });
		containerEl.createEl('p', {
			text: 'Choose which controls appear in the toolbar above the reader. The back button always appears as a floating overlay when applicable.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName("Show font size control")
			.setDesc("Show the font size slider in the reader toolbar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFontSizeControl)
				.onChange(async (value) => {
					this.plugin.settings.showFontSizeControl = value;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
				}));

		new Setting(containerEl)
			.setName("Show brightness control")
			.setDesc("Show the brightness slider in the reader toolbar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showBrightnessControl)
				.onChange(async (value) => {
					this.plugin.settings.showBrightnessControl = value;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
				}));

		new Setting(containerEl)
			.setName("Show column layout toggle")
			.setDesc("Show the single/double column toggle buttons in the reader toolbar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showColumnToggle)
				.onChange(async (value) => {
					this.plugin.settings.showColumnToggle = value;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
				}));

		new Setting(containerEl)
			.setName("Show focus button")
			.setDesc("Show the focus mode button in the reader toolbar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFocusButton)
				.onChange(async (value) => {
					this.plugin.settings.showFocusButton = value;
					await this.plugin.saveSettings();
					this.plugin.refreshEpubViews();
				}));

		// ── Notes ─────────────────────────────────────────────────────
		containerEl.createEl('h3', { text: 'Notes' });

		new Setting(containerEl)
			.setName("Same folder")
			.setDesc("Create the epub note file in the same folder as the EPUB.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useSameFolder)
				.onChange(async (value) => {
					this.plugin.settings.useSameFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Note folder")
			.setDesc("Default folder for epub notes when 'Same folder' is off.")
			.addDropdown(dropdown => dropdown
				.addOptions(getFolderOptions(this.app))
				.setValue(this.plugin.settings.notePath)
				.onChange(async (value) => {
					this.plugin.settings.notePath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Tags")
			.setDesc("Tags added to new note metadata.")
			.addText(text => {
				text.inputEl.size = 50;
				text
					.setValue(this.plugin.settings.tags)
					.onChange(async (value) => {
						this.plugin.settings.tags = value;
						await this.plugin.saveSettings();
					});
			});
	}
}

function getFolderOptions(app: App) {
	const options: Record<string, string> = {};
	Vault.recurseChildren(app.vault.getRoot(), (f) => {
		if (f instanceof TFolder) {
			options[f.path] = f.path;
		}
	});
	return options;
}
