export const GetFaq = () => window.FAQ ?? null;

export const GetCurrentQuestion = () => GetFaq()?.current_question ?? null;

export const GetQuestionBank = () => GetFaq()?.questions ?? [];

export const GetQuestionKey = (Question) =>
  Question ? `${Question.qid ?? Question.question_id ?? '?'}:${Question.sequence_key ?? '?'}` : null;

export const DecodeText = (Value) => {
  const Holder = document.createElement('textarea');
  Holder.innerHTML = String(Value ?? '');
  return Holder.value;
};

export const StripHtml = (Value) => {
  const Holder = document.createElement('div');
  Holder.innerHTML = String(Value ?? '');
  Holder.querySelectorAll('img[alt]').forEach((Image) => {
    Image.replaceWith(document.createTextNode(`[${Image.getAttribute('alt')}]`));
  });
  return (Holder.textContent ?? '').replace(/\s+/g, ' ').trim();
};

export const NormalizeText = (Value) =>
  DecodeText(StripHtml(Value)).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').trim();

export const ChoiceList = (Choices) => {
  if (Array.isArray(Choices)) return Choices;
  if (Choices && typeof Choices === 'object') return Object.entries(Choices).map(([Key, Value]) => ({ Key, ...(Value ?? {}) }));
  return [];
};

export const ChoiceText = (Choice, Index) => {
  if (Choice == null) return `Choice ${Index}`;
  if (typeof Choice === 'string') return StripHtml(Choice);
  const Raw = Choice.text ?? Choice.label ?? Choice.key ?? Choice.Key ?? Choice.Value ?? '';
  const Clean = StripHtml(Raw);
  return Clean || `Choice ${Index}`;
};

export const IsTruthy = (Value) => Value === true || Value === 'true' || Value === 1 || Value === '1';
