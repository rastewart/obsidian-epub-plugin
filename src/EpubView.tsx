import { WorkspaceLeaf, FileView, TFile, Menu, moment } from "obsidian";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { EpubPluginSettings } from "./EpubPluginSettings";
import { EpubReader } from "./EpubReader";
import { readProgress, writeProgress, updateProgress } from "./epubProgress";

export const EPUB_FILE_EXTENSION = "epub";
export const VIEW_TYPE_EPUB = "epub";
export const ICON_EPUB = "doc-epub";

export class EpubView extends FileView {
  allowNoFile: false;

  private currentContents: ArrayBuffer | null = null;
  private currentLocation: string | number = 0;
  private currentTocOffset = 0;
  private currentTocBottomOffset = 0;

  constructor(leaf: WorkspaceLeaf, private settings: EpubPluginSettings) {
    super(leaf);
  }

  onPaneMenu(menu: Menu, source: 'more-options' | 'tab-header' | string): void {
    menu.addItem((item) => {
      item
        .setTitle("Create new epub note")
        .setIcon("document")
        .onClick(async () => {
          const fileName = this.getFileName();
          let file = this.app.vault.getAbstractFileByPath(fileName);
          if (file == null || !(file instanceof TFile)) {
            file = await this.app.vault.create(fileName, this.getFileContent());
          }
          const fileLeaf = this.app.workspace.createLeafBySplit(this.leaf);
          fileLeaf.openFile(file as TFile, { active: true });
        });
    });
    menu.addSeparator();
    super.onPaneMenu(menu, source);
  }

  getFileName() {
    let filePath;
    if (this.settings.useSameFolder) {
      filePath = `${this.file.parent.path}/`;
    } else {
      filePath = this.settings.notePath.endsWith('/')
        ? this.settings.notePath
        : `${this.settings.notePath}/`;
    }
    return `${filePath}${this.file.basename}.md`;
  }

  getFileContent() {
    return `---
Tags: ${this.settings.tags}
Date: ${moment().toLocaleString()}
---

# ${this.file.basename}
`;
  }

  private renderReader(file: TFile) {
    if (!this.currentContents) return;
    ReactDOM.render(
      <EpubReader
        contents={this.currentContents}
        title={file.basename}
        scrolled={this.settings.scrolledView}
        defaultColumnLayout={this.settings.columnLayout}
        epubTheme={this.settings.epubTheme}
        fontFamily={this.settings.fontFamily}
        showFontSizeControl={this.settings.showFontSizeControl}
        showBrightnessControl={this.settings.showBrightnessControl}
        showColumnToggle={this.settings.showColumnToggle}
        showFocusButton={this.settings.showFocusButton}
        location={this.currentLocation}
        onLocationChange={async (loc) => {
          this.currentLocation = loc;
          await updateProgress(this.app, file, { location: loc });
        }}
        tocOffset={this.currentTocOffset}
        tocBottomOffset={this.currentTocBottomOffset}
        leaf={this.leaf}
      />,
      this.contentEl
    );
  }

  refreshSettings() {
    if (this.file) this.renderReader(this.file);
  }

  async onLoadFile(file: TFile): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    this.contentEl.empty();

    let progress = await readProgress(this.app, file);
    if (!progress) {
      progress = { location: 0, archived: false, lastOpened: Date.now() };
    } else {
      progress = { ...progress, lastOpened: Date.now(), archived: false };
    }
    await writeProgress(this.app, file, progress);

    const viewHeaderStyle = getComputedStyle(this.containerEl.parentElement.querySelector('div.view-header'));
    const viewHeaderHeight = parseFloat(viewHeaderStyle.height);
    const viewHeaderWidth = parseFloat(viewHeaderStyle.width);

    const viewContentStyle = getComputedStyle(this.containerEl.parentElement.querySelector('div.view-content'));
    const viewContentPaddingBottom = parseFloat(viewContentStyle.paddingBottom);
    const viewContentPaddingTop = parseFloat(viewContentStyle.paddingTop);

    this.currentTocOffset = (viewHeaderHeight < viewHeaderWidth ? viewHeaderHeight : 0) + viewContentPaddingTop + 1;
    this.currentTocBottomOffset = viewContentPaddingBottom;
    this.currentLocation = progress.location;
    this.currentContents = await this.app.vault.adapter.readBinary(file.path);

    this.renderReader(file);
  }

  onunload(): void {
    ReactDOM.unmountComponentAtNode(this.contentEl);
  }

  getDisplayText() {
    return this.file ? this.file.basename : 'No File';
  }

  canAcceptExtension(extension: string) {
    return extension == EPUB_FILE_EXTENSION;
  }

  getViewType() {
    return VIEW_TYPE_EPUB;
  }

  getIcon() {
    return ICON_EPUB;
  }
}
