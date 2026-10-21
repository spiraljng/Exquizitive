import { NormalizeText } from './Bridge.js';

const DIALOG_SELECTORS = ['#feed_outer_dialog', '[id^="alert_dialog_outer_"]', '[id^="general_dialog_outer_"]'];
const POLL_MS = 250;
const SETTLE_MS = 200;

const BUTTON_PREFERENCE = ['Next Question', 'Continue', 'OK', 'Try Again', 'Close Feedback', 'Close'];

const Handled = new Set();

const ClickElement = (Element) => {
  Element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const IsVisible = (Element) => {
  if (!Element) return false;
  const Style = getComputedStyle(Element);
  if (Style.display === 'none' || Style.visibility === 'hidden') return false;
  const Rect = Element.getBoundingClientRect();
  return Rect.width > 0 && Rect.height > 0;
};

const VisibleDialogs = () =>
  DIALOG_SELECTORS.flatMap((Selector) => Array.from(document.querySelectorAll(Selector))).filter(IsVisible);

const DialogShell = (Dialog) => {
  if (Dialog.classList.contains('ui-dialog')) return Dialog;
  return Dialog.closest('.ui-dialog') ?? Dialog;
};

const ButtonPool = (Dialog) => {
  const Shell = DialogShell(Dialog);
  const Pane = Array.from(Shell.querySelectorAll('.ui-dialog-buttonpane button')).filter(IsVisible);
  if (Pane.length > 0) return Pane;
  return Array.from(Shell.querySelectorAll('button')).filter(IsVisible);
};

const PickButton = (Dialog) => {
  const Pool = ButtonPool(Dialog);
  for (const Label of BUTTON_PREFERENCE) {
    const Match = Pool.find((Button) => NormalizeText(Button.textContent) === Label);
    if (Match) return { Button: Match, Label };
  }
  if (Pool.length === 1) return { Button: Pool[0], Label: NormalizeText(Pool[0].textContent) };
  return null;
};

const OVERLAY_SELECTOR = '.ui-widget-overlay';
const STALE_OVERLAY_MS = 800;

let StaleSince = 0;

const HasVisibleDialog = () => Array.from(document.querySelectorAll('.ui-dialog')).some(IsVisible);

const LayerVisible = () => {
  const Layer = document.querySelector('.layer_holder');
  return Boolean(Layer) && getComputedStyle(Layer).display !== 'none';
};

const ClearStaleInert = () => {
  if (!LayerVisible() || HasVisibleDialog()) return;
  const Holder = document.getElementById('outer_holder');
  if (Holder?.hasAttribute('inert')) Holder.removeAttribute('inert');
};

const CleanStaleOverlay = () => {
  const Overlays = Array.from(document.querySelectorAll(OVERLAY_SELECTOR)).filter(IsVisible);
  if (Overlays.length === 0 || HasVisibleDialog()) {
    StaleSince = 0;
    return;
  }
  if (StaleSince === 0) {
    StaleSince = Date.now();
    return;
  }
  if (Date.now() - StaleSince < STALE_OVERLAY_MS) return;
  Overlays.forEach((Overlay) => Overlay.remove());
  StaleSince = 0;
};

export const StartAutoSkip = (IsEnabled, OnSkip) => {
  const Sweep = () => {
    const Visible = VisibleDialogs();
    for (const Dialog of [...Handled]) {
      if (!IsVisible(Dialog)) Handled.delete(Dialog);
    }
    CleanStaleOverlay();
    ClearStaleInert();
    if (!IsEnabled()) return;
    for (const Dialog of Visible) {
      if (Handled.has(Dialog)) continue;
      const Target = PickButton(Dialog);
      if (!Target) continue;
      Handled.add(Dialog);
      setTimeout(() => {
        if (!IsVisible(Dialog)) return;
        ClickElement(Target.Button);
        OnSkip?.(Target.Label);
      }, SETTLE_MS);
    }
  };

  const Timer = setInterval(Sweep, POLL_MS);
  return () => clearInterval(Timer);
};
