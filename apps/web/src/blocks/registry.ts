/**
 * Block registry - aligns with mobile app. Body Signals + Work Routine active.
 */
export type BlockStatus = 'active' | 'comingSoon';

export type Block = {
  id: string;
  name: string;
  description: string;
  status: BlockStatus;
  icon: string;
  route?: string;
};

export const BLOCKS: Block[] = [
  {
    id: 'body-signals',
    name: 'Body Signals',
    description: 'Weight, sleep, energy & mood trends',
    status: 'active',
    icon: '💓',
    route: 'BodySignalsOverview',
  },
  {
    id: 'work-routine',
    name: 'Work Routine',
    description: 'Daily check-ins & focus insights',
    status: 'active',
    icon: '💼',
    route: 'WorkRoutineOverview',
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Fridge, meals & weekly suggestions',
    status: 'comingSoon',
    icon: '🥗',
  },
  {
    id: 'movement',
    name: 'Movement',
    description: 'Activity & readiness-based tips',
    status: 'comingSoon',
    icon: '🏃',
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Rest & restoration trends',
    status: 'comingSoon',
    icon: '🌙',
  },
];

export const getBlockById = (id: string) => BLOCKS.find((b) => b.id === id);
