import { GetCurrentQuestion, GetQuestionKey } from '../Core/Bridge.js';
import { StartAutoSkip } from '../Core/AutoSkip.js';
import { ClearHighlight, ExecutePlan, HighlightPlan } from '../Core/Executor.js';
import { ResolvePlan } from '../Core/Resolver.js';
import { CategoryColor, PANEL_ID, Styles } from './Styles.js';

const STORAGE_KEY = 'exquizitive-panel-v2';
const ANCHOR_ID = 'activity_scoreboard';
const ANCHOR_AFTER = 'grade_holder';
const REFRESH_MS = 700;

const State = {
  QuestionKey: null,
  Plan: null,
  Highlighted: false,
  Busy: false,
  Collapsed: false,
  AutoSkip: false,
};

let PanelRef = null;

const LoadState = () => {
  try {
    const Saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    State.Collapsed = Boolean(Saved.Collapsed);
    State.AutoSkip = Boolean(Saved.AutoSkip);
  } catch {
    State.Collapsed = false;
    State.AutoSkip = false;
  }
};

const SaveState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Collapsed: State.Collapsed, AutoSkip: State.AutoSkip }));
  } catch {
    return;
  }
};

const InjectStyles = () => {
  if (document.getElementById(`${PANEL_ID}-styles`)) return;
  const Style = document.createElement('style');
  Style.id = `${PANEL_ID}-styles`;
  Style.textContent = Styles;
  document.head.append(Style);
};

const BuildPanel = () => {
  const Panel = document.createElement('div');
  Panel.id = PANEL_ID;
  Panel.innerHTML = `
    <div class="eqx-head">
      <div class="eqx-title">Answer Key</div>
      <button class="eqx-toggle-btn" data-eqx="collapse" title="Collapse">▾</button>
    </div>
    <div class="eqx-body">
      <div class="eqx-meta" data-eqx="meta"></div>
      <ul class="eqx-list" data-eqx="list"></ul>
      <div class="eqx-note" data-eqx="note"></div>
      <button class="eqx-btn" data-eqx="answer">Answer</button>
      <button class="eqx-btn" data-eqx="highlight">Highlight</button>
      <button class="eqx-btn eqx-autoskip" data-eqx="autoskip">Auto-skip: Off</button>
      <div class="eqx-status" data-eqx="status"></div>
    </div>
  `;
  return Panel;
};

const El = (Name) => PanelRef?.querySelector(`[data-eqx="${Name}"]`) ?? null;

const SetStatus = (Message, IsError = false) => {
  const Target = El('status');
  if (!Target) return;
  Target.textContent = Message;
  Target.classList.toggle('eqx-error', IsError);
};

const LayerVisible = () => {
  const Layer = document.querySelector('.layer_holder');
  if (!Layer) return false;
  return getComputedStyle(Layer).display !== 'none';
};

const Place = (Panel) => {
  const Holder = document.getElementById('main_activity_holder');
  const HolderHidden = Holder && getComputedStyle(Holder).display === 'none';
  if (HolderHidden || LayerVisible()) {
    Panel.classList.add('eqx-hidden');
    return;
  }
  Panel.classList.remove('eqx-hidden');
  const Anchor = document.getElementById(ANCHOR_ID);
  if (Anchor) {
    const After = document.getElementById(ANCHOR_AFTER);
    Panel.classList.remove('eqx-floating');
    if (After && After.parentElement === Anchor) {
      if (After.nextElementSibling !== Panel) After.after(Panel);
    } else if (Panel.parentElement !== Anchor) {
      Anchor.append(Panel);
    }
    return;
  }
  Panel.classList.add('eqx-floating');
  if (Panel.parentElement !== document.body) document.body.append(Panel);
};

const Fit = () => {
  const Panel = PanelRef;
  if (!Panel || !Panel.isConnected) return;
  if (Panel.classList.contains('eqx-floating')) {
    Panel.style.removeProperty('--eqx-available');
    return;
  }
  const Top = Panel.getBoundingClientRect().top;
  const Available = Math.max(190, Math.round(window.innerHeight - Top - 16));
  if (Panel.dataset.eqxAvailable === String(Available)) return;
  Panel.dataset.eqxAvailable = String(Available);
  Panel.style.setProperty('--eqx-available', `${Available}px`);
};

const SetAutoSkip = (Value, Silent = false) => {
  State.AutoSkip = Value;
  const Button = El('autoskip');
  if (Button) {
    Button.textContent = `Auto-skip: ${Value ? 'On' : 'Off'}`;
    Button.classList.toggle('eqx-on', Value);
  }
  SaveState();
  if (!Silent) SetStatus(Value ? 'Feedback will be skipped.' : 'Feedback will be shown.');
};

const BuildRow = (Answer, CategoryIndex) => {
  const Item = document.createElement('li');
  if (CategoryIndex >= 0) {
    Item.classList.add('eqx-cat-item');
    Item.style.setProperty('--eqx-cat', CategoryColor(CategoryIndex));
  }
  const Mark = document.createElement('span');
  Mark.className = 'eqx-mark';
  Mark.textContent = '√';
  const Text = document.createElement('span');
  Text.textContent = Answer.Text;
  Item.append(Mark, Text);
  return Item;
};

