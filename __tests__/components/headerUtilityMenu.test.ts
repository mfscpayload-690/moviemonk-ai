import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../components/icons', () => ({
  BellIcon: () => React.createElement('span', null, 'bell'),
  FolderIcon: () => React.createElement('span', null, 'folder'),
  MoreIcon: () => React.createElement('span', null, 'more'),
  SettingsIcon: () => React.createElement('span', null, 'settings'),
  ShareIcon: () => React.createElement('span', null, 'share'),
  XMarkIcon: () => React.createElement('span', null, 'close')
}));

import { MemoryRouter } from 'react-router-dom';
import HeaderUtilityMenu, {
  buildHeaderUtilityMenuItems,
  runUtilityMenuAction
} from '../../components/HeaderUtilityMenu';

describe('HeaderUtilityMenu', () => {
  it('builds signed-in utility items in the expected order', () => {
    const items = buildHeaderUtilityMenuItems({
      user: { id: 'user-1' } as any,
      isCloud: true,
      isSyncing: false,
      canShare: true
    });

    expect(items.map((item) => item.label)).toEqual([
      'Cloud Lists',
      'Notifications',
      'Settings',
      'Share'
    ]);
    expect(items.find((item) => item.label === 'Share')?.disabled).toBe(false);
  });

  it('builds signed-out utility items without notifications or settings', () => {
    const items = buildHeaderUtilityMenuItems({
      user: null,
      isCloud: false,
      isSyncing: false,
      canShare: false
    });

    expect(items.map((item) => item.label)).toEqual(['Cloud Lists', 'Share']);
    expect(items[0].description).toContain('Saved on this device');
    expect(items[1].disabled).toBe(true);
  });

  it('renders signed-in menu content and disabled share state when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(HeaderUtilityMenu, {
          user: { id: 'user-1' } as any,
          isCloud: true,
          isSyncing: true,
          canShare: false,
          onOpenWatchlists: () => undefined,
          onOpenNotifications: () => undefined,
          onOpenSettings: () => undefined,
          onShare: () => undefined,
          defaultOpen: true
        })
      )
    );

    expect(html).toContain('Cloud Lists');
    expect(html).toContain('Notifications');
    expect(html).toContain('Settings');
    expect(html).toContain('Open a result to share it');
    expect(html).toContain('disabled=""');
  });

  it('closes before running the selected action', () => {
    const events: string[] = [];

    runUtilityMenuAction(
      () => events.push('close'),
      () => events.push('action')
    );

    expect(events).toEqual(['close', 'action']);
  });
});
