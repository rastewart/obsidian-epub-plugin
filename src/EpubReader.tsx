import * as React from "react";
import { useEffect, useRef, useState, useCallback } from 'react';
import { WorkspaceLeaf } from 'obsidian';
import { ReactReader, ReactReaderStyle, type IReactReaderStyle } from 'react-reader';
import type { Contents, Rendition } from 'epubjs';
import useLocalStorageState from 'use-local-storage-state';
import { type ColumnLayout, type EpubTheme } from './EpubPluginSettings';

export const EpubReader = ({ contents, title, scrolled, defaultColumnLayout, epubTheme, fontFamily, location, onLocationChange, showFontSizeControl, showBrightnessControl, showColumnToggle, showFocusButton, tocOffset, tocBottomOffset, leaf }: {
  contents: ArrayBuffer;
  title: string;
  scrolled: boolean;
  defaultColumnLayout: ColumnLayout;
  epubTheme: EpubTheme;
  fontFamily: string;
  location: string | number;
  onLocationChange: (loc: string | number) => void;
  showFontSizeControl: boolean;
  showBrightnessControl: boolean;
  showColumnToggle: boolean;
  showFocusButton: boolean;
  tocOffset: number;
  tocBottomOffset: number;
  leaf: WorkspaceLeaf;
}) => {
  const renditionRef = useRef<Rendition | null>(null);
  const [fontSize, setFontSize] = useLocalStorageState<number>('epub-font-size', { defaultValue: 100 });
  const [brightness, setBrightness] = useLocalStorageState<number>('epub-brightness', { defaultValue: 100 });
  const [columnLayout, setColumnLayout] = useLocalStorageState<ColumnLayout>('epub-column-layout', { defaultValue: defaultColumnLayout });
  const [focusMode, setFocusMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | number>(location);
  const [canGoBack, setCanGoBack] = useState(false);
  const historyStack = useRef<(string | number)[]>([location]);
  const isGoingBack = useRef(false);

  const isDarkMode = document.body.classList.contains('theme-dark');
  const effectiveTheme = epubTheme === 'auto' ? (isDarkMode ? 'dark' : 'light') : epubTheme;
  const themeConfig = THEME_CONFIGS[effectiveTheme];

  const viewHeader = useRef<HTMLElement | null>(null);
  useEffect(() => {
    viewHeader.current = leaf.view.containerEl.parentElement?.querySelector('.view-header') as HTMLElement | null;
  }, [leaf]);

  const enterFocusMode = useCallback(() => {
    document.body.classList.add('epub-focus-mode');
    if (viewHeader.current) viewHeader.current.style.display = 'none';
    setFocusMode(true);
  }, []);

  const exitFocusMode = useCallback(() => {
    document.body.classList.remove('epub-focus-mode');
    if (viewHeader.current) viewHeader.current.style.display = '';
    setFocusMode(false);
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove('epub-focus-mode');
      if (viewHeader.current) viewHeader.current.style.display = '';
    };
  }, []);

  const applyThemeAndFont = useCallback((rendition: Rendition) => {
    rendition.themes.override('color', themeConfig.color);
    rendition.themes.override('background', themeConfig.background);
    if (fontFamily !== 'default') {
      rendition.themes.override('font-family', fontFamily);
    } else {
      rendition.themes.override('font-family', '');
    }
  }, [themeConfig, fontFamily]);

  useEffect(() => {
    if (renditionRef.current) applyThemeAndFont(renditionRef.current);
  }, [applyThemeAndFont]);

  const updateFontSize = useCallback((size: number) => {
    renditionRef.current?.themes.fontSize(`${size}%`);
  }, []);

  useEffect(() => {
    updateFontSize(fontSize);
  }, [fontSize, updateFontSize]);

  useEffect(() => {
    const handleResize = () => {
      const epubContainer = leaf.view.containerEl.querySelector('div.epub-container');
      if (!epubContainer) return;
      const viewContentStyle = getComputedStyle(epubContainer.parentElement!);
      renditionRef.current?.resize(
        parseFloat(viewContentStyle.width),
        parseFloat(viewContentStyle.height)
      );
    };
    leaf.view.app.workspace.on('resize', handleResize);
    return () => leaf.view.app.workspace.off('resize', handleResize);
  }, [leaf]);

  const handleLocationChange = useCallback((loc: string | number) => {
    setCurrentLocation(loc);
    if (!isGoingBack.current) {
      historyStack.current.push(loc);
      setCanGoBack(historyStack.current.length > 1);
    }
    isGoingBack.current = false;
    onLocationChange(loc);
  }, [onLocationChange]);

  const goBack = useCallback(() => {
    if (historyStack.current.length <= 1) return;
    historyStack.current.pop();
    const prev = historyStack.current[historyStack.current.length - 1];
    isGoingBack.current = true;
    setCurrentLocation(prev);
    setCanGoBack(historyStack.current.length > 1);
    onLocationChange(prev);
  }, [onLocationChange]);

  const epubOptions = scrolled
    ? { allowPopups: true, flow: "scrolled", manager: "continuous" }
    : { allowPopups: true, spread: columnLayout === 'single' ? 'none' : 'auto' };

  const toggleColumn = () => {
    const next: ColumnLayout = columnLayout === 'single' ? 'double' : 'single';
    setColumnLayout(next);
    (renditionRef.current as any)?.spread(next === 'single' ? 'none' : 'auto');
  };

  const btnBase: React.CSSProperties = {
    padding: '2px 10px',
    border: '1px solid #888',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: isDarkMode ? '#444' : '#ccc',
    fontWeight: 'bold',
  };
  const btnInactive: React.CSSProperties = {
    ...btnBase,
    background: 'transparent',
  };

  const showToolbar = showFontSizeControl || showBrightnessControl || showColumnToggle || showFocusButton;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {showToolbar && (
        <div style={{ padding: '6px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          {showFontSizeControl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="fontSizeSlider" style={{ whiteSpace: 'nowrap' }}>Font size</label>
              <input
                id="fontSizeSlider"
                type="range"
                min="80"
                max="300"
                value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value))}
              />
            </div>
          )}
          {showBrightnessControl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="brightnessSlider" style={{ whiteSpace: 'nowrap' }}>Brightness</label>
              <input
                id="brightnessSlider"
                type="range"
                min="20"
                max="100"
                value={brightness}
                onChange={e => setBrightness(parseInt(e.target.value))}
              />
            </div>
          )}
          {showColumnToggle && !scrolled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button style={columnLayout === 'single' ? btnActive : btnInactive} onClick={toggleColumn} title="Single column">▌</button>
              <button style={columnLayout === 'double' ? btnActive : btnInactive} onClick={toggleColumn} title="Double column">▌▌</button>
            </div>
          )}
          {showFocusButton && (
            <button
              style={{ ...btnInactive, marginLeft: 'auto' }}
              onClick={focusMode ? exitFocusMode : enterFocusMode}
              title={focusMode ? "Exit focus mode" : "Focus mode"}
            >
              {focusMode ? 'Exit' : 'Focus'}
            </button>
          )}
        </div>
      )}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", filter: brightness < 100 ? `brightness(${brightness}%)` : undefined }}>
        <ReactReader
          title={title}
          showToc={true}
          location={currentLocation}
          locationChanged={handleLocationChange}
          swipeable={false}
          url={contents}
          getRendition={(rendition: Rendition) => {
            renditionRef.current = rendition;
            rendition.hooks.content.register((contents: Contents) => {
              const body = contents.window.document.body;
              body.oncontextmenu = () => false;
            });
            applyThemeAndFont(rendition);
            updateFontSize(fontSize);
          }}
          epubOptions={epubOptions}
          readerStyles={themeConfig.readerStyle}
        />
        {canGoBack && (
          <button
            onClick={goBack}
            title="Go back"
            style={{
              position: 'absolute',
              top: '44px',
              right: '8px',
              zIndex: 100,
              padding: '3px 10px',
              border: '1px solid rgba(136,136,136,0.6)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              background: isDarkMode ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
              color: isDarkMode ? '#ddd' : '#333',
            }}
          >
            ←
          </button>
        )}
      </div>
    </div>
  );
};

