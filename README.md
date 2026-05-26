![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/caronchen/obsidian-epub-plugin) ![GitHub all releases](https://img.shields.io/github/downloads/caronchen/obsidian-epub-plugin/total) ![GitHub Release Date](https://img.shields.io/github/release-date/caronchen/obsidian-epub-plugin) ![GitHub last commit](https://img.shields.io/github/last-commit/caronchen/obsidian-epub-plugin)

## Obsidian ePub Reader Plugin

An ePub reader plugin for [Obsidian](https://obsidian.md). Opens any file with the `.epub` extension directly inside Obsidian.

- [How to use](#how-to-use)
- [Features](#features)
  - [Reading position sync](#reading-position-sync)
  - [Themes](#themes)
  - [Font selection](#font-selection)
  - [Font size](#font-size)
  - [Brightness](#brightness)
  - [Column layout](#column-layout)
  - [Scrolled view](#scrolled-view)
  - [Reader toolbar](#reader-toolbar)
  - [Back button](#back-button)
  - [Focus mode](#focus-mode)
  - [Recent books](#recent-books)
  - [Book notes](#book-notes)
- [Settings](#settings)
- [Manually installing the plugin](#manually-installing-the-plugin)

---

### How to use

#### 1. Put books into any vault folder

<img width="326" alt="image" src="https://user-images.githubusercontent.com/150803/166110556-32f43b3c-fb54-4767-a8e1-005740359ade.png">

#### 2. Click book to open an epub view

![687BE408-BC9A-4AAC-915F-2CA77DE6516D](https://user-images.githubusercontent.com/150803/166110865-bcf2bade-f88b-40b9-855d-cffbd113132d.png)

#### 3. Reading

![DD6C75EE-3805-43FE-9A86-4CFDF88DBB75](https://user-images.githubusercontent.com/150803/166111153-637ed20c-c49d-4c75-90b8-14ebf4e30172.png)

**TOC**

![260FB389-0503-488B-860D-3535A4F7CACF](https://user-images.githubusercontent.com/150803/166111158-cde58136-8a8a-4d93-96bf-14b7d3f80ab2.png)

---

### Features

#### Reading position sync

Your reading position is saved automatically as you read and restored when you reopen a book. Position data is stored in a small JSON file next to each EPUB inside an `epub-sync/` subfolder:

```
MyBooks/
  MyBook.epub
  epub-sync/
    MyBook.json
```

Because these are ordinary vault files, they sync across devices automatically with tools like [Self-Hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) — no special configuration required.

#### Themes

Choose a colour theme for the epub content area:

| Theme | Description |
|---|---|
| **Auto** | Follows Obsidian's light/dark mode |
| **Light** | White background, black text |
| **Sepia** | Warm paper background, dark brown text |
| **Dark** | Black background, white text |

Change the theme under **Settings → ePub Reader → Theme & font**.

#### Font selection

Override the book's built-in fonts with a system font of your choice. Available options: Default (use book fonts), Georgia, Palatino, Times New Roman, Arial, Verdana, Trebuchet MS.

Change the font under **Settings → ePub Reader → Theme & font**.

#### Font size

Adjust the text size with a slider (80–300%). Font size is **device-specific** — stored locally and not synced, so you can set a comfortable size independently on each device.

- Adjust from the **reader toolbar** while reading
- Adjust from **Settings → ePub Reader → Font size & brightness** with a live preview

#### Brightness

Dim the reader area to reduce eye strain. Brightness is **device-specific** — stored locally and not synced.

- Adjust from the **reader toolbar** while reading (range: 20–100%)
- Adjust from **Settings → ePub Reader → Font size & brightness** with a live preview

#### Column layout

Switch between single-column and double-column layout using the toggle buttons in the reader toolbar. The default layout is configurable under **Settings → ePub Reader → Reading view**. Not available in scrolled view mode.

Column layout preference is **device-specific** and not synced.

#### Scrolled view

By default the reader uses paged navigation (click arrows or use the TOC to move between pages). Enable **Scrolled view** in settings to switch to continuous scrolling through the entire book. Toggle under **Settings → ePub Reader → Reading view**.

#### Reader toolbar

A toolbar above the reader can display any combination of the following controls:

- **Font size** — slider to adjust text size
- **Brightness** — slider to dim the reader area
- **Column layout** — single/double column toggle buttons
- **Focus button** — enter/exit focus mode

Each control can be individually shown or hidden under **Settings → ePub Reader → Reader toolbar**.

#### Back button

When you follow a hyperlink or footnote inside the book, a `←` button appears as a floating overlay in the top-right corner of the reader. Click it to return to where you were. The button disappears automatically when there is nothing to go back to.

#### Focus mode

The **Focus** button in the toolbar hides the Obsidian sidebar, ribbon, and status bar to maximise the reading area. Click **Exit** to restore the interface. Focus mode is designed for desktop use.

#### Recent books

Use **Ctrl+P → Open recent EPUB** to see a searchable list of recently opened books, sorted by last opened date. Each entry has an **Archive** button to hide books you have finished from the list without deleting them.

Use **Ctrl+P → Restore archived EPUB** to unarchive a book and reopen it.

#### Book notes

Right-click (or use the pane menu) on an open EPUB and choose **Create new epub note** to create a Markdown note for the book in your vault. Notes include a YAML front-matter block with configurable tags and the current date.

Note location is configurable under **Settings → ePub Reader → Notes**.

---

### Settings

| Section | Setting | Description |
|---|---|---|
| Reading view | Scrolled view | Continuous scroll instead of paged navigation |
| Reading view | Default column layout | Single or double column when opening a book |
| Theme & font | Theme | Auto / Light / Sepia / Dark |
| Theme & font | Font | Font family for epub content |
| Font size & brightness | Font size | Text size (80–300%), device-specific |
| Font size & brightness | Brightness | Reader brightness (20–100%), device-specific |
| Reader toolbar | Show font size control | Show/hide the font size slider in the toolbar |
| Reader toolbar | Show brightness control | Show/hide the brightness slider in the toolbar |
| Reader toolbar | Show column layout toggle | Show/hide the column toggle buttons in the toolbar |
| Reader toolbar | Show focus button | Show/hide the focus mode button in the toolbar |
| Notes | Same folder | Save book notes in the same folder as the EPUB |
| Notes | Note folder | Default folder for book notes when Same folder is off |
| Notes | Tags | Tags added to new note front matter |

---

### Manually installing the plugin

Copy `main.js`, `styles.css`, and `manifest.json` to your vault at:

```
VaultFolder/.obsidian/plugins/obsidian-epub-plugin/
```
