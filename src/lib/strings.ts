/**
 * UI string constants — all user-visible text lives here.
 * Prep for Phase 3 i18n: swap this module for translation JSON files later.
 */

export const S = {
  app: {
    name: 'DuelList',
    tagline: 'Rank anything — one duel at a time.',
  },

  home: {
    emptyTitle: 'No lists yet',
    emptyDescription: 'Create one or import a markdown file.',
    createList: 'Create list',
    importList: 'Import list',
  },

  welcome: {
    heading: 'Welcome to DuelList',
    description:
      'Rank your favourites through quick A-vs-B comparisons. Create a list, add items, and start duelling.',
    getStarted: 'Get started',
    trySample: 'Try a sample list',
  },

  duel: {
    skipLabel: 'Skip (tie)',
    sessionComplete: 'Session complete!',
    needTwoItems: 'Add at least 2 items to start duelling.',
  },

  ranking: {
    addItemsPrompt: 'Add some items to get started.',
    startComparing: 'Start comparing to see rankings change.',
  },

  list: {
    deleteConfirm: 'Are you sure you want to delete this list?',
    noItems: 'No items yet. Add some to get started.',
  },

  settings: {
    title: 'Settings',
    kFactorLabel: 'Ranking sensitivity',
    kFactorQuick: 'Quick (K=48)',
    kFactorGradual: 'Gradual (K=32)',
    kFactorTight: 'Tight (K=16)',
    sessionLengthLabel: 'Session length',
  },

  export: {
    exportList: 'Export list',
    exportHistory: 'Export history',
    exportAll: 'Export all lists',
  },
} as const;
