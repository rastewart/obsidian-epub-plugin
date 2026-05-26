import { App, TFile } from 'obsidian';

export interface BookProgress {
	location: string | number;
	archived: boolean;
	lastOpened: number;
}

export interface BookEntry extends BookProgress {
	epubPath: string;
	name: string;
}

export function progressFolderPath(epubFile: TFile): string {
	const parent = epubFile.parent?.path;
	if (!parent || parent === '/') return 'epub-sync';
	return `${parent}/epub-sync`;
}

export function progressFilePath(epubFile: TFile): string {
	return `${progressFolderPath(epubFile)}/${epubFile.basename}.json`;
}

export async function readProgress(app: App, epubFile: TFile): Promise<BookProgress | null> {
	const path = progressFilePath(epubFile);
	if (!(await app.vault.adapter.exists(path))) return null;
	try {
		return JSON.parse(await app.vault.adapter.read(path)) as BookProgress;
	} catch {
		return null;
	}
}

export async function writeProgress(app: App, epubFile: TFile, progress: BookProgress): Promise<void> {
	const folder = progressFolderPath(epubFile);
	if (!(await app.vault.adapter.exists(folder))) {
		await app.vault.adapter.mkdir(folder);
	}
	await app.vault.adapter.write(progressFilePath(epubFile), JSON.stringify(progress, null, 2));
}

export async function updateProgress(app: App, epubFile: TFile, updates: Partial<BookProgress>): Promise<void> {
	const existing: BookProgress = (await readProgress(app, epubFile)) ?? {
		location: 0,
		archived: false,
		lastOpened: Date.now(),
	};
	await writeProgress(app, epubFile, { ...existing, ...updates });
}

export async function loadAllBookEntries(app: App): Promise<BookEntry[]> {
	const entries: BookEntry[] = [];
	const epubFiles = app.vault.getFiles().filter(f => f.extension === 'epub');
	for (const epubFile of epubFiles) {
		const progress = await readProgress(app, epubFile);
		if (progress) {
			entries.push({ ...progress, epubPath: epubFile.path, name: epubFile.basename });
		}
	}
	return entries;
}
