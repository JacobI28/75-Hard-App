export const Colors = {
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  border: '#30363D',

  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',

  accent: '#2EA44F',
  accentBlue: '#388BFD',
  accentWarning: '#D29922',
  danger: '#F85149',

  taskDiet: '#388BFD',
  taskWorkout1: '#2EA44F',
  taskOutdoor: '#3FB950',
  taskWater: '#58A6FF',
  taskReading: '#D2A8FF',
  taskPhoto: '#FFA657',

  taskComplete: '#2EA44F',
  taskIncomplete: '#30363D',

  heatmap0: '#161B22',
  heatmap1: '#0E4429',
  heatmap2: '#006D32',
  heatmap3: '#26A641',
  heatmap4: '#39D353',
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 72,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const Layout = {
  screenPaddingHorizontal: 20,
  screenPaddingTop: 16,
  tabBarHeight: 83,
};

export const TASK_COLORS: Record<string, string> = {
  diet: Colors.taskDiet,
  workout1: Colors.taskWorkout1,
  workout2Outdoor: Colors.taskOutdoor,
  water: Colors.taskWater,
  reading: Colors.taskReading,
  photo: Colors.taskPhoto,
};
