import { ChoiceList, ChoiceText, IsTruthy, NormalizeText, StripHtml } from './Bridge.js';

const TargetForFlag = (Flag) => (IsTruthy(Flag) ? 'ms_correct_answers' : 'ms_incorrect_answers');

const BasePlan = (Question) => ({
  Type: Question.type ?? 'unknown',
  TypeDescription: Question.type_description ?? Question.type ?? '',
  Supported: false,
  Reference: Question.reference_number ?? '',
  Prompt: StripHtml(Question.question_text ?? ''),
  Answers: [],
  Actions: [],
  Note: '',
});

const ResolveMultiChoice = (Plan, Question) => {
  const Choices = ChoiceList(Question.choices);
  const CorrectIndex = String(Question.correct_answer ?? '');
  Plan.Answers = Choices.map((Choice, Index) => ({ Text: ChoiceText(Choice, Index), Correct: String(Index) === CorrectIndex }));
  Plan.Actions = [{ Kind: 'click', Selector: `.mc_choice[choice="${CorrectIndex}"]` }];
  Plan.Supported = Choices.length > 0;
  return Plan;
};

const ResolveTrueFalse = (Plan, Question) => {
  const Correct = String(Question.correct_answer ?? '').toLowerCase();
  Plan.Answers = [
    { Text: 'True', Correct: Correct === 'true' },
    { Text: 'False', Correct: Correct === 'false' },
  ];
  Plan.Actions = [{ Kind: 'click', Selector: `.tf_choice[choice="${Correct}"]` }];
  Plan.Supported = Correct === 'true' || Correct === 'false';
  return Plan;
};

const ResolveMultiSelect = (Plan, Question) => {
  const Choices = ChoiceList(Question.choices);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  Plan.Answers = Choices.map((Choice, Index) => ({
    Text: ChoiceText(Choice, Index),
    Correct: IsTruthy(Key[Index]),
    Target: TargetForFlag(Key[Index]),
  }));
  Plan.Actions = Choices.map((Choice, Index) => ({
    Kind: 'select',
    Selector: `#sr_choice_${Index}`,
    Value: TargetForFlag(Key[Index]),
    Delay: 220,
  }));
  Plan.Supported = Choices.length > 0 && Key.length > 0;
  return Plan;
};

const ResolveDragBlanks = (Plan, Question) => {
  const Labels = ChoiceList(Question.labels);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  Plan.Answers = Key.map((LabelIndex, BlankIndex) => {
    const Label = Labels[Number(LabelIndex)];
    return { Text: `${BlankIndex + 1}. ${ChoiceText(Label, LabelIndex)}`, Correct: true };
  });
  Plan.Actions = Key.map((LabelIndex, BlankIndex) => ({
    Kind: 'select',
    Selector: `select.sr_target_select[data-select-id="${BlankIndex}"]`,
    Value: String(LabelIndex),
    Delay: 220,
  }));
  Plan.Supported = Key.length > 0;
  Plan.Note = 'Fill blanks in order';
  return Plan;
};

const ResolveMatching = (Plan, Question) => {
  const Labels = ChoiceList(Question.labels);
  const Targets = ChoiceList(Question.targets);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  Plan.Answers = Targets.map((Target, TargetIndex) => {
    const Matches = Array.isArray(Key[TargetIndex]) ? Key[TargetIndex] : [Key[TargetIndex]].filter((Value) => Value != null);
    return { Text: `${ChoiceText(Target, TargetIndex)} → ${Matches.map((Index) => ChoiceText(Labels[Number(Index)], Index)).join(', ')}`, Correct: true };
  });
  Plan.Actions = [];
  Targets.forEach((Target, TargetIndex) => {
    const Matches = Array.isArray(Key[TargetIndex]) ? Key[TargetIndex] : [Key[TargetIndex]].filter((Value) => Value != null);
    Matches.forEach((LabelIndex) => {
      Plan.Actions.push({ Kind: 'select', Selector: `#sr_target_select_${TargetIndex}`, Value: String(LabelIndex), Delay: 220 });
    });
  });
  Plan.Supported = Plan.Actions.length > 0;
  return Plan;
};

const ResolveOrdering = (Plan, Question) => {
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  Plan.Answers = Key.map((Text, Index) => ({ Text: `${Index + 1}. ${StripHtml(Text)}`, Correct: true }));
  Plan.Actions = Key.map((Text) => ({ Kind: 'clickText', Selector: '.ordering_unit:not(.ordering_answer_spacer)', Text: NormalizeText(Text), Delay: 200 }));
  Plan.Supported = Key.length > 0;
  return Plan;
};

const ResolveTextEntry = (Plan, Question) => {
  const Key = Question.correct_answer;
  const Values = Array.isArray(Key) ? Key : [Key].filter((Value) => Value != null);
  Plan.Answers = Values.map((Value) => ({ Text: StripHtml(Value), Correct: true }));
  Plan.Note = 'Text entry — answer shown, not applied';
  return Plan;
};

const Resolvers = {
  multichoice: ResolveMultiChoice,
  truefalse: ResolveTrueFalse,
  multiselect: ResolveMultiSelect,
  dragblanks: ResolveDragBlanks,
  matching: ResolveMatching,
  ordering: ResolveOrdering,
  shortanswer: ResolveTextEntry,
  numeric: ResolveTextEntry,
  freeresponse: ResolveTextEntry,
  gradedessay: ResolveTextEntry,
};

export const ResolvePlan = (Question) => {
  const Plan = BasePlan(Question);
  if (!Question) return Plan;
  const Resolver = Resolvers[Plan.Type];
  if (!Resolver) {
    Plan.Note = `Unmapped type: ${Plan.Type}`;
    return Plan;
  }
  return Resolver(Plan, Question);
};
