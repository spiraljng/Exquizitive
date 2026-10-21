export const PANEL_ID = 'exquizitive-panel';

export const Styles = `
.mc_choice.exquizitive-correct,
.tf_choice.exquizitive-correct,
.matching_label.exquizitive-correct,
.ordering_unit.exquizitive-correct,
.dragblank_label.exquizitive-correct,
.dragblank_target.exquizitive-correct {
  outline: 3px solid #186263 !important;
  outline-offset: 1px !important;
  background: rgba(24, 98, 99, 0.1) !important;
}

#${PANEL_ID} {
  box-sizing: border-box;
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

#${PANEL_ID} .eqx-body { padding: 0 10px; }

#${PANEL_ID} .eqx-meta {
  margin: 0 0 10px;
  font-size: 0.6em;
  font-weight: 300;
}

#${PANEL_ID} .eqx-list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  max-height: 11em;
  overflow: auto;
  text-align: left;
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

#${PANEL_ID} .eqx-note {
  margin: 0 0 10px;
  font-size: 0.6em;
  font-weight: 300;
}

#${PANEL_ID} .eqx-btn {
  display: block;
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
  margin: 2px 0 0;
  min-height: 1.2em;
  font-size: 0.55em;
  font-weight: 300;
  line-height: 1.3;
}

#${PANEL_ID} .eqx-status.eqx-error { color: #c93f3c; }
`;