// ── Theme definitions ────────────────────────────────────────────────────────

interface ThemeConfig {
  background: string;
  color: string;
  readerStyle: IReactReaderStyle;
}

const THEME_CONFIGS: Record<Exclude<EpubTheme, 'auto'>, ThemeConfig> = {
  light: {
    background: '#ffffff',
    color: '#000000',
    readerStyle: {
      ...ReactReaderStyle,
      readerArea: { ...ReactReaderStyle.readerArea, transition: undefined },
    },
  },
  sepia: {
    background: '#f4ecd8',
    color: '#5b4636',
    readerStyle: {
      ...ReactReaderStyle,
      arrow: { ...ReactReaderStyle.arrow, color: '#5b4636' },
      arrowHover: { ...ReactReaderStyle.arrowHover, color: '#3d2e23' },
      readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: '#f4ecd8', transition: undefined },
      titleArea: { ...ReactReaderStyle.titleArea, color: '#5b4636' },
      tocArea: { ...ReactReaderStyle.tocArea, background: '#ede0c4' },
      tocButtonExpanded: { ...ReactReaderStyle.tocButtonExpanded, background: '#e0d0b0' },
      tocButtonBar: { ...ReactReaderStyle.tocButtonBar, background: '#5b4636' },
      tocButton: { ...ReactReaderStyle.tocButton, color: '#5b4636' },
    },
  },
  dark: {
    background: '#000000',
    color: '#ffffff',
    readerStyle: {
      ...ReactReaderStyle,
      arrow: { ...ReactReaderStyle.arrow, color: 'white' },
      arrowHover: { ...ReactReaderStyle.arrowHover, color: '#ccc' },
      readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: '#000', transition: undefined },
      titleArea: { ...ReactReaderStyle.titleArea, color: '#ccc' },
      tocArea: { ...ReactReaderStyle.tocArea, background: '#111' },
      tocButtonExpanded: { ...ReactReaderStyle.tocButtonExpanded, background: '#222' },
      tocButtonBar: { ...ReactReaderStyle.tocButtonBar, background: '#fff' },
      tocButton: { ...ReactReaderStyle.tocButton, color: 'white' },
    },
  },
};
