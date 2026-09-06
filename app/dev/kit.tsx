import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CharacterId, DialogueLine, Emotion } from '@/content/types';
import type { EquipmentId } from '@/learning/types';
import { badges } from '@/content/badges';
import { palette, radii, shadows, spacing, subjectColors, type SubjectId } from '@/theme';
import {
  AnswerTile,
  BadgeArt,
  Button,
  Chip,
  ConfettiBurst,
  CountStrip,
  Counter,
  DispatchSlip,
  EquipmentIcon,
  GlyphIcon,
  GrownUpChip,
  HintBubble,
  Logo,
  Modal,
  Panel,
  ProgressBar,
  TaskBar,
  RadioCard,
  RecipeCard,
  ScreenFrame,
  SegmentedPills,
  SparkleBurst,
  StarRow,
  StationBoard,
  SubjectPill,
  Text,
  Toast,
  Toggle,
  Tray,
  TrayRow,
  VocabIcon,
  XpBar,
  badgeIconIds,
  equipmentIds,
  glyphIds,
  vocabIconIds,
  type ButtonSize,
  type ButtonTone,
} from '@/ui';
import {
  CaptainBea,
  CelebrationOverlay,
  CharacterPortrait,
  DialogueOverlay,
  GameCrew,
  Npc,
  Rookie,
  allEmotions,
  npcNames,
  npcVariants,
  type CrewMood,
  type HelmetTone,
  type SkinTone,
} from '@/characters';
import { Confetti, DustPuff, Sparkles, SteamPuffs, WaterDroplets } from '@/world/fx';

/* ------------------------------------------------------------------ */
/* Gallery furniture                                                    */
/* ------------------------------------------------------------------ */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="h1">{title}</Text>
        {subtitle ? (
          <Text variant="small" color={palette.navySoft}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Panel tone="glass" padding="md" radius="panel" style={styles.sectionBody}>
        {children}
      </Panel>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="tiny" color={palette.navyMuted} center>
      {children}
    </Text>
  );
}

