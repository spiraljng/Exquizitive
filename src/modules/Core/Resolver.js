import { ChoiceList, ChoiceText, IsTruthy, NormalizeText, StripHtml } from './Bridge.js';

const TargetForFlag = (Flag) => (IsTruthy(Flag) ? 'ms_correct_answers' : 'ms_incorrect_answers');

const KeySlots = (Key) => {
  if (Array.isArray(Key)) return Key;
  if (typeof Key === 'string' && Key.includes(',')) return Key.split(',').map((Part) => Part.trim());
  return [Key].filter((Value) => Value != null);
};

const TargetsByLabel = (Key) => {
  const Result = new Map();
  Key.forEach((Slots, LabelIndex) => {
    const TargetIndices = KeySlots(Slots)
      .map(Number)
      .filter((Value) => Number.isFinite(Value));
    if (TargetIndices.length > 0) Result.set(LabelIndex, TargetIndices);
  });
  return Result;
};

const BasePlan = (Question) => ({
  Type: Question.type ?? 'unknown',
  TypeDescription: Question.type_description ?? Question.type ?? '',
  Supported: false,
  Reference: Question.reference_number ?? '',
  Prompt: StripHtml(Question.question_text ?? ''),
  Answers: [],
  Categories: [],
  AreaTargets: [],
  MemberTargets: [],
  Actions: [],
  Note: '',
});

const ResolveMultiChoice = (Plan, Question) => {
  const Choices = ChoiceList(Question.choices);
  const CorrectIndex = String(Question.correct_answer ?? '');
  Plan.Answers = Choices.map((Choice, Index) => ({ Text: ChoiceText(Choice, Index), Correct: String(Index) === CorrectIndex, CategoryIndex: -1 }));
  Plan.Actions = [{ Kind: 'click', Selector: `.mc_choice[choice="${CorrectIndex}"]` }];
  Plan.Supported = Choices.length > 0;
  return Plan;
};

const ResolveTrueFalse = (Plan, Question) => {
  const Correct = String(Question.correct_answer ?? '').toLowerCase();
  Plan.Answers = [
    { Text: 'True', Correct: Correct === 'true', CategoryIndex: -1 },
    { Text: 'False', Correct: Correct === 'false', CategoryIndex: -1 },
  ];
  Plan.Actions = [{ Kind: 'click', Selector: `.tf_choice[choice="${Correct}"]` }];
  Plan.Supported = Correct === 'true' || Correct === 'false';
  return Plan;
};

