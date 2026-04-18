import { useEffect } from 'react';
import { applyPreferenceSettingsToDocument, loadPreferenceSettings } from '../lib/userSettings';

export function UserPreferenceEffects() {
  useEffect(() => {
    const sync = () => {
      applyPreferenceSettingsToDocument(loadPreferenceSettings());
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('moviemonk:preferences-updated', sync as EventListener);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('moviemonk:preferences-updated', sync as EventListener);
    };
  }, []);

  return null;
}

export default UserPreferenceEffects;
