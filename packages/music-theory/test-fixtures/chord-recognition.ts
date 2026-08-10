import type { Accidental, ChordKind, NoteLetter } from '../src/index.js';

export interface RecognitionPitchFixture {
  readonly letter: NoteLetter;
  readonly accidental: Accidental;
}

export type RecognitionBassClassificationFixture =
  | Readonly<{ kind: 'unknown' }>
  | Readonly<{ kind: 'root-position' }>
  | Readonly<{
      kind: 'inversion';
      chordTone: 'second' | 'third' | 'fourth' | 'fifth' | 'seventh' | 'ninth';
    }>
  | Readonly<{ kind: 'non-chord' }>;

export interface RecognitionCandidateFixture {
  readonly kind: ChordKind;
  readonly symbol: string;
  readonly bassClassification: RecognitionBassClassificationFixture;
  readonly evidence: Readonly<{
    readonly pitchSet: 'exact' | 'without-non-chord-bass';
    readonly spellingMismatches: number;
  }>;
}

export interface ChordRecognitionGolden {
  readonly name: string;
  readonly rationale: string;
  readonly notes: readonly RecognitionPitchFixture[];
  readonly bass: RecognitionPitchFixture | null;
  readonly candidates: readonly RecognitionCandidateFixture[];
}

export interface UnrecognizedChordGolden {
  readonly name: string;
  readonly rationale: string;
  readonly notes: readonly RecognitionPitchFixture[];
  readonly bass: RecognitionPitchFixture | null;
}

const pitch = (letter: NoteLetter, accidental: Accidental = 0): RecognitionPitchFixture =>
  Object.freeze({ letter, accidental });

const C = pitch('C');
const D = pitch('D');
const E = pitch('E');
const F = pitch('F');
const G = pitch('G');
const A = pitch('A');
const B = pitch('B');
const C_SHARP = pitch('C', 1);
const D_FLAT = pitch('D', -1);
const D_DOUBLE_SHARP = pitch('D', 2);
const E_FLAT = pitch('E', -1);
const E_SHARP = pitch('E', 1);
const F_DOUBLE_SHARP = pitch('F', 2);
const G_FLAT = pitch('G', -1);
const G_SHARP = pitch('G', 1);
const A_FLAT = pitch('A', -1);
const B_FLAT = pitch('B', -1);
const B_DOUBLE_FLAT = pitch('B', -2);
const B_SHARP = pitch('B', 1);

const rootPosition = Object.freeze({ kind: 'root-position' } as const);
const unknownBass = Object.freeze({ kind: 'unknown' } as const);
const nonChordBass = Object.freeze({ kind: 'non-chord' } as const);
const inversion = (
  chordTone: 'second' | 'third' | 'fourth' | 'fifth' | 'seventh' | 'ninth',
): RecognitionBassClassificationFixture => Object.freeze({ kind: 'inversion', chordTone });
const exactEvidence = (spellingMismatches = 0) =>
  Object.freeze({ pitchSet: 'exact', spellingMismatches } as const);
const fallbackEvidence = (spellingMismatches = 0) =>
  Object.freeze({ pitchSet: 'without-non-chord-bass', spellingMismatches } as const);

