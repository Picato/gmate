import type { Exercise, ExerciseKind, Guide, Level, VideoIds } from '../core/types.ts';

type LevelRange = readonly [min: Level, max: Level];

const guide = (goal: string, steps: readonly string[], tips: readonly string[], check: string): Guide => ({
  goal,
  steps,
  tips,
  check,
});

function practice(
  kind: Exclude<ExerciseKind, 'lesson'>,
  id: string,
  minutes: number,
  [minLevel, maxLevel]: LevelRange,
  title: string,
  how: Guide,
): Exercise {
  return { kind, id, minutes, minLevel, maxLevel, title, guide: how };
}

function lesson(
  id: string,
  minutes: number,
  [minLevel, maxLevel]: LevelRange,
  title: string,
  videoIds: VideoIds,
  how: Guide,
): Exercise {
  return { kind: 'lesson', id, minutes, minLevel, maxLevel, title, videoIds, guide: how };
}

// Fret numbers are written as string-by-string lists, low E (6th string) first, x = do not play.
// Bands: beginner 1-2, intermediate 3 (densest, the default level), advanced 4-5.
// Every kind keeps at least 3 entries eligible at every level.
export const CATALOG: readonly Exercise[] = [
  practice('warmup', 'warm-stretch', 5, [1, 2], 'Hand stretches and finger taps', guide(
    'Loosen your hands and wake up each finger before you pick up the guitar.',
    [
      'Shake both hands out, then open and close your fists slowly 10 times.',
      'Spread your fret-hand fingers as wide as is comfortable, hold 5 seconds, relax. Repeat 5 times.',
      'Touch each fingertip to your thumb in turn, index to pinky and back, 10 times.',
      'On the guitar, put your index finger on fret 1 of the low E string, then add fingers 2, 3 and 4 on frets 2, 3 and 4 one at a time. Lift them off one at a time in the same order. Repeat on the A string.',
    ],
    ['Stretch to mild tension only. If anything hurts, stop.', 'Keep your shoulders low and your wrist straight.'],
    'Your fingers feel warm and move independently, and nothing in your hand or wrist aches.',
  )),
  practice('warmup', 'warm-spider', 5, [1, 3], 'Spider walk 1-2-3-4', guide(
    'Build finger strength and fret-hand coordination with one finger per fret.',
    [
      'Set a metronome to 60 bpm and play one note per click.',
      'On the low E string play fret 1 with finger 1, fret 2 with finger 2, fret 3 with finger 3 and fret 4 with finger 4.',
      'Move to the A string and repeat, then D, G, B and the high E string.',
      'Come back down the strings, then repeat the whole walk starting one fret higher (frets 2-3-4-5).',
    ],
    ['Keep each finger over its fret even while the others play, so the hand does not jump around.', 'Press just hard enough for a clean note, close to the fret wire.'],
    'Every note rings clearly, with no buzz, at 60 bpm across all six strings.',
  )),
  practice('warmup', 'warm-chromatic', 5, [1, 5], 'Chromatic exercise', guide(
    'Practise clean fretting and steady picking up and down a single string.',
    [
      'Choose the 6th string. Starting on fret 1, play every fret up to fret 12 with alternate picking (down, up, down, up), one note per click.',
      'Play it back down from fret 12 to fret 1 without stopping.',
      'Repeat on the 5th and 4th strings.',
      'Raise the metronome by 5 bpm only after a full clean run.',
    ],
    ['Use the finger nearest each fret instead of sliding one finger up the neck.', 'Let the pick pass just through the string, not far past it.'],
    'You play all 12 frets up and down on one string without a buzz or a missed note at a steady tempo.',
  )),
  practice('warmup', 'warm-alternate', 6, [2, 4], 'Alternate picking on open strings', guide(
    'Make your picking hand even and automatic.',
    [
      'Start at 60 bpm. On the open high E string play eight notes: down, up, down, up and so on, two notes per click.',
      'Repeat on each string, moving from the high E down to the low E.',
      'Now cross strings: play two notes each on strings 1-2-3-4-5-6 and back, keeping the down-up motion going without stopping.',
      'If it is clean, raise the tempo 5 bpm and repeat.',
    ],
    ['The motion comes from the wrist, not the whole arm.', 'Keep the pick angled slightly so it glides over the string.', 'Never skip a stroke when you change strings. The hand keeps moving.'],
    'You play the string-crossing pattern evenly for a full minute at the current tempo.',
  )),
  practice('warmup', 'warm-spider-skip', 5, [3, 5], 'Spider walk with string skipping', guide(
    'Train your hands to jump between strings accurately.',
    [
      'Play the 1-2-3-4 finger pattern (frets 1 to 4, one finger per fret) on the 6th string.',
      'Jump to the 4th string and play the same four notes, then the 2nd string.',
      'Do the same on the 5th, 3rd and 1st strings, so you skip one string each time.',
      'Run the whole pattern with a metronome at 60 bpm, then 70 bpm.',
    ],
    ['Look at the guitar, not your hand, for the first few passes. Accuracy first.', 'Mute the strings you skip with the side of your picking hand or your fretting fingers.'],
    'You hit every skipped-string jump cleanly, with no stray notes ringing, at 70 bpm.',
  )),
  practice('warmup', 'warm-legato', 6, [3, 5], 'Hammer-ons and pull-offs', guide(
    'Play notes with the fret hand alone, so they come out smooth and even.',
    [
      'On the 2nd string pick fret 5, then bring finger 3 down firmly on fret 7 without picking again. That is a hammer-on.',
      'Now with both fingers on frets 5 and 7, pick once, then pull finger 3 off by flicking it down and slightly sideways so the fret-5 note sounds. That is a pull-off.',
      'Join them: pick, hammer on, pull off, three notes from one pick. Repeat for one minute.',
      'Do the same on each string, then try fingers 1 and 4 on frets 5 and 8.',
    ],
    ['Raise your finger higher than you think, then drop it quickly. The hammer needs force.', 'On a pull-off, pluck the string slightly with the finger as it leaves, so the lower note is loud enough.'],
    'The hammered and pulled notes are as loud as the picked ones, with an even rhythm.',
  )),
  practice('warmup', 'warm-intermediate-trills', 6, [3, 3], 'Trills and finger independence', guide(
    'Get weaker fingers (3 and 4) as fast and strong as finger 1 and 2.',
    [
      'On the 2nd string, fingers on frets 5, 6, 7, 8 (fingers 1 to 4). Pick once, then trill between two fingers using hammer-ons and pull-offs: 1-2, 1-3, 1-4, 2-3, 2-4, 3-4.',
      'Trill each pair for 8 seconds without stopping. Keep the lower finger down.',
      'Move to the 3rd string and repeat the six pairs.',
      'Finish with the weakest pair (3-4) for 20 seconds on each of the two highest strings.',
    ],
    ['Keep the fingers you are not using hovering near the string, not flying away.', 'If your hand tenses up, shake it out and slow down.'],
    'Every pair trills evenly for 8 seconds, and fingers 3 and 4 are as even as 1 and 2.',
  )),
  practice('warmup', 'warm-speed', 7, [4, 5], 'Speed bursts with a metronome', guide(
    'Raise your clean top speed in short, controlled bursts.',
    [
      'Pick a short pattern you can play cleanly, such as the 1-2-3-4 finger pattern on one string, in sixteenth notes (four notes per click).',
      'Play it for four bars at a tempo where it is easy, for example 70 bpm.',
      'Raise the metronome 4 bpm and repeat for four bars. Keep going up in steps.',
      'When you make two mistakes in a burst, drop back 10 bpm, play it clean twice, and stop.',
    ],
    ['Speed comes from relaxation. If your arm is tight, you have gone too fast.', 'Stop at the first sign of sloppiness. Do not practise mistakes.'],
    'You can play the pattern cleanly at a tempo 4 to 8 bpm above where you started.',
  )),

  practice('chords', 'chord-open-basics', 8, [1, 2], 'Open chords: Em, Am, C, G', guide(
    'Play four essential open chords with every string ringing.',
    [
      'Em: middle finger on fret 2 of the 5th string, ring finger on fret 2 of the 4th string. Strum all six strings.',
      'Am: index on fret 1 of the 2nd string, middle on fret 2 of the 4th string, ring on fret 2 of the 3rd string. Strum five strings from the open A string.',
      'C: ring on fret 3 of the 5th string, middle on fret 2 of the 4th string, index on fret 1 of the 2nd string. Strum from the 5th string.',
      'G: middle on fret 3 of the 6th string, index on fret 2 of the 5th string, ring on fret 3 of the 1st string. Strum all six strings.',
      'For each chord, build it slowly, then pick the strings one at a time to find any that are muted or buzzing.',
    ],
    ['Press with the tips of your fingers, arching them so they do not touch neighbouring strings.', 'Keep your thumb behind the neck, roughly opposite your index and middle fingers.'],
    'You can play all four chords, and when you pick each string one by one, every one sounds clear.',
  )),
  practice('chords', 'chord-em-am', 8, [1, 2], 'Em to Am changes', guide(
    'Change between two chords without stopping the beat.',
    [
      'Form Em (middle finger on fret 2 of the 5th string, ring finger on fret 2 of the 4th string).',
      'Notice that Am uses the same two-finger shape, moved one string toward the floor: now on the 4th and 3rd strings. Add your index finger on fret 1 of the 2nd string.',
      'Move the whole Em shape across as one unit, then add the index finger. Do this slowly, ten times.',
      'Strum each chord four times at 60 bpm, changing on the first beat of each bar.',
    ],
    ['Get your fingers ready during the last beat before the change, not after it.', 'It is better to change slowly and cleanly than quickly and badly.'],
    'You change between Em and Am for a full minute at 60 bpm with no pause and every string ringing.',
  )),
  practice('chords', 'chord-changes', 9, [1, 3], 'One-minute chord changes', guide(
    'Make chord changes fast and automatic.',
    [
      'Choose two chords you know, for example G and C, or Em and D.',
      'Set a timer for one minute. Strum each chord once, change, strum once, change. Count how many clean changes you make.',
      'Write the number down. Rest for 30 seconds.',
      'Try again, aiming to beat your last count. Repeat with a different pair of chords.',
    ],
    ['Keep going when you make a mistake. Only count the clean changes.', 'Watch which finger arrives last, and move it first next time.'],
    'You beat your count from the previous session, with a clean strum on every change.',
  )),
  practice('chords', 'chord-caged', 10, [2, 4], 'CAGED open shapes up the neck', guide(
    'See how five open chord shapes can play the same chord all over the neck.',
    [
      'Play an open C major (the C shape). This is the first shape.',
      'The A shape for C major (x-3-5-5-5-x): index finger across fret 3 of the 5th string, ring finger flat across fret 5 of the 4th, 3rd and 2nd strings.',
      'The G shape for C major starts at fret 5 and the E shape at fret 8. The D shape is at fret 10.',
      'Play only the shapes you can hold cleanly today. Strum each one and name the root note.',
    ],
    ['The five shapes come in the order C, A, G, E, D as you go up the neck, and then repeat.', 'If a barre buzzes, move the barre finger closer to the fret and press with the side of the finger.'],
    'You can play a C major chord in at least three places on the neck and name the lowest note in each.',
  )),
  practice('chords', 'chord-barre', 10, [3, 5], 'Barre chords: F and Bm', guide(
    'Play full barre chords cleanly with the index finger.',
    [
      'F major (E shape at fret 1): index finger flat across all six strings at fret 1, middle on fret 2 of the 3rd string, ring on fret 3 of the 5th string, pinky on fret 3 of the 4th string.',
      'Roll your index finger slightly onto its bony side, closer to the fret. Strum slowly and pick each string to find the dead ones.',
      'Bm (A shape at fret 2): index finger across fret 2 from the 5th string to the 1st, ring on fret 4 of the 4th string, pinky on fret 4 of the 3rd, middle on fret 3 of the 2nd.',
      'Alternate F and Bm with a long pause between them, then shorten the pause.',
    ],
    ['Keep your elbow close to your body, so your arm weight helps press the barre.', 'Barre chords tire your hand. Take 20-second breaks.'],
    'Both chords ring clearly with at most one weak string, and you can hold each for 8 beats.',
  )),
  practice('chords', 'chord-sevenths', 8, [3, 5], 'Dominant and minor sevenths', guide(
    'Add colour with seventh chords you can use in many songs.',
    [
      'A7: x-0-2-0-2-0. E7: 0-2-0-1-0-0. D7: x-x-0-2-1-2. G7: 3-2-0-0-0-1. C7: x-3-2-3-1-0.',
      'Minor sevenths: Am7 x-0-2-0-1-0, Em7 0-2-0-0-0-0, Dm7 x-x-0-2-1-1.',
      'Play each one slowly and listen. Dominant sevenths sound tense, minor sevenths sound soft.',
      'Change between a plain chord and its seventh (for example A to A7, then Am to Am7), four strums each.',
    ],
    ['Most seventh chords only change one finger from the basic chord, so find that finger.', 'Strum only the strings in the diagram.'],
    'You can switch from a basic chord to its seventh without stopping, and hear the difference.',
  )),
  practice('chords', 'chord-sus', 8, [3, 4], 'Sus2 and sus4 voicings', guide(
    'Use suspended chords to add movement to a chord.',
    [
      'Asus2: x-0-2-2-0-0. Asus4: x-0-2-2-3-0. A: x-0-2-2-2-0.',
      'Dsus2: x-x-0-2-3-0. Dsus4: x-x-0-2-3-3. D: x-x-0-2-3-2.',
      'Play A, Asus4, A with four strums each, then A, Asus2, A. Do the same on D.',
      'Play a four-bar loop of A, Asus4, A, Asus2 and listen to how each sus chord wants to return to the plain chord.',
    ],
    ['Sus chords replace the third with the second or fourth note of the scale.', 'Leave the changing finger on the string as the only movement, so it is easy.'],
    'You can play A and D and both of their sus versions, and move between them smoothly in time.',
  )),
  practice('chords', 'chord-intermediate-inversions', 9, [3, 3], 'Triad inversions on the top strings', guide(
    'See one chord in three positions on the top three strings.',
    [
      'Use the 3rd, 2nd and 1st strings (G, B, high E). C major root position: frets 5-5-3 (notes C, E, G).',
      'First inversion: frets 9-8-8 (E, G, C). Second inversion: frets 12-13-12 (G, C, E).',
      'Play the three shapes in order, up the neck: root, first, second. Then back down.',
      'Slide all three shapes up two frets. They now spell D major (root position at frets 7-7-5). Name each chord as you play it.',
    ],
    ['Play each shape as three notes at once or as a rolled arpeggio.', 'Use fingers 1 to 3 or 4 so you can slide the shape.'],
    'You play the three C triads without looking, name the lowest note of each, and move the shapes to a new key.',
  )),
  practice('chords', 'chord-jazz', 10, [4, 5], 'Jazz voicings: maj7 and m7b5', guide(
    'Play two moveable jazz chord shapes with the root on the 5th string.',
    [
      'Maj7: x-3-5-4-5-x is Cmaj7. Index on fret 3 of the 5th string, ring on fret 5 of the 4th, middle on fret 4 of the 3rd, pinky on fret 5 of the 2nd.',
      'Minor 7 flat 5: x-2-3-2-3-x is Bm7b5. Slide the shape up or down to change its root.',
      'Move each shape to the notes A, D and G on the 5th string. Name each chord as you play it.',
      'Play a loop: Cmaj7 for 2 beats, then Bm7b5 for 2 beats, down the neck in whole steps.',
    ],
    ['Strum only the four middle strings. Mute the outer ones.', 'Learn where the root sits, so you can name the chord wherever you land.'],
    'You can move both shapes to any root note on the 5th string and name the chord immediately.',
  )),
  practice('chords', 'chord-extended', 10, [4, 5], 'Extended chords: 9ths and 13ths', guide(
    'Add 9ths and 13ths to dominant chords for a fuller sound.',
    [
      'C9: x-3-2-3-3-0. E9: 0-2-0-1-0-2. A13: x-0-2-0-2-2.',
      'Play each and listen. The extra notes sit above the seventh and make the chord richer.',
      'Compare E7 with E9 (strum each four times), and A7 with A13.',
      'Play a blues progression of A13, D9, E9, four bars each, or a loop of your own.',
    ],
    ['Check the fingering diagrams, then play each string alone to find any you muffled.', 'Extended chords are often played with fewer strings. Leave out the ones that sound wrong.'],
    'You can play all three chords cleanly and use them in a short chord loop without stopping.',
  )),

  practice('rhythm', 'rhythm-down-up', 7, [1, 3], 'Down-up strumming at 70 bpm', guide(
    'Strum a continuous down-up pattern with a steady right hand.',
    [
      'Set the metronome to 70 bpm. On one chord, strum down on each click, counting 1, 2, 3, 4.',
      'Add upstrokes between the clicks: down on the numbers and up on the "ands" (1 and 2 and 3 and 4 and).',
      'Keep your hand moving down and up all the time, even when you do not hit the strings.',
      'Once that is steady, leave out the upstrokes on beats 2 and 4 (still moving your hand): D, D-U, D, D-U.',
    ],
    ['Strum from the wrist and a loose forearm, not the elbow.', 'Aim at the thinner strings on the upstroke. Hit only the top three or four.'],
    'You keep the pattern going for two minutes with a loose hand, in time with the metronome.',
  )),
  practice('rhythm', 'rhythm-four-beat', 6, [1, 2], 'Four-beat downstrokes', guide(
    'Lock your strumming hand to a steady beat.',
    [
      'Set the metronome to 60 bpm. On an Em chord strum four downstrokes per bar, one on each click, counting 1 2 3 4.',
      'Do 8 bars. Listen for even volume.',
      'Now switch to an Am chord, then Em again, changing after every bar without missing a beat.',
      'Raise the metronome to 70 bpm.',
    ],
    ['Count out loud. It keeps you from rushing.', 'Make each strum the same size and loudness.'],
    'Your strums land exactly on every click for eight bars, with no speeding up or slowing down.',
  )),
  practice('rhythm', 'rhythm-muted', 6, [1, 2], 'Muted strums', guide(
    'Add a percussive "chk" sound to your strumming.',
    [
      'Fret a chord, then relax your fret hand so your fingers just touch the strings without pressing. Strum and you hear a short click.',
      'Play four muted strums at 60 bpm, one per click.',
      'Now play beats 1 and 3 with the chord ringing and beats 2 and 4 muted: ring, chk, ring, chk.',
      'Keep the same strumming hand, and only relax and press your fret hand to switch between sound and mute.',
    ],
    ['Do not lift your fingers off the strings, just release the pressure.', 'The muted strum should be short and dry, not a half-ringing buzz.'],
    'You alternate ring and chk evenly for a minute, with a clear difference between them.',
  )),
  practice('rhythm', 'rhythm-syncopation', 8, [2, 4], 'Syncopated strumming patterns', guide(
    'Play a pattern that leaves out some beats while the hand keeps moving.',
    [
      'Count 1 & 2 & 3 & 4 & at 70 bpm and strum this pattern: Down on 1, Down on 2, Up on the & of 2, Up on the & of 3, Down on 4, Up on the & of 4.',
      'Say it out loud as you go: "1, 2 &, & 3, 4 &".',
      'Keep your hand moving down-up all the time, and only touch the strings on the beats of the pattern.',
      'Play it on one chord, then change chord each bar.',
    ],
    ['If you lose the pattern, go back to steady down-ups and join it again.', 'The missed hit on beat 3 is what makes the feel.'],
    'You play the pattern for a whole minute while singing or counting along, with changes between chords.',
  )),
  practice('rhythm', 'rhythm-fingerstyle', 8, [3, 5], 'Fingerstyle p-i-m-a patterns', guide(
    'Pick separate strings with your thumb and fingers.',
    [
      'Rest your thumb (p) on the 5th string, index (i) on the 3rd, middle (m) on the 2nd and ring (a) on the 1st string.',
      'Pluck them in turn: p, i, m, a, m, i. Repeat over an Am chord at 60 bpm, then C, then G.',
      'Keep each finger on its own string. Move only the finger that plays.',
      'Change chord every bar, keeping the pattern going.',
    ],
    ['Pluck with the fingertips and nails, pulling the string slightly across, not up.', 'Keep your picking hand still, with the thumb leading.'],
    'You play the pattern evenly over three chords with no strings missed and a steady rhythm.',
  )),
  practice('rhythm', 'rhythm-shuffle', 7, [3, 4], 'Shuffle feel', guide(
    'Play swung eighth notes, as in blues and rock-and-roll.',
    [
      'Count in triplets: 1-trip-let, 2-trip-let, 3-trip-let, 4-trip-let at 80 bpm.',
      'Play a downstroke on each number and an upstroke on each "let" (skip the "trip"), so the notes come in long-short pairs.',
      'Use an A5 power chord (x-0-2-2-x-x), then D5 (x-x-0-2-3-x), strumming just the low strings.',
      'Play four bars of A5, two of D5, two of A5, at a gentle volume.',
    ],
    ['The long note is twice as long as the short one: it is a triplet, not even eighth notes.', 'Listen to any blues shuffle to hear the feel.'],
    'The long-short feel stays steady over eight bars and sounds swung rather than straight.',
  )),
  practice('rhythm', 'rhythm-sixteenths', 7, [3, 5], 'Sixteenth-note strumming', guide(
    'Strum four notes per beat with a relaxed, constant motion.',
    [
      'Count 1 e & a 2 e & a 3 e & a 4 e & a at 60 bpm.',
      'Strum down on the numbers and "&", up on the "e" and "a": D-U-D-U for every beat.',
      'Play it on a muted chord first, so you only work on the hand motion.',
      'Then fret a chord and leave out some strums while the hand keeps moving, for example skip the "e" and "a" on beats 2 and 4.',
    ],
    ['Keep the hand relaxed. If your forearm burns, slow down.', 'Make the strum smaller as you go faster.'],
    'You keep a constant sixteenth-note motion for a full minute at 60 bpm without tensing up.',
  )),
  practice('rhythm', 'rhythm-intermediate-palm-mute', 7, [3, 3], 'Palm-muted riffs with accents', guide(
    'Play a tight, chugging riff and bring out chosen notes.',
    [
      'Rest the edge of your picking palm lightly on the strings right next to the bridge. Pluck the 6th string and listen for a short, thudding sound.',
      'Play eighth notes on the open 6th string, all down-picks, 8 notes per bar at 80 bpm, with the palm on.',
      'Now accent beat 1 and the "and" of 3: lift your palm slightly and pick harder on those notes only.',
      'Move to power chords (E5 0-2-2-x-x-x) and play the same accents.',
    ],
    ['Move your palm closer to the bridge for a tighter sound and away for a looser one.', 'Keep the accent notes ringing a little longer.'],
    'The unaccented notes sound short and even, the accented ones stand out clearly, and the rhythm is steady.',
  )),
  practice('rhythm', 'rhythm-polyrhythm', 8, [4, 5], 'Polyrhythm: three against four', guide(
    'Hold two rhythms at once: three evenly spaced notes against four beats.',
    [
      'Count 12 steady pulses at 60 bpm in groups: 1 2 3 4 5 6 7 8 9 10 11 12.',
      'Tap your foot or the metronome on steps 1, 4, 7 and 10 (four beats).',
      'Tap your hand on steps 1, 5 and 9 (three beats). Do each alone first.',
      'Play them together: foot on the four, a picked note on the three, using one open string for the picked note.',
    ],
    ['Say "1 2 3 4 5 6..." out loud at first.', 'Go slowly. It will feel wrong for a few minutes before it clicks.'],
    'You hold the three and the four together for 8 bars without losing either one.',
  )),
  practice('rhythm', 'rhythm-travis', 8, [4, 5], 'Travis picking', guide(
    'Play a steady alternating bass with the thumb while the fingers play the melody.',
    [
      'On a C chord, play the 5th string with your thumb on beat 1, the 4th string on beat 2, the 5th on beat 3 and the 4th on beat 4, at 60 bpm.',
      'Keep that bass steady. Then add your index finger on the 3rd string, and your middle on the 2nd string, between the bass notes (on the "ands").',
      'Play bass, finger, bass, finger: 1 & 2 & 3 & 4 &.',
      'Change to G (thumb on the 6th and 4th strings) and Am, keeping the thumb going.',
    ],
    ['The thumb never stops. It is your metronome.', 'Practise the thumb alone until it runs by itself.'],
    'You play the thumb pattern with fingers over C, G and Am for a minute, and the bass stays even.',
  )),

  practice('scales', 'scale-first-notes', 8, [1, 2], 'First notes on the E and A strings', guide(
    'Learn the names of your first notes and where they sit on the neck.',
    [
      'The low E string: open E, fret 1 is F (index finger), fret 3 is G (ring finger).',
      'The A string: open A, fret 2 is B (middle finger), fret 3 is C (ring finger).',
      'Play E F G on the 6th string, then A B C on the 5th string, saying the note names out loud.',
      'Play them up and down, then in random order while you call out the names.',
    ],
    ['Use the fingertip right behind the fret.', 'Say each note name as you play it. It helps you remember.'],
    'You name any of these six notes when pointed at, and play them in either order without buzzing.',
  )),
  practice('scales', 'scale-c-major', 8, [1, 3], 'C major in open position', guide(
    'Play your first complete scale.',
    [
      'The notes are C D E F G A B C. Start on the 5th string: fret 3 (C, ring finger).',
      'Next, the 4th string: open D, fret 2 (E, middle finger), fret 3 (F, ring finger).',
      'The 3rd string: open G, fret 2 (A, middle finger). The 2nd string: open B, fret 1 (C, index finger).',
      'Play it up and down at 60 bpm, one note per click, saying the note names.',
    ],
    ['Use alternate picking: down, up, down, up.', 'Keep the fingers close to the fretboard so they are ready for the next note.'],
    'You play the scale up and down at 60 bpm with no mistakes, without looking at the diagram.',
  )),
  practice('scales', 'scale-open-strings', 8, [1, 2], 'Open-string melodies', guide(
    'Use open strings to practise picking and make simple melodies.',
    [
      'Play the six open strings in order, 6-5-4-3-2-1, and back, one note per click at 60 bpm.',
      'Play the pattern 6-4-5-3-4-2-3-1 and back.',
      'Make up your own four-note melody from the open strings, and repeat it until you can play it without thinking.',
      'Change the rhythm: play the same melody with long and short notes.',
    ],
    ['Count the clicks so you hold each note for its full length.', 'Let the notes ring into each other.'],
    'You play a four-note melody of your own from memory, twice in a row, in time.',
  )),
  practice('scales', 'scale-pentatonic-box1', 10, [2, 5], 'A minor pentatonic, box 1', guide(
    'Learn the most important shape for rock and blues solos.',
    [
      'All the notes of A minor pentatonic in the position at fret 5. The 6th string: frets 5 and 8. The 5th: 5 and 7. The 4th: 5 and 7. The 3rd: 5 and 7. The 2nd: 5 and 8. The 1st: 5 and 8.',
      'Use finger 1 for fret 5, finger 3 for fret 7 and finger 4 for fret 8.',
      'Play it up and down at 60 bpm, two notes per string, then three times in a row.',
      'Find the root notes (A): fret 5 of the 6th string, fret 7 of the 4th string and fret 5 of the 1st. Land on them to end phrases.',
    ],
    ['Play with alternate picking.', 'Say "root" on each A to remember where home is.'],
    'You play the shape from memory, up and down, without hesitating, and point to the three root notes.',
  )),
  practice('scales', 'scale-major-3nps', 10, [3, 5], 'Major scale, three notes per string', guide(
    'Play a major scale with three notes on each string.',
    [
      'G major. The 6th string: frets 3, 5, 7. The 5th: 2, 3, 5. The 4th: 2, 4, 5. The 3rd: 2, 4, 5. The 2nd: 3, 5, 7. The 1st: 3, 5, 7.',
      'Play the shape slowly up and down at 60 bpm, three notes per string, with alternate picking.',
      'Say the note names as you go: G A B / B C D / E F# G / A B C / D E F# / G A B.',
      'Then play it in groups of three notes, and move up the scale one note at a time.',
    ],
    ['Use fingers 1, 2 and 4 or 1, 3 and 4 as needed. Choose a fingering and stick with it.', 'The shape slides to any key by shifting the whole thing.'],
    'You play the whole shape up and down without errors at 60 bpm and say the note names.',
  )),
  practice('scales', 'scale-minor-pentatonic', 10, [3, 5], 'Minor pentatonic, all five boxes', guide(
    'Connect the five shapes of the minor pentatonic scale across the neck.',
    [
      'In A minor, the five boxes sit at frets 5-8, 7-10, 9-13, 12-15 and 14-17.',
      'Play each box up and down at 60 bpm. Today concentrate on boxes 1, 2 and 3.',
      'Each box shares notes with the next. Play box 1, then slide into box 2 on a shared note and carry on.',
      'Practise the root notes in each box (the A notes).',
    ],
    ['Go slowly. Learning the boxes in order is more useful than going fast.', 'Say the names of the root notes aloud when you find them.'],
    'You play three connected boxes in a row and name the root in each.',
  )),
  practice('scales', 'scale-pentatonic-box2', 9, [3, 5], 'A minor pentatonic, box 2 and links', guide(
    'Learn the second pentatonic box and join it to the first.',
    [
      'Box 2. The 6th string: frets 8 and 10. The 5th: 7 and 10. The 4th: 7 and 10. The 3rd: 7 and 9. The 2nd: 8 and 10. The 1st: 8 and 10.',
      'Play box 2 up and down at 60 bpm.',
      'Link: play box 1 up to the 1st string, then slide your finger from fret 8 to fret 10 and play box 2 down.',
      'Make a four-note phrase and play it in both boxes.',
    ],
    ['Use finger 1 on frets 7 and 8, finger 3 on 9 and 10.', 'Practise the slide between boxes slowly.'],
    'You play both boxes and move between them smoothly in either direction.',
  )),
  practice('scales', 'scale-intermediate-blues', 10, [3, 3], 'Blues scale with the blue note', guide(
    'Add the "blue note" to the minor pentatonic scale.',
    [
      'Start with A minor pentatonic box 1 (frets 5-8).',
      'Add the blue note: fret 6 of the 5th string, between the 5th and 7th frets, and fret 8 of the 3rd string.',
      'Play the scale slowly up and down at 60 bpm. Notice the tense sound of the blue note.',
      'Try bending or sliding into the blue note and resolving it to the next note up, then to the one below.',
    ],
    ['Use the blue note as a passing note. Do not stop on it.', 'Try it over a recording of a 12-bar blues in A.'],
    'You play the blues scale and use the blue note as a passing note in a short phrase.',
  )),
  practice('scales', 'scale-modes', 10, [4, 5], 'Dorian and mixolydian modes', guide(
    'Hear the difference between two modes by playing them over the same root.',
    [
      'A Dorian uses the notes of G major, starting on A: A B C D E F# G. A Mixolydian uses the notes of D major, starting on A: A B C# D E F# G.',
      'Play each in the three-notes-per-string shape from the last exercise, starting from the A on the 6th string, fret 5.',
      'Compare the two. The difference is one note: C natural in Dorian and C# in Mixolydian.',
      'Play a drone (a low A on a looper or backing track) and improvise a short phrase with each mode.',
    ],
    ['Dorian sounds minor and jazzy. Mixolydian sounds major and bluesy.', 'Resolve your phrases to A.'],
    'You play both modes and can say which note changes and how the sound changes.',
  )),

  // A language missing from videoIds has no verified video; scripts/check-catalog.mjs validates every id.
  lesson('lesson-andy-beginner-1', 10, [1, 2], 'Andy Guitar beginner lesson 1', { en: 'BBz-Jyr23M4', vi: 'IIfR6rGgfak' }, guide(
    'Follow a full beginner lesson and be able to repeat what it taught.',
    [
      'Tune your guitar before you start.',
      'Watch the video once through without playing.',
      'Watch it again in short pieces. Pause after each new thing and copy it until it works.',
      'Close the video and play what you learned from memory.',
      'Write down one thing that was hard, to work on tomorrow.',
    ],
    ['Pause as often as you like. You are not racing the video.', 'Use the video at 0.75 speed if it goes too fast.'],
    'You can play the lesson material slowly from memory, without the video.',
  )),
  lesson('lesson-first-riff', 10, [1, 2], 'Your first riff', { en: '5rcCiXqAShY', vi: 'tTsWxefMWGU' }, guide(
    'Learn a short melody you can recognise, one note at a time.',
    [
      'Watch the whole video first and listen to how the riff sounds at full speed.',
      'Learn the first two or three notes only. Play them 10 times in a row.',
      'Add the next notes, one small group at a time, always playing from the beginning.',
      'Play the whole riff slowly with a metronome at 60 bpm, then a little faster.',
    ],
    ['Note the finger numbers and fret positions in the video. Do not guess.', 'Keep the rhythm: count along as you play.'],
    'You play the whole riff four times in a row at a steady tempo without stopping.',
  )),
  lesson('lesson-three-chord-song', 12, [1, 3], 'A three-chord song', { en: 'ylgPrXISIuM', vi: 'iiNR89XwhTM' }, guide(
    'Play a full song with just three chords.',
    [
      'Watch the video and identify the three chords and the strumming pattern.',
      'Practise each chord shape alone until all strings ring.',
      'Practise the three changes slowly, one pair at a time (for example G to C, C to D, D to G).',
      'Add the strum pattern on one chord, then play the song one line at a time.',
      'Play the whole song once at a slow pace, without stopping for mistakes.',
    ],
    ['Slow down enough that you never stop the strumming hand.', 'Sing or hum along. It helps you keep the form.'],
    'You play the whole song through at a slow, steady tempo with every chord change on time.',
  )),
  lesson('lesson-campfire', 12, [2, 4], 'Campfire strumming song', { en: 'ix9z6CLgc5w', vi: '49vI-RYwP3w' }, guide(
    'Play a song with a classic strumming pattern and singalong feel.',
    [
      'Watch the video and note the chord progression and the strumming pattern.',
      'Play the pattern on a muted chord first, counting out loud.',
      'Add the chords, one change per bar, at slow speed.',
      'Loop the verse four times, then the chorus, then play the whole song.',
    ],
    ['Keep your strumming hand moving all the time.', 'Make the strumming softer on the verse and louder on the chorus.'],
    'You play the verse and chorus without stopping, with a steady strum, and sing or hum over it.',
  )),
  lesson('lesson-fingerpicking-song', 12, [3, 4], 'A fingerpicking song', { en: 'WKprmyDGs7M', vi: 'oduOXZ23qQU' }, guide(
    'Play a song using a fingerpicking pattern.',
    [
      'Watch the video and note the picking pattern and the chords.',
      'Practise the picking pattern on one chord, very slowly, until it runs by itself.',
      'Add the chord changes at the slowest speed, one bar at a time.',
      'Play the whole piece at about 60 percent of the video tempo.',
    ],
    ['Stay relaxed. Tension in the picking hand shows up as uneven notes.', 'Look at your picking hand only when you need to.'],
    'You play the pattern evenly through every chord change in the song at a slow tempo.',
  )),
  lesson('lesson-blues', 10, [3, 5], '12-bar blues in A', { en: 'rLm99QI8eWs', vi: 'u9CRfc20FN0' }, guide(
    'Learn and play the most used chord pattern in blues.',
    [
      'The 12 bars in A are: A A A A, D D A A, E D A E.',
      'Watch the video, then play the pattern with A7, D7 and E7 (or A5, D5 and E5 power chords), one strum per beat.',
      'Play it with a shuffle rhythm at 80 bpm and count the 12 bars out loud.',
      'Play the full 12 bars three times without losing your place.',
    ],
    ['The last bar (E) leads back to the start, so keep counting.', 'Listen for where the chord changes happen.'],
    'You play three full 12-bar rounds without getting lost, with changes on the right bar.',
  )),
  lesson('lesson-improv', 10, [3, 5], 'Pentatonic improvisation over a backing track', { en: 'pQhbePL8h48', vi: 'fs6Itl9M_TA' }, guide(
    'Make up your own solo phrases over a backing track.',
    [
      'Start the backing track and play only the root note A (fret 5 of the 6th string) in different rhythms for one minute.',
      'Add two more notes from A minor pentatonic box 1 and make short phrases of three or four notes.',
      'Play a phrase, then rest for two beats, and answer with another phrase (call and response).',
      'Record yourself for one minute and listen back to the best parts.',
    ],
    ['Leave space. The rests are as important as the notes.', 'Repeat a phrase you like, with a small change, instead of always playing something new.'],
    'You play one minute of improvisation using rests and repeated phrases, and end on the root note.',
  )),
  lesson('lesson-solo-intro', 12, [3, 5], 'Learn a classic solo intro', { en: '0RybdmubxzY', vi: 'oDGvBaGBc-4' }, guide(
    'Learn a famous solo opening and play it note for note.',
    [
      'Watch the video once without playing, to hear the whole thing.',
      'Break it into two-bar pieces. Learn the first piece and play it 10 times slowly.',
      'Add the next piece, always playing from the start of the last piece to join them.',
      'Play the whole intro with a metronome at 60 percent of the original tempo, then raise it by 5 bpm.',
    ],
    ['Pick the fingering once and always use it.', 'Mark the hardest spot and practise only that spot for two minutes.'],
    'You play the whole intro cleanly at a slow tempo, from memory.',
  )),
  lesson('lesson-intermediate-bends', 10, [3, 3], 'String bends and vibrato', { en: 'ck2uxWh4qvo', vi: '4-jnaU_EcZw' }, guide(
    'Bend a string up to the right pitch and add vibrato.',
    [
      'Fret fret 7 of the 3rd string with your ring finger, and put your index and middle fingers on frets 6 and 5 of the same string for support.',
      'First play the note a whole step higher (fret 9), to hear the target. Then play fret 7 again and push the string up toward the ceiling until it matches fret 9.',
      'Practise this bend 10 times, holding it for 4 beats. Check the pitch every time.',
      'Add vibrato: with the bend held, or on a normal note, rock your wrist and finger slowly back and forth so the pitch wavers.',
    ],
    ['Bend with your wrist turning, not just your finger pushing.', 'Bend in tune. Check against the target note every time.'],
    'You bend up a whole step in tune on three different strings and add an even vibrato.',
  )),
  lesson('lesson-advanced-song', 15, [4, 5], 'An advanced full-song study', { en: 'TeMRmFYcWYc', vi: '3b02QP7Akkc' }, guide(
    'Learn a complete, demanding song section by section.',
    [
      'Listen and map the form: intro, verse, chorus, bridge. Write down the chord or riff for each part.',
      'Start with the hardest section, not the first. Learn it in two-bar pieces at 60 percent speed.',
      'Join the sections one by one, working backwards from the end.',
      'Play the whole song along with the track at the slowest speed you can.',
    ],
    ['Do not move on until you can play a piece cleanly three times in a row.', 'Slow practice is how fast playing gets built.'],
    'You play the hardest section cleanly three times in a row and know the structure of the whole song.',
  )),
  lesson('lesson-jazz-standard', 15, [4, 5], 'A jazz standard, chord melody', { en: '57mItDzMeM8', vi: 'GmWS7FuCI_A' }, guide(
    'Play a melody on the top strings with chords underneath.',
    [
      'Learn the melody alone on the top strings, one phrase at a time.',
      'Learn the chord shapes (voicings) for each bar, and play them with no melody.',
      'Join them, one bar at a time: play the melody note on top while the chord shape sounds underneath.',
      'Play the full tune slowly. Listen to the video for how the rhythm swings.',
    ],
    ['Choose voicings where the melody note is the highest note.', 'Keep the chords short so the melody stays clear.'],
    'You play a full chorus with melody and chords at a slow tempo, with no stops.',
  )),
];