const ResolveMultiSelect = (Plan, Question) => {
  const Choices = ChoiceList(Question.choices);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];

  Plan.Categories = [
    { Label: Question.correct_answer_area_label ?? 'Correct' },
    { Label: Question.incorrect_answer_area_label ?? 'Incorrect' },
  ];
  Plan.AreaTargets = [
    { Selector: '.ms_correct_answers', CategoryIndex: 0 },
    { Selector: '.ms_incorrect_answers', CategoryIndex: 1 },
  ];
  Plan.Answers = Choices.map((Choice, Index) => ({
    Text: ChoiceText(Choice, Index),
    Correct: IsTruthy(Key[Index]),
    CategoryIndex: IsTruthy(Key[Index]) ? 0 : 1,
    Target: TargetForFlag(Key[Index]),
  }));
  Plan.MemberTargets = Choices.map((Choice, Index) => ({
    Selector: `.mc_choice[choice="${Index}"]`,
    CategoryIndex: IsTruthy(Key[Index]) ? 0 : 1,
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

  Plan.Categories = Key.map((LabelIndex, BlankIndex) => ({ Label: `Blank ${BlankIndex + 1}` }));

  const BlankForLabel = new Map();
  Key.forEach((LabelIndex, BlankIndex) => {
    const Numeric = Number(LabelIndex);
    if (Number.isFinite(Numeric) && !BlankForLabel.has(Numeric)) BlankForLabel.set(Numeric, BlankIndex);
  });

  Plan.Answers = Key.map((LabelIndex, BlankIndex) => ({
    Text: ChoiceText(Labels[Number(LabelIndex)], LabelIndex),
    Correct: true,
    CategoryIndex: BlankIndex,
  }));

  Plan.AreaTargets = Key.map((LabelIndex, BlankIndex) => ({
    Selector: `.dragblank_target[data-target-id="${BlankIndex}"]`,
    CategoryIndex: BlankIndex,
  }));

  Plan.MemberTargets = Labels.map((Label, LabelIndex) => ({
    Selector: `.dragblank_label[data-label-id="${LabelIndex}"]`,
    CategoryIndex: BlankForLabel.has(LabelIndex) ? BlankForLabel.get(LabelIndex) : -1,
  }));

  Plan.Actions = Key.map((LabelIndex, BlankIndex) => ({
    Kind: 'select',
    Selector: `select.sr_target_select[data-select-id="${BlankIndex}"]`,
    Value: String(LabelIndex),
    Delay: 220,
  }));

  Plan.Supported = Key.length > 0;
  return Plan;
};

const ResolveMatching = (Plan, Question) => {
  const Labels = ChoiceList(Question.labels);
  const Targets = ChoiceList(Question.targets);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];

  Plan.Categories = Targets.map((Target, Index) => ({ Label: ChoiceText(Target, Index) }));

  const Map = TargetsByLabel(Key);

  const Unused = Labels.map((Label, Index) => Index).filter((Index) => !Map.has(Index));
  let UnusedCategory = -1;
  if (Unused.length > 0) {
    Plan.Categories.push({ Label: 'Not used' });
    UnusedCategory = Plan.Categories.length - 1;
  }

  Plan.Answers = Labels.flatMap((Label, LabelIndex) => {
    const TargetIndices = Map.get(LabelIndex);
    if (!TargetIndices) return [{ Text: ChoiceText(Label, LabelIndex), Correct: false, CategoryIndex: UnusedCategory }];
    return TargetIndices.map((TargetIndex) => ({ Text: ChoiceText(Label, LabelIndex), Correct: true, CategoryIndex: TargetIndex }));
  });

  Plan.AreaTargets = Targets.map((Target, Index) => ({
    Selector: `.matching_target[data-target-id="${Index}"]`,
    CategoryIndex: Index,
  }));

  Plan.MemberTargets = Labels.map((Label, LabelIndex) => {
    const TargetIndices = Map.get(LabelIndex);
    return {
      Selector: `.matching_label[data-label-id="${LabelIndex}"]`,
      CategoryIndex: TargetIndices ? TargetIndices[0] : -1,
    };
  });

  Plan.Actions = [];
  Key.forEach((Slots, LabelIndex) => {
    KeySlots(Slots)
      .map(Number)
      .filter((Value) => Number.isFinite(Value))
      .forEach((TargetIndex) => {
        Plan.Actions.push({ Kind: 'select', Selector: `#sr_target_select_${TargetIndex}`, Value: String(LabelIndex), Delay: 220 });
      });
  });
  Plan.Supported = Plan.Actions.length > 0;
  return Plan;
};

const ResolveDragDrop = (Plan, Question) => {
  const Labels = ChoiceList(Question.labels);
  const Targets = ChoiceList(Question.targets);
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  const Map = TargetsByLabel(Key);

  Plan.Categories = Targets.map((Target, Index) => ({ Label: ChoiceText(Target, Index) }));

  const Unused = Labels.map((Label, Index) => Index).filter((Index) => !Map.has(Index));
  let UnusedCategory = -1;
  if (Unused.length > 0) {
    Plan.Categories.push({ Label: 'Not used' });
    UnusedCategory = Plan.Categories.length - 1;
  }

  Plan.Answers = Labels.flatMap((Label, LabelIndex) => {
    const TargetIndices = Map.get(LabelIndex);
    if (!TargetIndices) return [{ Text: ChoiceText(Label, LabelIndex), Correct: false, CategoryIndex: UnusedCategory }];
    return TargetIndices.map((TargetIndex) => ({ Text: ChoiceText(Label, LabelIndex), Correct: true, CategoryIndex: TargetIndex }));
  });

  Plan.MemberTargets = Labels.map((Label, LabelIndex) => ({
    Selector: `.dragdrop_label[data-label-id="${LabelIndex}"]`,
    CategoryIndex: Map.has(LabelIndex) ? Map.get(LabelIndex)[0] : -1,
  }));

  Plan.Actions = [];
  Key.forEach((Slots, LabelIndex) => {
    KeySlots(Slots)
      .map(Number)
      .filter((Value) => Number.isFinite(Value))
      .forEach((TargetIndex) => {
        Plan.Actions.push({ Kind: 'select', Selector: `#dr_target_select_${TargetIndex}`, Value: String(LabelIndex), Delay: 250 });
      });
  });
  Plan.Supported = Plan.Actions.length > 0;
  Plan.Note = 'Colours match the panel order';
  return Plan;
};

const ResolveOrdering = (Plan, Question) => {
  const Key = Array.isArray(Question.correct_answer) ? Question.correct_answer : [];
  Plan.Answers = Key.map((Text, Index) => ({ Text: `${Index + 1}. ${StripHtml(Text)}`, Correct: true, CategoryIndex: -1 }));
  Plan.Actions = Key.map((Text) => ({ Kind: 'clickText', Selector: '.ordering_unit:not(.ordering_answer_spacer)', Text: NormalizeText(Text), Delay: 200 }));
  Plan.Supported = Key.length > 0;
  return Plan;
};

const ResolveTextEntry = (Plan, Question) => {
  const Values = KeySlots(Question.correct_answer);
  Plan.Answers = Values.map((Value) => ({ Text: StripHtml(Value), Correct: true, CategoryIndex: -1 }));
  Plan.Note = 'Text entry — answer shown, not applied';
  return Plan;
};

const Resolvers = {
  multichoice: ResolveMultiChoice,
  truefalse: ResolveTrueFalse,
  multiselect: ResolveMultiSelect,
  dragdrop: ResolveDragDrop,
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
