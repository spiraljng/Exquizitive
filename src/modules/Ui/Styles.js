export const PANEL_ID = 'exquizitive-panel';

export const CategoryPalette = [
  { Line: '#0e7490', Alpha: 0.16 },
  { Line: '#b45309', Alpha: 0.18 },
  { Line: '#6d28d9', Alpha: 0.13 },
  { Line: '#be185d', Alpha: 0.13 },
  { Line: '#15803d', Alpha: 0.16 },
  { Line: '#1d4ed8', Alpha: 0.13 },
];

const Opaque = (Hex, Alpha) => {
  const Channel = (Offset) => Math.round(parseInt(Hex.slice(Offset, Offset + 2), 16) * Alpha + 255 * (1 - Alpha));
  return `rgb(${Channel(1)}, ${Channel(3)}, ${Channel(5)})`;
};

const Palette = CategoryPalette.map(({ Line, Alpha }) => ({ Line, Fill: Opaque(Line, Alpha) }));

export const CategoryColor = (Index) => Palette[Index % Palette.length].Line;

const CategoryRules = Palette.map(
  ({ Line, Fill }, Index) => `
.mc_choice.exquizitive-cat-${Index},
.matching_label.exquizitive-cat-${Index},
.dragdrop_label.exquizitive-cat-${Index},
.dragblank_label.exquizitive-cat-${Index} {
  outline: 3px solid ${Line} !important;
  outline-offset: 1px !important;
  background-color: ${Fill} !important;
}

.ms_correct_answers.exquizitive-cat-${Index},
.ms_incorrect_answers.exquizitive-cat-${Index},
.matching_target.exquizitive-cat-${Index},
.dragblank_target.exquizitive-cat-${Index} {
  border-color: ${Line} !important;
  background-color: ${Fill} !important;
}

.ms_correct_answers.exquizitive-cat-${Index} .ms_answer_holder_header,
.ms_incorrect_answers.exquizitive-cat-${Index} .ms_answer_holder_header,
.matching_target.exquizitive-cat-${Index} > div > label {
  color: ${Line} !important;
}
`,
).join('');

export const Styles = `
.mc_choice.exquizitive-correct,
.tf_choice.exquizitive-correct,
.matching_label.exquizitive-correct,
.dragdrop_label.exquizitive-correct,
.ordering_unit.exquizitive-correct,
.dragblank_label.exquizitive-correct,
.dragblank_target.exquizitive-correct {
  outline: 3px solid #186263 !important;
  outline-offset: 1px !important;
  background-color: #e7f1f1 !important;
}

.layer_holder_buttons {
  z-index: 300 !important;
}

.matching_labels.exquizitive-shell,
.dragdrop_labels.exquizitive-shell,
.dragblank_labels.exquizitive-shell {
  background-color: transparent !important;
}
${CategoryRules}
#${PANEL_ID} {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: var(--eqx-available, none);
  background: #fff;
  border: 3px solid #772277;
  border-radius: 8px;
  margin: 0 0 14px;
  padding: 0 0 10px;
  font-family: "Source Sans Pro", sans-serif;
  font-weight: 300;
  color: #000;
  text-align: center;
}

#scoreboard {
  max-height: calc(100vh - 66px) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
}

#${PANEL_ID}.eqx-floating {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483000;
  width: 15em;
  margin: 0;
}

#${PANEL_ID} .eqx-head {
  position: relative;
  flex: 0 0 auto;
  padding: 9px 22px 0;
}

#${PANEL_ID} .eqx-title {
  margin: 5px 0;
  color: #772277;
  font-size: 0.65em;
  font-weight: 700;
}

#${PANEL_ID} .eqx-toggle-btn {
  position: absolute;
  top: 5px;
  right: 4px;
  padding: 0 3px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: #772277;
  font-family: inherit;
  font-size: 0.6em;
  line-height: 1.4;
  opacity: 0.55;
  cursor: pointer;
}

#${PANEL_ID} .eqx-toggle-btn:hover { opacity: 1; background: rgba(119, 34, 119, 0.1); }

#${PANEL_ID}.eqx-collapsed { padding-bottom: 8px; }
#${PANEL_ID}.eqx-collapsed .eqx-body { display: none; }
#${PANEL_ID}.eqx-hidden { display: none !important; }

#${PANEL_ID} .eqx-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 10px;
}

#${PANEL_ID} .eqx-meta {
  flex: 0 0 auto;
  margin: 0 0 10px;
  font-size: 0.6em;
  font-weight: 300;
}

#${PANEL_ID} .eqx-list {
  flex: 1 1 auto;
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  min-height: 2.5em;
  max-height: 13em;
  overflow-y: auto;
  overscroll-behavior: contain;
  text-align: left;
  scrollbar-width: thin;
}

#${PANEL_ID} .eqx-list li {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  padding: 1px 0;
  font-size: 0.6em;
  font-weight: 400;
  line-height: 1.25;
}

#${PANEL_ID} .eqx-mark {
  flex: 0 0 auto;
  min-width: 0.9em;
  padding: 0 0.25em;
  border: 2px solid #409140;
  border-radius: 50px;
  background: #66ff66;
  color: #409140;
  font-family: "PT Mono", monospace;
  font-size: 0.9em;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
}

#${PANEL_ID} .eqx-group {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 7px 0 3px;
  color: var(--eqx-cat);
  font-size: 0.6em;
  font-weight: 700;
}

#${PANEL_ID} .eqx-group:first-child { margin-top: 0; }

#${PANEL_ID} .eqx-group::before {
  content: '';
  flex: 0 0 auto;
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  background: var(--eqx-cat);
}

#${PANEL_ID} .eqx-list li.eqx-cat-item {
  margin-left: 0.2em;
  padding-left: 5px;
  border-left: 2px solid var(--eqx-cat);
}

#${PANEL_ID} .eqx-list li.eqx-cat-item .eqx-mark {
  border-color: var(--eqx-cat);
  background: var(--eqx-cat);
  color: #fff;
}

#${PANEL_ID} .eqx-note {
  flex: 0 0 auto;
  margin: 0 0 10px;
  font-size: 0.6em;
  font-weight: 300;
}

#${PANEL_ID} .eqx-btn {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  margin: 0 0 6px;
  padding: 0.32em 0.5em;
  font-family: inherit;
  font-size: 0.6em;
  font-weight: 400;
  color: #fff;
  background: #186263;
  border: 1px solid #186263;
  border-radius: 3px;
  cursor: pointer;
}

#${PANEL_ID} .eqx-btn:hover { background: #14504f; border-color: #14504f; }
#${PANEL_ID} .eqx-btn:disabled { opacity: 0.45; cursor: default; }

#${PANEL_ID} .eqx-autoskip {
  background: #fff;
  color: #186263;
}

#${PANEL_ID} .eqx-autoskip:hover { background: #eef5f5; border-color: #186263; }

#${PANEL_ID} .eqx-autoskip.eqx-on {
  background: #186263;
  color: #fff;
}

#${PANEL_ID} .eqx-autoskip.eqx-on:hover { background: #14504f; }

#${PANEL_ID} .eqx-status {
  flex: 0 0 auto;
  margin: 2px 0 0;
  min-height: 1.2em;
  font-size: 0.55em;
  font-weight: 300;
  line-height: 1.3;
}

#${PANEL_ID} .eqx-status.eqx-error { color: #c93f3c; }
`;