export const CHORD_KIND_RECOGNITION_GOLDENS: readonly ChordRecognitionGolden[] = Object.freeze([
  {
    name: 'major triad',
    rationale:
      'An exact major-third and perfect-fifth pitch set identifies the supported major triad.',
    notes: [C, E, G],
    bass: C,
    candidates: [
      { kind: 'major', symbol: 'C', bassClassification: rootPosition, evidence: exactEvidence() },
    ],
  },
  {
    name: 'minor triad',
    rationale:
      'The minor third remains distinct from the major template while the fifth stays perfect.',
    notes: [C, E_FLAT, G],
    bass: C,
    candidates: [
      { kind: 'minor', symbol: 'Cm', bassClassification: rootPosition, evidence: exactEvidence() },
    ],
  },
  {
    name: 'diminished triad',
    rationale:
      'Two stacked minor thirds select a diminished triad without inferring a missing seventh.',
    notes: [C, E_FLAT, G_FLAT],
    bass: C,
    candidates: [
      {
        kind: 'diminished',
        symbol: 'Cdim',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'symmetric augmented triad',
    rationale:
      'An augmented triad is symmetric by major thirds, so all observed roots remain candidates.',
    notes: [C, E, G_SHARP],
    bass: C,
    candidates: [
      {
        kind: 'augmented',
        symbol: 'Caug',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
      {
        kind: 'augmented',
        symbol: 'Eaug/C',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(1),
      },
      {
        kind: 'augmented',
        symbol: 'G#aug/C',
        bassClassification: inversion('third'),
        evidence: exactEvidence(2),
      },
    ],
  },
  {
    name: 'suspended second ambiguity',
    rationale:
      'The same three pitch classes support C suspended-second and G suspended-fourth identities.',
    notes: [C, D, G],
    bass: C,
    candidates: [
      {
        kind: 'sus2',
        symbol: 'Csus2',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
      {
        kind: 'sus4',
        symbol: 'Gsus4/C',
        bassClassification: inversion('fourth'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'suspended fourth ambiguity',
    rationale:
      'C suspended-fourth and F suspended-second share this pitch set and must both be visible.',
    notes: [C, F, G],
    bass: C,
    candidates: [
      {
        kind: 'sus4',
        symbol: 'Csus4',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
      {
        kind: 'sus2',
        symbol: 'Fsus2/C',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'major seventh',
    rationale: 'The major seventh above a major triad selects major7 rather than dominant seventh.',
    notes: [C, E, G, B],
    bass: C,
    candidates: [
      {
        kind: 'major7',
        symbol: 'Cmaj7',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'minor seventh',
    rationale:
      'A minor triad plus its minor seventh exactly identifies the minor-seventh structure.',
    notes: [C, E_FLAT, G, B_FLAT],
    bass: C,
    candidates: [
      {
        kind: 'minor7',
        symbol: 'Cm7',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'dominant seventh',
    rationale: 'A major triad with a minor seventh selects dominant7 and not the major7 template.',
    notes: [C, E, G, B_FLAT],
    bass: C,
    candidates: [
      {
        kind: 'dominant7',
        symbol: 'C7',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'symmetric diminished seventh',
    rationale:
      'A diminished-seventh pitch set is symmetric by minor thirds and has four valid roots.',
    notes: [C, E_FLAT, G_FLAT, B_DOUBLE_FLAT],
    bass: C,
    candidates: [
      {
        kind: 'diminished7',
        symbol: 'Cdim7',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
      {
        kind: 'diminished7',
        symbol: 'Ebdim7/C',
        bassClassification: inversion('seventh'),
        evidence: exactEvidence(1),
      },
      {
        kind: 'diminished7',
        symbol: 'Gbdim7/C',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(2),
      },
      {
        kind: 'diminished7',
        symbol: 'Bbbdim7/C',
        bassClassification: inversion('third'),
        evidence: exactEvidence(3),
      },
    ],
  },
  {
    name: 'half-diminished seventh',
    rationale:
      'The minor seventh distinguishes half-diminished7 from the symmetric diminished seventh.',
    notes: [C, E_FLAT, G_FLAT, B_FLAT],
    bass: C,
    candidates: [
      {
        kind: 'half-diminished7',
        symbol: 'Cm7b5',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'added ninth',
    rationale:
      'The second, third, and fifth together preserve the supported major added-ninth identity.',
    notes: [C, D, E, G],
    bass: C,
    candidates: [
      {
        kind: 'add9',
        symbol: 'Cadd9',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'minor added ninth',
    rationale:
      'A minor third plus the added second selects minor-add9 without discarding either tone.',
    notes: [C, D, E_FLAT, G],
    bass: C,
    candidates: [
      {
        kind: 'minor-add9',
        symbol: 'Cmadd9',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
]);

export const INVERSION_RECOGNITION_GOLDENS: readonly ChordRecognitionGolden[] = Object.freeze([
  {
    name: 'major first inversion',
    rationale:
      'The explicit E bass determines first inversion independently from the unordered notes.',
    notes: [E, G, C],
    bass: E,
    candidates: [
      {
        kind: 'major',
        symbol: 'C/E',
        bassClassification: inversion('third'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'major second inversion',
    rationale:
      'The explicit G bass correctly produces C over G, correcting the source specification example.',
    notes: [G, C, E],
    bass: G,
    candidates: [
      {
        kind: 'major',
        symbol: 'C/G',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'bass independent from note order',
    rationale:
      'The explicit E remains bass even though G is first, proving that note order has no meaning.',
    notes: [G, C, E],
    bass: E,
    candidates: [
      {
        kind: 'major',
        symbol: 'C/E',
        bassClassification: inversion('third'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'unknown bass',
    rationale:
      'A null bass preserves the recognized major identity without inventing an inversion.',
    notes: [G, C, E],
    bass: null,
    candidates: [
      { kind: 'major', symbol: 'C', bassClassification: unknownBass, evidence: exactEvidence() },
    ],
  },
  {
    name: 'major seventh third inversion',
    rationale:
      'The explicit major seventh in the bass produces the corresponding seventh-tone inversion.',
    notes: [B, C, E, G],
    bass: B,
    candidates: [
      {
        kind: 'major7',
        symbol: 'Cmaj7/B',
        bassClassification: inversion('seventh'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'suspension ordering follows bass relation',
    rationale:
      'The root-position Gsus4 candidate precedes an inverted Csus2 regardless of kind order.',
    notes: [C, D, G],
    bass: G,
    candidates: [
      {
        kind: 'sus4',
        symbol: 'Gsus4',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
      {
        kind: 'sus2',
        symbol: 'Csus2/G',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(),
      },
    ],
  },
]);

export const ENHARMONIC_RECOGNITION_GOLDENS: readonly ChordRecognitionGolden[] = Object.freeze([
  {
    name: 'sharp major spelling',
    rationale: 'A consistently sharp-spelled major triad retains C-sharp as its displayed root.',
    notes: [C_SHARP, E_SHARP, G_SHARP],
    bass: C_SHARP,
    candidates: [
      { kind: 'major', symbol: 'C#', bassClassification: rootPosition, evidence: exactEvidence() },
    ],
  },
  {
    name: 'flat major spelling',
    rationale:
      'The enharmonic flat pitch set retains D-flat rather than normalizing it to C-sharp.',
    notes: [D_FLAT, F, A_FLAT],
    bass: D_FLAT,
    candidates: [
      { kind: 'major', symbol: 'Db', bassClassification: rootPosition, evidence: exactEvidence() },
    ],
  },
  {
    name: 'double-sharp major spelling',
    rationale:
      'Supported double accidentals remain available when every major-triad tone is spelled exactly.',
    notes: [B_SHARP, D_DOUBLE_SHARP, F_DOUBLE_SHARP],
    bass: B_SHARP,
    candidates: [
      { kind: 'major', symbol: 'B#', bassClassification: rootPosition, evidence: exactEvidence() },
    ],
  },
  {
    name: 'flat major second inversion',
    rationale:
      'An explicit A-flat bass is retained separately below the D-flat major harmonic identity.',
    notes: [A_FLAT, D_FLAT, F],
    bass: A_FLAT,
    candidates: [
      {
        kind: 'major',
        symbol: 'Db/Ab',
        bassClassification: inversion('fifth'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'enharmonic member mismatch evidence',
    rationale:
      'Sounding pitch classes may match a B-sharp triad while member spellings expose two mismatches.',
    notes: [B_SHARP, E, G],
    bass: B_SHARP,
    candidates: [
      { kind: 'major', symbol: 'B#', bassClassification: rootPosition, evidence: exactEvidence(2) },
    ],
  },
]);

export const FALLBACK_RECOGNITION_GOLDENS: readonly ChordRecognitionGolden[] = Object.freeze([
  {
    name: 'dominant seventh over non-chord bass',
    rationale:
      'Removing the explicit E-flat bass exposes an exact C dominant-seventh upper pitch set.',
    notes: [E_FLAT, C, E, G, B_FLAT],
    bass: E_FLAT,
    candidates: [
      {
        kind: 'dominant7',
        symbol: 'C7/Eb',
        bassClassification: nonChordBass,
        evidence: fallbackEvidence(),
      },
    ],
  },
  {
    name: 'ambiguous suspension over non-chord bass',
    rationale:
      'Removing A exposes the shared C-sus2 and G-sus4 set, so both fallback candidates remain.',
    notes: [A, C, D, G],
    bass: A,
    candidates: [
      {
        kind: 'sus2',
        symbol: 'Csus2/A',
        bassClassification: nonChordBass,
        evidence: fallbackEvidence(),
      },
      {
        kind: 'sus4',
        symbol: 'Gsus4/A',
        bassClassification: nonChordBass,
        evidence: fallbackEvidence(),
      },
    ],
  },
  {
    name: 'exact add9 precedes triad fallback',
    rationale:
      'The complete C-add9 set prevents the D bass from being discarded to invent a C-over-D triad.',
    notes: [D, C, E, G],
    bass: D,
    candidates: [
      {
        kind: 'add9',
        symbol: 'Cadd9/D',
        bassClassification: inversion('ninth'),
        evidence: exactEvidence(),
      },
    ],
  },
  {
    name: 'exact minor seventh precedes fallback',
    rationale:
      'The complete A-minor-seventh set wins before any attempt to treat A as a removable bass.',
    notes: [A, C, E, G],
    bass: A,
    candidates: [
      {
        kind: 'minor7',
        symbol: 'Am7',
        bassClassification: rootPosition,
        evidence: exactEvidence(),
      },
    ],
  },
]);

export const VALID_UNRECOGNIZED_GOLDENS: readonly UnrecognizedChordGolden[] = Object.freeze([
  {
    name: 'dyad',
    rationale:
      'A valid two-pitch observation is insufficient for every exact supported chord template.',
    notes: [C, G],
    bass: C,
  },
  {
    name: 'unsupported five-note set',
    rationale:
      'Recognition must not silently discard upper notes merely to recover a familiar subset.',
    notes: [C, D, E, F, G_SHARP],
    bass: C,
  },
  {
    name: 'extra pitch without known bass',
    rationale:
      'A null bass cannot authorize removal of E-flat from the otherwise dominant-seventh set.',
    notes: [E_FLAT, C, E, G, B_FLAT],
    bass: null,
  },
]);
