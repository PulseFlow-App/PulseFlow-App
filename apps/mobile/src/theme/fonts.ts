/**
 * Pulse app — Inter (sans) + PT Serif (serif), matching the provided design.
 * Use these after fonts are loaded in App.tsx.
 */
export const fonts = {
  /** Body, labels, descriptions — Inter */
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  /** Titles, hero, card titles, tagline — PT Serif */
  serif: 'PTSerif_400Regular',
  serifBold: 'PTSerif_700Bold',
  serifItalic: 'PTSerif_400Regular_Italic',
} as const;
