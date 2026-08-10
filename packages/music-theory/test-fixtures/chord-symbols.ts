import type { Accidental, ChordKind, ChordParseErrorReason, NoteLetter } from '../src/index.js';

export interface SpelledPitchFixture {
  readonly letter: NoteLetter;
  readonly accidental: Accidental;
}

export interface ChordSymbolGolden {
  readonly name: string;
  readonly rationale: string;
  readonly symbol: string;
  readonly root: SpelledPitchFixture;
  readonly kind: ChordKind;
  readonly bass: SpelledPitchFixture | null;
}

export interface EnharmonicChordPairGolden {
  readonly left: string;
  readonly right: string;
  readonly rationale: string;
}

export interface ChordTranspositionGolden {
  readonly source: string;
  readonly interval: Readonly<{ diatonicSteps: number; semitones: number }>;
  readonly expected: string;
  readonly rationale: string;
}

export interface ProgressionTranspositionGolden {
  readonly name: string;
  readonly source: readonly string[];
  readonly interval: Readonly<{ diatonicSteps: number; semitones: number }>;
  readonly expected: readonly string[];
  readonly rationale: string;
}

export interface InvalidChordSymbolGolden {
  readonly input: string;
  readonly reason: ChordParseErrorReason;
}

export const CHORD_KIND_SYMBOL_GOLDENS: readonly ChordSymbolGolden[] = Object.freeze([
  {
    name: 'major',
    rationale: 'An omitted suffix is the sole canonical spelling for a major triad.',
    symbol: 'C',
    root: { letter: 'C', accidental: 0 },
    kind: 'major',
    bass: null,
  },
  {
    name: 'minor',
    rationale: 'The lowercase m suffix denotes a minor triad without changing root spelling.',
    symbol: 'Dm',
    root: { letter: 'D', accidental: 0 },
    kind: 'minor',
    bass: null,
  },
  {
    name: 'diminished',
    rationale: 'The ASCII dim suffix distinguishes a diminished triad from Unicode aliases.',
    symbol: 'Edim',
    root: { letter: 'E', accidental: 0 },
    kind: 'diminished',
    bass: null,
  },
  {
    name: 'augmented',
    rationale: 'The ASCII aug suffix is canonical and does not accept the plus-sign alias.',
    symbol: 'Faug',
    root: { letter: 'F', accidental: 0 },
    kind: 'augmented',
    bass: null,
  },
  {
    name: 'suspended second',
    rationale: 'The full sus2 suffix preserves which chord member replaces the third.',
    symbol: 'Gsus2',
    root: { letter: 'G', accidental: 0 },
    kind: 'sus2',
    bass: null,
  },
  {
    name: 'suspended fourth',
    rationale: 'The full sus4 suffix is distinct from sus2 and from an unspecified sus alias.',
    symbol: 'Asus4',
    root: { letter: 'A', accidental: 0 },
    kind: 'sus4',
    bass: null,
  },
  {
    name: 'major seventh',
    rationale: 'The maj7 suffix denotes a major seventh and must not collapse to dominant7.',
    symbol: 'Bmaj7',
    root: { letter: 'B', accidental: 0 },
    kind: 'major7',
    bass: null,
  },
  {
    name: 'minor seventh',
    rationale: 'Root accidental and minor-seventh suffix are parsed as independent components.',
    symbol: 'C#m7',
    root: { letter: 'C', accidental: 1 },
    kind: 'minor7',
    bass: null,
  },
  {
    name: 'dominant seventh',
    rationale: 'A bare 7 means dominant seventh, while the flat remains part of the root.',
    symbol: 'Db7',
    root: { letter: 'D', accidental: -1 },
    kind: 'dominant7',
    bass: null,
  },
  {
    name: 'diminished seventh',
    rationale: 'Double-sharp spelling is retained while dim7 selects a diminished seventh.',
    symbol: 'F##dim7',
    root: { letter: 'F', accidental: 2 },
    kind: 'diminished7',
    bass: null,
  },
  {
    name: 'half-diminished seventh',
    rationale: 'The canonical m7b5 suffix remains distinct from dim7 and Unicode half-diminished.',
    symbol: 'Gbm7b5',
    root: { letter: 'G', accidental: -1 },
    kind: 'half-diminished7',
    bass: null,
  },
  {
    name: 'added ninth',
    rationale:
      'The add9 suffix keeps a major triad identity with a separately normalized added ninth.',
    symbol: 'Abadd9',
    root: { letter: 'A', accidental: -1 },
    kind: 'add9',
    bass: null,
  },
  {
    name: 'minor added ninth',
    rationale: 'The madd9 suffix selects the minor-add9 vocabulary member without parentheses.',
    symbol: 'Bbmadd9',
    root: { letter: 'B', accidental: -1 },
    kind: 'minor-add9',
    bass: null,
  },
]);

