import { IsTruthy, NormalizeText } from './Bridge.js';

const HIGHLIGHT_CLASS = 'exquizitive-correct';
const MARKED_CLASS = 'exquizitive-marked';
const SHELL_CLASS = 'exquizitive-shell';
const CATEGORY_CLASS = (Index) => `exquizitive-cat-${Index}`;
const SHELL_SELECTORS = ['.matching_labels', '.dragdrop_labels', '.dragblank_labels'];

const Sleep = (Milliseconds) => new Promise((Resolve) => setTimeout(Resolve, Milliseconds));

const FireChange = (Element) => {
  Element.dispatchEvent(new Event('input', { bubbles: true }));
  Element.dispatchEvent(new Event('change', { bubbles: true }));
};

const ClickElement = (Element) => {
  Element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  Element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const FindByText = (Selector, Text) => {
  const Candidates = Array.from(document.querySelectorAll(Selector));
  const Exact = Candidates.find((Element) => NormalizeText(Element.textContent) === Text);
  if (Exact) return Exact;
  return Candidates.find((Element) => NormalizeText(Element.textContent).includes(Text));
};

const PerformAction = (Action) => {
  if (Action.Kind === 'click') {
    const Element = document.querySelector(Action.Selector);
    if (!Element) return { Ok: false, Reason: 'selector-miss', Action };
    ClickElement(Element);
    return { Ok: true, Action };
  }

  if (Action.Kind === 'clickText') {
    const Element = FindByText(Action.Selector, Action.Text);
    if (!Element) return { Ok: false, Reason: 'text-miss', Action };
    ClickElement(Element);
    return { Ok: true, Action };
  }

  if (Action.Kind === 'select') {
    const Element = document.querySelector(Action.Selector);
    if (!Element) return { Ok: false, Reason: 'selector-miss', Action };
    const HasOption = Array.from(Element.options ?? []).some((Option) => Option.value === Action.Value);
    if (!HasOption) return { Ok: false, Reason: 'option-miss', Action };
    Element.value = Action.Value;
    FireChange(Element);
    return { Ok: true, Action };
  }

  return { Ok: false, Reason: 'unknown-action', Action };
};

export const ExecutePlan = async (Plan) => {
  const Results = [];
  for (const Action of Plan.Actions) {
    Results.push(PerformAction(Action));
    await Sleep(Action.Delay ?? 180);
  }
  const Failed = Results.filter((Result) => !Result.Ok);
  return { Total: Results.length, Failed: Failed.length, Results };
};

const Mark = (Element, CategoryIndex) => {
  Element.classList.add(MARKED_CLASS);
  if (CategoryIndex >= 0) Element.classList.add(CATEGORY_CLASS(CategoryIndex));
  else Element.classList.add(HIGHLIGHT_CLASS);
};

const HighlightCategories = (Plan) => {
  for (const Area of Plan.AreaTargets) {
    const Element = document.querySelector(Area.Selector);
    if (Element) Mark(Element, Area.CategoryIndex);
  }
  for (const Member of Plan.MemberTargets) {
    if (Member.CategoryIndex < 0) continue;
    const Element = document.querySelector(Member.Selector);
    if (Element) Mark(Element, Member.CategoryIndex);
  }
  return document.querySelectorAll(`.${MARKED_CLASS}`).length;
};

const HighlightSingle = (Plan, Question) => {
  const Type = Plan.Type;

  if (Type === 'multichoice') {
    const CorrectIndex = String(Question.correct_answer ?? '');
    document.querySelectorAll('.mc_choice').forEach((Element) => {
      if (Element.getAttribute('choice') === CorrectIndex) Mark(Element, -1);
    });
  }

  if (Type === 'truefalse') {
    const Correct = String(Question.correct_answer ?? '').toLowerCase();
    document.querySelectorAll('.tf_choice').forEach((Element) => {
      if (Element.getAttribute('choice') === Correct) Mark(Element, -1);
    });
  }

  if (Type === 'dragblanks') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer.map(String) : [];
    document.querySelectorAll('.dragblank_label').forEach((Element) => {
      const LabelIndex = Number(Element.getAttribute('data-label-id') ?? Element.getAttribute('label-id'));
      if (Key.includes(String(LabelIndex))) Mark(Element, -1);
    });
  }

  if (Type === 'imageclick') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
    document.querySelectorAll('.imageclick_aria_button').forEach((Element) => {
      const Index = Number(Element.getAttribute('data-choice-id'));
      if (IsTruthy(Key[Index])) Mark(Element, -1);
    });
  }

  if (Type === 'ordering') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
    const Next = NormalizeText(Key[0] ?? '');
    document.querySelectorAll('.ordering_unit:not(.ordering_answer_spacer)').forEach((Element) => {
      if (NormalizeText(Element.textContent) === Next) Mark(Element, -1);
    });
  }

  return document.querySelectorAll(`.${MARKED_CLASS}`).length;
};

export const HighlightPlan = (Plan, Question) => {
  ClearHighlight();
  for (const Selector of SHELL_SELECTORS) {
    document.querySelectorAll(Selector).forEach((Element) => Element.classList.add(SHELL_CLASS));
  }
  if ((Plan.MemberTargets ?? []).length > 0) return HighlightCategories(Plan);
  return HighlightSingle(Plan, Question);
};

export const ClearHighlight = () => {
  document.querySelectorAll(`.${MARKED_CLASS}`).forEach((Element) => {
    Element.classList.remove(MARKED_CLASS);
    for (let Index = 0; Index < 8; Index += 1) Element.classList.remove(CATEGORY_CLASS(Index));
  });
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((Element) => Element.classList.remove(HIGHLIGHT_CLASS));
  document.querySelectorAll(`.${SHELL_CLASS}`).forEach((Element) => Element.classList.remove(SHELL_CLASS));
};