const BuildGroup = (Label, CategoryIndex) => {
  const Group = document.createElement('li');
  Group.className = 'eqx-group';
  Group.style.setProperty('--eqx-cat', CategoryColor(CategoryIndex));
  Group.textContent = Label;
  return Group;
};

const Render = () => {
  const Panel = PanelRef;
  const Plan = State.Plan;
  if (!Panel || !Plan) return;

  El('meta').textContent = [Plan.TypeDescription, Plan.Reference].filter(Boolean).join(', question ');
  El('note').textContent = Plan.Note ?? '';

  const List = El('list');
  List.innerHTML = '';

  if ((Plan.MemberTargets ?? []).length > 0) {
    Plan.Categories.forEach((Category, CategoryIndex) => {
      const Items = Plan.Answers.filter((Answer) => Answer.CategoryIndex === CategoryIndex);
      if (Items.length === 0) return;
      List.append(BuildGroup(Category.Label, CategoryIndex));
      Items.forEach((Answer) => List.append(BuildRow(Answer, CategoryIndex)));
    });
  } else {
    const Key = Plan.Answers.filter((Answer) => Answer.Correct);
    if (Key.length === 0) {
      const Empty = document.createElement('li');
      Empty.textContent = 'No answer key exposed for this question.';
      List.append(Empty);
    }
    Key.forEach((Answer) => List.append(BuildRow(Answer, -1)));
  }

  El('answer').disabled = !Plan.Supported;
  El('highlight').disabled = Plan.Answers.length === 0;
  El('collapse').textContent = State.Collapsed ? '▸' : '▾';
  Panel.classList.toggle('eqx-collapsed', State.Collapsed);
};

const RunAnswer = async () => {
  if (State.Busy || !State.Plan) return;
  State.Busy = true;
  El('answer').disabled = true;
  SetStatus('Applying…');
  try {
    const Result = await ExecutePlan(State.Plan);
    if (Result.Failed > 0) {
      const First = Result.Results.find((Item) => !Item.Ok);
      SetStatus(`Applied ${Result.Total - Result.Failed}/${Result.Total} — ${First?.Reason ?? 'failed'}`, true);
    } else {
      SetStatus(`Applied ${Result.Total} step${Result.Total === 1 ? '' : 's'}.`);
    }
  } catch (Error) {
    SetStatus(String(Error?.message ?? Error), true);
  } finally {
    State.Busy = false;
    El('answer').disabled = !State.Plan.Supported;
  }
};

const ToggleHighlight = () => {
  const Question = GetCurrentQuestion();
  if (!Question || !State.Plan) return;
  if (State.Highlighted) {
    ClearHighlight();
    State.Highlighted = false;
    SetStatus('Highlight cleared.');
    return;
  }
  const Count = HighlightPlan(State.Plan, Question);
  State.Highlighted = Count > 0;
  if (Count === 0) {
    SetStatus('Nothing to highlight on this type.');
    return;
  }
  const Groups = (State.Plan.Categories ?? []).length;
  SetStatus(Groups > 1 ? `Highlighted ${Groups} categories.` : `Highlighted ${Count} element${Count === 1 ? '' : 's'}.`);
};

const Refresh = () => {
  const Panel = PanelRef;
  if (!Panel) return;
  Place(Panel);
  Fit();
  const Question = GetCurrentQuestion();
  const Key = GetQuestionKey(Question);
  if (Key === State.QuestionKey) return;
  State.QuestionKey = Key;
  State.Highlighted = false;
  State.Plan = ResolvePlan(Question);
  Render();
  SetStatus(Question ? '' : 'Waiting for a question…');
};

export const MountPanel = () => {
  InjectStyles();
  LoadState();
  const Panel = BuildPanel();
  PanelRef = Panel;
  Place(Panel);

  const Controller = new AbortController();
  const { signal } = Controller;

  Panel.addEventListener('click', (Event) => {
    const Action = Event.target.closest('[data-eqx]')?.getAttribute('data-eqx');
    if (Action === 'answer') RunAnswer();
    if (Action === 'highlight') ToggleHighlight();
    if (Action === 'autoskip') SetAutoSkip(!State.AutoSkip);
    if (Action === 'collapse') {
      State.Collapsed = !State.Collapsed;
      Render();
      SaveState();
    }
  }, { signal });

  document.addEventListener('keydown', (Event) => {
    if (!Event.ctrlKey || !Event.shiftKey) return;
    const Key = Event.key.toLowerCase();
    if (Key === 'a') {
      Event.preventDefault();
      RunAnswer();
    }
    if (Key === 'h') {
      Event.preventDefault();
      ToggleHighlight();
    }
    if (Key === 's') {
      Event.preventDefault();
      SetAutoSkip(!State.AutoSkip);
    }
  }, { signal });

  const StopAutoSkip = StartAutoSkip(
    () => State.AutoSkip,
    (Label) => SetStatus(`Skipped feedback: ${Label}`),
  );

  const Timer = setInterval(Refresh, REFRESH_MS);
  window.addEventListener('resize', Fit, { signal });

  SetAutoSkip(State.AutoSkip, true);
  Refresh();

  window.__exquizitive = {
    destroy: () => {
      Controller.abort();
      clearInterval(Timer);
      StopAutoSkip();
      Panel.remove();
      document.getElementById(`${PANEL_ID}-styles`)?.remove();
      PanelRef = null;
      delete window.__exquizitive;
    },
  };

  return Panel;
};
