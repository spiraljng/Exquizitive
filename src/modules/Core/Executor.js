import { NormalizeText } from './Bridge.js';

const HIGHLIGHT_CLASS = 'exquizitive-correct';

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

export const HighlightPlan = (Plan, Question) => {
  ClearHighlight();
  const Type = Plan.Type;

  if (Type === 'multichoice') {
    const CorrectIndex = String(Question.correct_answer ?? '');
    document.querySelectorAll('.mc_choice').forEach((Element) => {
      if (Element.getAttribute('choice') === CorrectIndex) Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  if (Type === 'truefalse') {
    const Correct = String(Question.correct_answer ?? '').toLowerCase();
    document.querySelectorAll('.tf_choice').forEach((Element) => {
      if (Element.getAttribute('choice') === Correct) Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  if (Type === 'multiselect') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
    document.querySelectorAll('.mc_choice').forEach((Element) => {
      const Index = Number(Element.getAttribute('choice'));
      if (Key[Index] === true || Key[Index] === 'true') Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  if (Type === 'dragblanks') {
    document.querySelectorAll('.dragblank_label').forEach((Element) => {
      const LabelIndex = Number(Element.getAttribute('data-label-id') ?? Element.getAttribute('label-id'));
      const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer.map(String) : [];
      if (Key.includes(String(LabelIndex))) Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  if (Type === 'matching') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
    const Wanted = new Set(Key.flat().map(String));
    document.querySelectorAll('.matching_label').forEach((Element) => {
      if (Wanted.has(String(Element.getAttribute('data-label-id')))) Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  if (Type === 'ordering') {
    const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
    const Next = NormalizeText(Key[0] ?? '');
    document.querySelectorAll('.ordering_unit:not(.ordering_answer_spacer)').forEach((Element) => {
      if (NormalizeText(Element.textContent) === Next) Element.classList.add(HIGHLIGHT_CLASS);
    });
  }

  return document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).length;
};

export const ClearHighlight = () => {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((Element) => Element.classList.remove(HIGHLIGHT_CLASS));
};
