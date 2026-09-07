import { missions } from '@/content/missions';
import { recipes } from '@/content/recipes';
import { challengeSkills } from '@/learning/types';
import type { AgeBand, ChallengeKind, SkillTag } from '@/learning/types';
import { beatsForBand } from '@/machines/missionMachine';

const BANDS: AgeBand[] = ['A', 'B', 'C'];

describe('coverage report', () => {
  it('prints', () => {
    const gameUse = new Map<string, string[]>();
    for (const m of missions) {
      for (const b of m.beats) if (b.type === 'minigame') gameUse.set(b.game, [...(gameUse.get(b.game) ?? []), m.id]);
    }
    const allKinds = Object.keys(challengeSkills) as ChallengeKind[];
    console.log('--- games by mission count ---');
    for (const k of allKinds) console.log(`${k}: ${(gameUse.get(k) ?? []).length}  ${(gameUse.get(k) ?? []).join(', ')}`);

    console.log('--- recipes by game ---');
    const rUse = new Map<string, string[]>();
    for (const r of recipes) for (const s of r.steps) rUse.set(s.game, [...(rUse.get(s.game) ?? []), r.id]);
    for (const [k, v] of rUse) console.log(`${k}: ${v.length} ${v.join(', ')}`);

    console.log('--- skills per band (mission beats only) ---');
    for (const band of BANDS) {
      const skills = new Map<SkillTag, number>();
      for (const m of missions) {
        for (const b of beatsForBand(m, band)) {
          if (b.type !== 'minigame') continue;
          for (const s of challengeSkills[b.game]) skills.set(s, (skills.get(s) ?? 0) + 1);
        }
      }
      const all = new Set(Object.values(challengeSkills).flat());
      const missing = [...all].filter((s) => !skills.has(s));
      console.log(`band ${band}: ` + [...skills.entries()].sort((a,b)=>b[1]-a[1]).map(([s,n])=>`${s}=${n}`).join(' '));
      console.log(`band ${band} MISSING: ${missing.join(', ')}`);
    }
    console.log('--- locations ---');
    const byLoc = new Map<string, string[]>();
    for (const m of missions) byLoc.set(m.location, [...(byLoc.get(m.location) ?? []), m.id]);
    for (const [l, v] of byLoc) console.log(`${l}: ${v.join(', ')}`);
    console.log('--- scenes ---');
    const byScene = new Map<string, string[]>();
    for (const m of missions) byScene.set(m.scene, [...(byScene.get(m.scene) ?? []), m.id]);
    for (const [l, v] of byScene) console.log(`${l}: ${v.join(', ')}`);
    console.log('--- economy ---');
    console.log('xp tour', missions.reduce((s,m)=>s+m.xp,0), 'sparks tour', missions.reduce((s,m)=>s+m.sparks,0), 'recipe xp', recipes.reduce((s,r)=>s+r.xp,0));
    console.log('--- requires ---');
    for (const m of missions) console.log(`${m.id} <- ${(m.requires ?? []).join('+') || '(open)'}  [${m.location}/${m.scene}] badge=${m.badge} xp=${m.xp} sp=${m.sparks} subj=${m.subjects.join(',')}`);
    expect(true).toBe(true);
  });
});