function Cell({ label, children, width = 96 }: { label: string; children: React.ReactNode; width?: number }) {
  return (
    <View style={[styles.cell, { width }]}>
      <View style={styles.cellArt}>{children}</View>
      <Label>{label}</Label>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const TONES: ButtonTone[] = ['red', 'green', 'yellow', 'blue', 'white', 'navy', 'purple'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg', 'xl'];
const SUBJECTS: SubjectId[] = Object.keys(subjectColors) as SubjectId[];
const SKINS: SkinTone[] = ['peach', 'tan', 'brown', 'deep'];
const HELMETS: HelmetTone[] = ['red', 'yellow', 'blue', 'pink'];
const PORTRAIT_IDS: CharacterId[] = ['rookie', 'bea', 'npc'];

const DEMO_LINES: DialogueLine[] = [
  { speaker: 'bea', text: 'Rookie! The bakery bell is stuck and Rosa needs a hand.', emotion: 'calm' },
  { speaker: 'bea', text: 'I counted six loaves in the window!', es: '¡Conté seis panes en la ventana!', emotion: 'excited' },
  { speaker: 'npc', npcName: 'Rosa', text: 'Thank you for coming so fast!', es: '¡Gracias por venir tan rápido!', emotion: 'happy' },
  { speaker: 'rookie', text: 'Found the ladder! It was behind the crates.', emotion: 'excited' },
];

/**
 * Sections, so each can be screenshotted on its own:
 *   /dev/kit?section=characters | icons | badges | fx | ui
 * No `section` (or `all`) shows the whole gallery.
 */
type SectionName = 'characters' | 'icons' | 'badges' | 'fx' | 'ui';
const CREW_MOODS: CrewMood[] = ['idle', 'think', 'happy', 'cheer'];

export default function KitGallery() {
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const only = typeof section === 'string' && section !== 'all' ? section : null;
  const show = (s: SectionName) => !only || only === s;

  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [toggle, setToggle] = useState(true);
  const [band, setBand] = useState<'A' | 'B' | 'C'>('B');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [dialogue, setDialogue] = useState(-1);
  const [celebrate, setCelebrate] = useState(false);
  const [hint, setHint] = useState(false);
  const [fxPlay, setFxPlay] = useState(1);

  /* Dev-only: replay the one-shot bursts on a loop so a still screenshot of
     this section actually shows them. */
  useEffect(() => {
    if (only && only !== 'fx') return;
    const t = setInterval(() => setFxPlay((n) => n + 1), 650);
    return () => clearInterval(t);
  }, [only]);

  const line = DEMO_LINES[dialogue];

  return (
    <ScreenFrame safeTop={false} safeBottom={false}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 140 }]}>
        <View style={styles.header}>
          <Logo size={260} />
          <Text variant="h3" center color={palette.navySoft}>
            {only ? `${only} sheet` : 'UI kit & character gallery'}
          </Text>
        </View>

        {/* ---------------- characters ---------------- */}
        {show('characters') ? (
          <>
        <Section title="Emotions" subtitle="Tap an emotion — every rig below switches to it.">
          <View style={styles.row}>
            {allEmotions.map((e) => (
              <Button key={e} label={e} size="sm" tone={e === emotion ? 'red' : 'white'} onPress={() => setEmotion(e)} sound="tap-soft" />
            ))}
          </View>
        </Section>

        <Section title="Rookie" subtitle="poses · avatar options">
          <View style={styles.row}>
            {(['wave', 'stand', 'cheer', 'point'] as const).map((pose) => (
              <Cell key={pose} label={pose} width={120}>
                <Rookie size={168} pose={pose} emotion={emotion} />
              </Cell>
            ))}
          </View>
          <View style={styles.row}>
            {SKINS.map((skin, i) => (
              <Cell key={skin} label={skin} width={110}>
                <Rookie size={150} pose="stand" emotion={emotion} avatar={{ skin, helmet: HELMETS[i % HELMETS.length] }} bobPhase={i * 0.7} />
              </Cell>
            ))}
          </View>
          <View style={styles.row}>
            {(['dark', 'brown', 'blonde', 'red', 'black-curly'] as const).map((hair, i) => (
              <Cell key={hair} label={hair} width={104}>
                <Rookie size={140} pose="stand" emotion={emotion} avatar={{ hair }} bobPhase={i * 0.5} />
              </Cell>
            ))}
          </View>
        </Section>

        <Section title="Captain Bea" subtitle="every mood — see /dev/cast for poses">
          <View style={styles.row}>
            {allEmotions.map((e, i) => (
              <Cell key={e} label={e} width={116}>
                <CaptainBea size={130} emotion={e} bobPhase={i * 0.3} />
              </Cell>
            ))}
          </View>
        </Section>

        <Section title="Captain Bea &amp; the neighbours">
          <View style={styles.row}>
            <Cell label="Captain Bea" width={120}>
              <CaptainBea size={172} emotion={emotion} />
            </Cell>
            {npcVariants.map((v, i) => (
              <Cell key={v} label={npcNames[v]} width={v === 'twins' ? 190 : 120}>
                <Npc variant={v} size={166} emotion={emotion} bobPhase={i * 0.6} />
              </Cell>
            ))}
          </View>
        </Section>

        <Section title="Portraits" subtitle="circle-cropped busts — the real rigs, still blinking">
          <View style={styles.row}>
            {PORTRAIT_IDS.map((id) => (
              <Cell key={id} label={id} width={92}>
                <CharacterPortrait id={id} emotion={emotion} size={80} />
              </Cell>
            ))}
            {npcVariants.map((v) => (
              <Cell key={v} label={v} width={92}>
                <CharacterPortrait id="npc" npc={v} emotion={emotion} size={80} />
              </Cell>
            ))}
          </View>
          <View style={styles.row}>
            {allEmotions.map((e) => (
              <Cell key={e} label={e} width={84}>
                <CharacterPortrait id="rookie" emotion={e} size={72} />
              </Cell>
            ))}
          </View>
        </Section>

        <Section title="Game crew" subtitle="the resident cast for every mini-game — idle · think · happy · cheer">
          <View style={styles.row}>
            {CREW_MOODS.map((m) => (
              <View key={m} style={styles.crewCell}>
                <GameCrew mood={m} npc={m === 'cheer' ? 'rosa' : undefined} size={72} style={styles.crewPos} />
                <Label>{m}</Label>
              </View>
            ))}
          </View>
        </Section>
          </>
        ) : null}

        {/* ---------------- art sheets ---------------- */}
        {show('badges') ? (
        <Section title="Badges" subtitle={`${badgeIconIds.length} icons · locked state`}>
          <View style={styles.row}>
            {badgeIconIds.map((icon, i) => (
              <Cell key={icon} label={icon} width={88}>
                <BadgeArt icon={icon} color={[palette.engineRed, palette.safetyYellow, palette.waterCyan, palette.leafGreen, palette.purple, palette.orange, palette.pink][i % 7]} size={70} />
              </Cell>
            ))}
            <Cell label="locked" width={88}>
              <BadgeArt icon="star" locked size={70} />
            </Cell>
          </View>
          <Text variant="tiny" color={palette.navyMuted}>
            From @/content/badges:
          </Text>
          <View style={styles.row}>
            {badges.map((b) => (
              <Cell key={b.id} label={b.name} width={92}>
                <BadgeArt icon={b.icon} color={b.color} size={72} />
              </Cell>
            ))}
          </View>
        </Section>
        ) : null}

        {show('icons') ? (
          <>
        <Section title="Glyphs" subtitle={`${glyphIds.length} drawn UI marks — the emoji replacements`}>
          <View style={styles.row}>
            {glyphIds.map((id) => (
              <Cell key={id} label={id} width={72}>
                <GlyphIcon id={id} size={40} />
              </Cell>
            ))}
            <Cell label="muted" width={72}>
              <GlyphIcon id="star" size={40} muted />
            </Cell>
          </View>
          <Text variant="tiny" color={palette.navyMuted}>
            The seven subject marks are authored white-forward — here they are on their own pills:
          </Text>
          <View style={styles.row}>
            {SUBJECTS.map((s2) => (
              <View key={s2} style={[styles.subjectSwatch, { backgroundColor: subjectColors[s2].bg }]}>
                <GlyphIcon id={s2} size={34} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Equipment" subtitle="12 pieces of gear · solid + ghost slot">
          <View style={styles.row}>
            {equipmentIds.map((id: EquipmentId) => (
              <Cell key={id} label={id} width={88}>
                <EquipmentIcon id={id} size={68} shadow />
              </Cell>
            ))}
          </View>
          <View style={[styles.row, styles.ghostRow]}>
            {equipmentIds.map((id: EquipmentId) => (
              <View key={id} style={styles.ghostCell}>
                <EquipmentIcon id={id} size={60} ghost />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Vocabulary" subtitle={`${vocabIconIds.length} words + the unknown-id fallback`}>
          <View style={styles.row}>
            {vocabIconIds.map((id) => (
              <Cell key={id} label={id} width={76}>
                <VocabIcon id={id} size={56} />
              </Cell>
            ))}
            <Cell label="???" width={76}>
              <VocabIcon id="not-a-real-word" size={56} />
            </Cell>
          </View>
          <Text variant="tiny" color={palette.navyMuted}>
            Contrast check — the same icons on a white tile:
          </Text>
          <View style={[styles.row, styles.whiteRow]}>
            {(['sugar', 'egg', 'milk', 'flour', 'cloud', 'bunny', 'rain', 'sheep', 'rice', 'salt'] as const).map((id) => (
              <Cell key={id} label={id} width={72}>
                <VocabIcon id={id} size={56} />
              </Cell>
            ))}
          </View>
        </Section>
          </>
        ) : null}

        {/* ---------------- particle FX ---------------- */}
        {show('fx') ? (
        <Section title="Particle FX" subtitle="from @/world/fx — steam and water loop, the rest fire on trigger">
          <View style={styles.row}>
            <Button label="Fire all" tone="blue" size="md" onPress={() => setFxPlay((n) => n + 1)} />
          </View>
          <View style={styles.fxRow}>
            <View style={styles.fxCell}>
              <SteamPuffs x={56} y={100} count={6} />
              <Text variant="tiny" color={palette.white} center>
                SteamPuffs
              </Text>
            </View>
            <View style={styles.fxCell}>
              <WaterDroplets x={56} y={78} radius={40} count={12} />
              <Text variant="tiny" color={palette.white} center>
                WaterDroplets
              </Text>
            </View>
            <View style={styles.fxCell}>
              <Sparkles x={56} y={60} trigger={fxPlay} />
              <Text variant="tiny" color={palette.white} center>
                Sparkles
              </Text>
            </View>
            <View style={styles.fxCell}>
              <DustPuff x={56} y={96} trigger={fxPlay} />
              <Text variant="tiny" color={palette.white} center>
                DustPuff
              </Text>
            </View>
            <View style={styles.fxCell}>
              <Confetti trigger={fxPlay} width={112} height={120} count={18} />
              <Text variant="tiny" color={palette.white} center>
                Confetti
              </Text>
            </View>
          </View>
        </Section>
        ) : null}

        {/* ---------------- primitives ---------------- */}
        {show('ui') ? (
          <>
        <Section title="Buttons" subtitle="every tone · every size · glow CTA">
          <View style={styles.row}>
            {TONES.map((tone) => (
              <Button key={tone} label={tone} tone={tone} size="md" />
            ))}
          </View>
          <View style={styles.row}>
            {SIZES.map((size) => (
              <Button key={size} label={`Start Shift ${size}`} size={size} />
            ))}
          </View>
          <View style={styles.glowRow}>
            <Button label="Start Shift" size="xl" glow />
          </View>
          <View style={styles.row}>
            <Button label="Disabled" tone="green" disabled />
            <Button label="Block" tone="blue" block style={styles.blockBtn} />
          </View>
        </Section>

        <Section title="Pills, chips &amp; stars">
          <View style={styles.row}>
            {SUBJECTS.map((s) => (
              <SubjectPill key={s} subject={s} />
            ))}
          </View>
          <View style={styles.row}>
            {SUBJECTS.map((s) => (
              <SubjectPill key={s} subject={s} small />
            ))}
          </View>
          <View style={styles.row}>
            <Chip label="Level 2" />
            <Chip label="x3" tone="navy" />
            <Chip label="Done" tone="green" />
            <Chip label="Español" tone="purple" />
            <GrownUpChip />
          </View>
          <View style={styles.row}>
            {([0, 1, 2, 3] as const).map((n) => (
              <StarRow key={n} stars={n} size={34} />
            ))}
          </View>
        </Section>

        <Section title="Progress">
          <ProgressBar value={0.35} />
          <ProgressBar value={0.72} color={palette.waterCyan} />
          <ProgressBar value={1} color={palette.safetyYellow} />
          <XpBar value={120} max={200} label="Level 4" />
          <View style={styles.row}>
            <Counter value={12} suffix=" missions" variant="numeral" />
            <Counter value={340} prefix="+" suffix=" XP" variant="numeral" color={palette.goldDark} />
            <Counter value={26} prefix="+" variant="numeral" color={palette.purple} />
          </View>
        </Section>

        <Section title="Controls">
          <Toggle value={toggle} onChange={setToggle} label="Sound effects" hint="Bells, water and cheers" />
          <Toggle value={!toggle} onChange={(v) => setToggle(!v)} label="Reduce motion" hint="Calmer animations" />
          <SegmentedPills
            options={[
              { id: 'A', label: '5–6', hint: 'Cadet' },
              { id: 'B', label: '7–8', hint: 'Crew' },
              { id: 'C', label: '9–10', hint: 'Leader' },
            ]}
            value={band}
            onChange={setBand}
          />
        </Section>

        <Section title="Mission cards">
          <DispatchSlip
            title="Bakery Bell"
            tagline="Help the bakery get ready for the big festival!"
            subjects={['math', 'reading']}
            stars={2}
            meta="8 min"
            thumbnail={<VocabIcon id="bakery" size={78} />}
            onPress={() => setToast(true)}
            index={0}
          />
          <DispatchSlip
            title="Park Rescue"
            tagline="A kitten needs help at the park!"
            subjects={['logic', 'reading']}
            thumbnail={<VocabIcon id="cat" size={72} />}
            onPress={() => setToast(true)}
            index={1}
          />
          <DispatchSlip title="Clock Tower Cat" tagline="Luna is stuck up high." subjects={['math', 'teamwork']} locked lockedHint="Finish Bakery Bell first" index={2} />
        </Section>

        <Section title="Recipe cards &amp; boards">
          <RecipeCard
            title="Pancakes"
            titleEs="Panqueques"
            blurb="Measure, pour and flip — halves and quarters you can eat."
            subjects={['math', 'cooking']}
            art={<VocabIcon id="milk" size={56} />}
            meta="Cooked 3 times"
            cooked
            onPress={() => setModal(true)}
          />
          <RecipeCard title="Firehouse Pizza" titleEs="Pizza del Cuartel" blurb="Half cheese, half veggie. Cut it fairly!" subjects={['math', 'cooking', 'spanish']} art={<VocabIcon id="pizza" size={56} />} resting onPress={() => undefined} index={1} />
          <StationBoard title="Your Badges" meta="3 of 12 earned">
            {badges.slice(0, 8).map((b, i) => (
              <View key={b.id} style={styles.boardTile}>
                <BadgeArt icon={b.icon} color={b.color} size={62} locked={i > 2} />
                <Label>{b.name}</Label>
              </View>
            ))}
          </StationBoard>
        </Section>

        <Section title="Mini-game furniture">
          {/* the one instruction area every activity shares */}
          <TaskBar
            task="Put Out 6 Flames!"
            detail="Aim the hose and hold to spray."
            es="¡Apaga 6 llamas!"
            progress={{ done: 2, total: 5 }}
          />
          <CountStrip current={3} total={6} icon="flame" invert label="flames out" />
          <View style={styles.row}>
            <AnswerTile label="18" index={0} />
            <AnswerTile label="12" state="correct" index={1} />
            <AnswerTile label="9" state="wrong" index={2} />
            <AnswerTile label="24" state="highlight" index={3} />
            <AnswerTile label="7" state="disabled" index={4} />
          </View>
          <RadioCard es="¡Hola! Necesito ayuda." en="Hello! I need help." from="Rosa" />
          <RadioCard es="El agua está aquí." en="The water is here." support="min" from="Captain Bea" />
        </Section>

        <Section title="Effects &amp; overlays" subtitle="tap to fire">
          <View style={styles.row}>
            <View style={styles.fxBox}>
              <Button label="Sparkle" tone="yellow" size="md" onPress={() => setSparkle((n) => n + 1)} />
              <SparkleBurst play={sparkle} radius={52} />
            </View>
            <Button label="Confetti" tone="purple" size="md" onPress={() => setConfetti((n) => n + 1)} />
            <Button label="Toast" tone="blue" size="md" onPress={() => setToast(true)} />
            <Button label="Modal" tone="navy" size="md" onPress={() => setModal(true)} />
            <Button label="Hint bubble" tone="white" size="md" onPress={() => setHint((v) => !v)} />
            <Button label="Dialogue" tone="green" size="md" onPress={() => setDialogue(0)} />
            <Button label="Celebration" tone="red" size="md" onPress={() => setCelebrate(true)} />
          </View>
        </Section>

        <Section title="Tray">
          <Tray tone="cream" style={styles.trayDemo}>
            <TrayRow>
              <EquipmentIcon id="hose" size={64} />
              <EquipmentIcon id="cone" size={64} />
              <EquipmentIcon id="first-aid" size={64} />
              <Button label="Done" tone="green" size="md" />
            </TrayRow>
          </Tray>
        </Section>
          </>
        ) : null}
      </ScrollView>

      {/* overlays */}
      <ConfettiBurst play={confetti} />
      <HintBubble visible={hint} text="Count the flames that are still lit." es="Cuenta las llamas encendidas." onDismiss={() => setHint(false)} />
      <Toast visible={toast} message="Badge earned!" detail="Bakery Bell" tone="gold" icon={<BadgeArt icon="bread" color={palette.wood} size={34} />} onHide={() => setToast(false)} />
      <Modal visible={modal} onClose={() => setModal(false)} title="Pancakes" subtitle="Serves 4 hungry firefighters" ctaLabel="Let's cook!" onCta={() => setModal(false)}>
        <View style={styles.row}>
          <VocabIcon id="flour" size={56} />
          <VocabIcon id="egg" size={56} />
          <VocabIcon id="milk" size={56} />
          <VocabIcon id="butter" size={56} />
        </View>
        <Text variant="body">Measure each ingredient, then pour it into the big blue bowl.</Text>
      </Modal>
      {line ? (
        <DialogueOverlay
          line={line}
          index={dialogue}
          total={DEMO_LINES.length}
          onNext={() => setDialogue((i) => (i + 1 < DEMO_LINES.length ? i + 1 : -1))}
          onSkip={() => setDialogue(-1)}
        />
      ) : null}
      <CelebrationOverlay
        visible={celebrate}
        title="Mission Complete!"
        subtitle="Rosa opened right on time."
        stars={3}
        badge="bakery-bell"
        xp={40}
        sparks={12}
        subjects={['math', 'reading', 'spanish', 'teamwork']}
        ctaLabel="Back to the station"
        onNext={() => setCelebrate(false)}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.xs },
  sectionHead: { gap: 0, paddingLeft: 4 },
  sectionBody: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'flex-end' },
  cell: { alignItems: 'center', gap: 2 },
  cellArt: { alignItems: 'center', justifyContent: 'flex-end', minHeight: 60 },
  ghostRow: { backgroundColor: palette.charcoal, borderRadius: radii.tile, padding: spacing.sm },
  ghostCell: { padding: 4 },
  boardTile: { width: 82, alignItems: 'center', gap: 2 },
  subjectSwatch: { width: 52, height: 52, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  crewCell: { width: 190, height: 132, alignItems: 'center', justifyContent: 'flex-end' },
  crewPos: { position: 'absolute', left: 0, bottom: 18 },
  whiteRow: { backgroundColor: palette.white, borderRadius: radii.tile, padding: spacing.sm },
  fxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fxCell: {
    width: 112,
    height: 138,
    backgroundColor: '#5E6B99',
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    overflow: 'hidden',
  },
  glowRow: { alignItems: 'center', paddingVertical: spacing.sm },
  blockBtn: { flexGrow: 1, minWidth: 200 },
  fxBox: { alignItems: 'center', justifyContent: 'center' },
  trayDemo: { ...shadows.card, borderRadius: radii.panel },
});
