// RJ-APP/lib/archetypes.ts
import curious from '@/assets/archetypes/curious.png';
import grounded from '@/assets/archetypes/grounded.png';
import intellectual from '@/assets/archetypes/intellectual.png';
import magnetic from '@/assets/archetypes/magnetic.png';
import playful from '@/assets/archetypes/playful.png';
import romantic from '@/assets/archetypes/romantic.png';
import slow from '@/assets/archetypes/slow.png';

export type ArchetypeId = 'curious' | 'grounded' | 'intellectual' | 'magnetic' | 'playful' | 'romantic' | 'slow';

export type Archetype = {
  id: ArchetypeId;
  name: string;
  sub: string;
  image: number;
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  curious:      { id: 'curious',      name: 'The Curious Explorer',       sub: 'restless, generous, alive to the new',           image: curious },
  grounded:     { id: 'grounded',     name: 'The Grounded Builder',       sub: 'patient, devoted, quietly capable',              image: grounded },
  intellectual: { id: 'intellectual', name: 'The Intellectual Connector', sub: 'sharp, attentive, a finder of patterns',         image: intellectual },
  magnetic:     { id: 'magnetic',     name: 'The Magnetic Force',         sub: 'present, electric, hard to look away from',      image: magnetic },
  playful:      { id: 'playful',      name: 'The Playful Spark',          sub: 'light, mischievous, unafraid of joy',            image: playful },
  romantic:     { id: 'romantic',     name: 'The Romantic Idealist',      sub: 'tender, attentive, a believer in the beautiful', image: romantic },
  slow:         { id: 'slow',         name: 'The Slow Burner',            sub: 'considered, deep-rooted, late to bloom',         image: slow },
};

export const ARCHETYPE_LIST = Object.values(ARCHETYPES);