export const SLASH_BASS_SYMBOL_GOLDENS: readonly ChordSymbolGolden[] = Object.freeze([
  {
    name: 'major seventh over chord-tone bass',
    rationale: 'The explicit E bass is retained separately from C major-seventh harmonic identity.',
    symbol: 'Cmaj7/E',
    root: { letter: 'C', accidental: 0 },
    kind: 'major7',
    bass: { letter: 'E', accidental: 0 },
  },
  {
    name: 'flat minor seventh over flat bass',
    rationale:
      'Root and slash bass preserve independent flat spellings through parsing and rendering.',
    symbol: 'Dbm7/Ab',
    root: { letter: 'D', accidental: -1 },
    kind: 'minor7',
    bass: { letter: 'A', accidental: -1 },
  },
  {
    name: 'double-sharp diminished seventh',
    rationale:
      'A double-sharp root and sharp slash bass remain separate validated spelled pitches.',
    symbol: 'F##dim7/A#',
    root: { letter: 'F', accidental: 2 },
    kind: 'diminished7',
    bass: { letter: 'A', accidental: 1 },
  },
  {
    name: 'non-chord slash bass',
    rationale:
      'Eb is not a member of C7, so parsing must retain a bass without claiming an inversion.',
    symbol: 'C7/Eb',
    root: { letter: 'C', accidental: 0 },
    kind: 'dominant7',
    bass: { letter: 'E', accidental: -1 },
  },
  {
    name: 'explicit root bass',
    rationale:
      'An explicit slash remains observable even when its bass spelling equals the chord root.',
    symbol: 'C/C',
    root: { letter: 'C', accidental: 0 },
    kind: 'major',
    bass: { letter: 'C', accidental: 0 },
  },
  {
    name: 'maximum-length canonical spelling',
    rationale: 'Double accidentals on root and bass remain valid at the bounded grammar length.',
    symbol: 'C##madd9/Bbb',
    root: { letter: 'C', accidental: 2 },
    kind: 'minor-add9',
    bass: { letter: 'B', accidental: -2 },
  },
]);

export const ENHARMONIC_CHORD_PAIR_GOLDENS: readonly EnharmonicChordPairGolden[] = Object.freeze([
  {
    left: 'C#',
    right: 'Db',
    rationale:
      'C-sharp and D-flat sound alike but encode different letter and accidental spelling.',
  },
  {
    left: 'B#',
    right: 'C',
    rationale: 'B-sharp crosses the pitch-class boundary without becoming the spelling C.',
  },
  {
    left: 'F##',
    right: 'G',
    rationale: 'A supported double-sharp is not simplified to its enharmonic natural note.',
  },
  {
    left: 'Abb',
    right: 'G',
    rationale:
      'A supported double-flat is retained even when its sounding pitch class is natural G.',
  },
  {
    left: 'Cb',
    right: 'B',
    rationale: 'C-flat and B share pitch class eleven but remain different notation values.',
  },
]);

