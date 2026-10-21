import { NormalizeText } from './Bridge.js';

const DIALOG_ID = 'feed_outer_dialog';
const POLL_MS = 250;
const SETTLE_MS = 220;

const BUTTON_PREFERENCE = ['Next Question', 'OK', 'Continue', 'Try Again', 'Close Feedback'];

let DialogWasVisible = false;

const ClickElement = (Element) => {
  Element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const IsVisible = (Element) => Boolean(Element) && Element.offsetParent !== null;

const PickButton = (Dialog) => {
  const Pane = Array.from(Dialog.querySelectorAll('.ui-dialog-buttonpane button')).filter(IsVisible);
  const Pool = Pane.length > 0 ? Pane : Array.from(Dialog.querySelectorAll('button')).filter(IsVisible);
  for (const Label of BUTTON_PREFERENCE) {
    const Match = Pool.find((Button) => NormalizeText(Button.textContent) === Label);
    if (Match) return { Button: Match, Label };
  }
  return Pool.length > 0 ? { Button: Pool[0], Label: NormalizeText(Pool[0].textContent) } : null;
};

export const StartAutoSkip = (IsEnabled, OnSkip) => {
  const Sweep = () => {
    const Dialog = document.getElementById(DIALOG_ID);
    if (!IsVisible(Dialog)) {
      DialogWasVisible = false;
      return;
    }
    if (!IsEnabled()) return;
    if (DialogWasVisible) return;
    const Target = PickButton(Dialog);
    if (!Target) return;
    DialogWasVisible = true;
    setTimeout(() => {
      if (!IsVisible(Dialog)) return;
      ClickElement(Target.Button);
      OnSkip?.(Target.Label);
    }, SETTLE_MS);
  };

  const Timer = setInterval(Sweep, POLL_MS);
  return () => clearInterval(Timer);
};
