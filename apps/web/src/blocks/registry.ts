/**
 * Block registry - aligns with mobile app. Body Signals + Work Routine active.
 * Icons: Iconify Solar set (see docs/design-system.md).
 */
export type BlockStatus = 'active' | 'comingSoon';

export type Block = {
  id: string;
  name: string;
  description: string;
  status: BlockStatus;
  icon: string; // Iconify icon name, e.g. solar:heart-pulse-linear
  color: string; // Hex for block accent, e.g. #f472b6
  route?: string;
};

export const BLOCKS: Block[] = [
  {
    id: 'body-signals',
    name: 'Body Signals',
    description: 'Weight, sleep, energy & mood trends',
    status: 'active',
    icon: 'solar:heart-pulse-linear',
    color: '#f472b6',
    route: 'BodySignalsOverview',
  },
  {
    id: 'work-routine',
    name: 'Work Routine',
    description: 'Daily check-ins & focus insights',
    status: 'active',
    icon: 'solar:laptop-linear',
    color: '#818cf8',
    route: 'WorkRoutineOverview',
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Fridge, meals & weekly suggestions',
    status: 'active',
    icon: 'solar:leaf-linear',
    color: '#4ade80',
    route: 'NutritionOverview',
  },
  {
    id: 'movement',
    name: 'Movement',
    description: 'Activity & readiness-based tips',
    status: 'comingSoon',
    icon: 'solar:running-linear',
    color: '#fb923c',
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Rest & restoration trends',
    status: 'comingSoon',
    icon: 'solar:moon-stars-linear',
    color: '#c084fc',
  },
];

export const getBlockById = (id: string) => BLOCKS.find((b) => b.id === id);