export const CHORD_TRANSPOSITION_GOLDENS: readonly ChordTranspositionGolden[] = Object.freeze([
  {
    source: 'Cmaj7/E',
    interval: { diatonicSteps: 1, semitones: 2 },
    expected: 'Dmaj7/F#',
    rationale: 'A major second moves both C to D and the explicit E bass to F-sharp.',
  },
  {
    source: 'Dbm7/Ab',
    interval: { diatonicSteps: 1, semitones: 2 },
    expected: 'Ebm7/Bb',
    rationale: 'The same major second retains the flat-oriented spelling of root and slash bass.',
  },
  {
    source: 'C#madd9/G#',
    interval: { diatonicSteps: 2, semitones: 3 },
    expected: 'Emadd9/B',
    rationale: 'A minor third changes both spelled pitches while preserving minor-add9 structure.',
  },
  {
    source: 'B#7/D##',
    interval: { diatonicSteps: 1, semitones: 2 },
    expected: 'C##7/E##',
    rationale:
      'A major second legitimately produces supported double accidentals on root and bass.',
  },
  {
    source: 'Ebm7/Bb',
    interval: { diatonicSteps: -1, semitones: -2 },
    expected: 'Dbm7/Ab',
    rationale: 'A descending major second is the exact spelling-preserving inverse of the ascent.',
  },
  {
    source: 'C#',
    interval: { diatonicSteps: 0, semitones: 1 },
    expected: 'C##',
    rationale: 'An augmented unison changes accidental while deliberately retaining the letter C.',
  },
  {
    source: 'Db',
    interval: { diatonicSteps: 0, semitones: -1 },
    expected: 'Dbb',
    rationale: 'A descending augmented unison changes accidental while retaining the letter D.',
  },
]);

export const PROGRESSION_TRANSPOSITION_GOLDENS: readonly ProgressionTranspositionGolden[] =
  Object.freeze([
    {
      name: 'major I-V-vi-IV',
      source: ['C', 'G', 'Am', 'F'],
      interval: { diatonicSteps: 1, semitones: 2 },
      expected: ['D', 'A', 'Bm', 'G'],
      rationale: 'A major-second transposition preserves the familiar I-V-vi-IV harmonic sequence.',
    },
    {
      name: 'minor i-VI-iv-V7',
      source: ['Em', 'C', 'Am', 'B7'],
      interval: { diatonicSteps: -2, semitones: -4 },
      expected: ['Cm', 'Ab', 'Fm', 'G7'],
      rationale: 'A descending major third preserves i-VI-iv-V7 and its explicit dominant seventh.',
    },
    {
      name: 'flat major realization',
      source: ['Db', 'Ab', 'Bbm', 'Gb'],
      interval: { diatonicSteps: 1, semitones: 2 },
      expected: ['Eb', 'Bb', 'Cm', 'Ab'],
      rationale:
        'Flat spellings transpose coherently without being rewritten to sharp enharmonics.',
    },
  ]);

export const INVALID_CHORD_SYMBOL_GOLDENS: readonly InvalidChordSymbolGolden[] = Object.freeze([
  { input: '', reason: 'empty' },
  { input: ' ', reason: 'whitespace' },
  { input: 'H7', reason: 'invalid-root' },
  { input: 'cmaj7', reason: 'invalid-root' },
  { input: 'C###', reason: 'unsupported-accidental' },
  { input: 'Dbbb', reason: 'unsupported-accidental' },
  { input: 'C#b', reason: 'unsupported-accidental' },
  { input: 'Cb#', reason: 'unsupported-accidental' },
  { input: 'C##b', reason: 'unsupported-accidental' },
  { input: 'C/', reason: 'invalid-slash-bass' },
  { input: 'C/H', reason: 'invalid-slash-bass' },
  { input: 'C/e', reason: 'invalid-slash-bass' },
  { input: 'C/E###', reason: 'invalid-slash-bass' },
  { input: 'C/E#b', reason: 'invalid-slash-bass' },
  { input: 'C/E♭', reason: 'invalid-slash-bass' },
  { input: '/E', reason: 'invalid-root' },
  { input: 'C//E', reason: 'multiple-slashes' },
  { input: 'Cmaj7/E/G', reason: 'multiple-slashes' },
  { input: ' C', reason: 'whitespace' },
  { input: 'C ', reason: 'whitespace' },
  { input: 'C maj7', reason: 'whitespace' },
  { input: 'C/E ', reason: 'whitespace' },
  { input: 'C♯', reason: 'unsupported-accidental' },
  { input: 'C♭', reason: 'unsupported-accidental' },
  { input: 'Cmaj7/Ebbbbbb', reason: 'too-long' },
]);

export const UNSUPPORTED_CHORD_ALIASES: readonly string[] = Object.freeze([
  'Cmin',
  'C-',
  'C+',
  'C°',
  'C°7',
  'Cø7',
  'CM7',
  'CΔ7',
  'Cdom7',
  'Cmin7',
  'C(add9)',
  'Cm(add9)',
  'C2',
  'C5',
  'C6',
  'C9',
  'C11',
  'C13',
  'Cmaj9',
]);
