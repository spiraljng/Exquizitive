import { GetFaq } from './modules/Core/Bridge.js';
import { MountPanel } from './modules/Ui/Panel.js';

const BOOT_INTERVAL = 400;
const BOOT_TIMEOUT = 120000;

const Boot = () => {
  if (document.getElementById('exquizitive-panel')) return true;
  if (!GetFaq()) return false;
  MountPanel();
  return true;
};

const Start = () => {
  window.__exquizitive?.destroy?.();
  if (Boot()) return;
  const Started = Date.now();
  const Timer = setInterval(() => {
    if (Boot() || Date.now() - Started > BOOT_TIMEOUT) clearInterval(Timer);
  }, BOOT_INTERVAL);
};

Start();
