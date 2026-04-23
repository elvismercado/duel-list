/**
 * UI string constants — all user-visible text lives here.
 * Prep for Phase 3 i18n: swap this module for translation JSON files later.
 */

export const S = {
  app: {
    name: 'DuelList',
    tagline: 'Rank anything — one duel at a time.',
    storageAlmostFull:
      'Storage is almost full. Export your lists to free up space.',
    appSettingsAria: 'App settings',
    goBackAria: 'Go back',
  },

  common: {
    listNotFound: 'List not found',
    pageNotFound: 'Page not found',
    pageNotFoundDescription: "The page you're looking for doesn't exist.",
    goHome: 'Go home',
    goToHome: 'Go to home',
    back: 'Back',
    backToList: 'Back to list',
    backAria: 'Back',
    export: 'Export',
    clear: 'Clear',
    clearFilter: 'Clear filter',
    cancel: 'Cancel',
    add: 'Add',
    next: 'Next',
    create: 'Create',
    delete: 'Delete',
    remove: 'Remove',
    save: 'Save',
    confirmRename: 'Confirm rename',
    saveName: 'Save name',
    editName: 'Edit name',
  },

  home: {
    emptyTitle: 'No lists yet',
    emptyDescription: 'Create one or import a markdown file.',
    createList: 'Create list',
    importList: 'Import list',
    openFile: 'Open file',
    open: 'Open',
    new: 'New',
    reorder: 'Reorder',
    done: 'Done',
    sortBy: 'Sort by',
    sortRecent: 'Recent',
    sortAZ: 'A–Z',
    sortCreated: 'Created',
    sortCustom: 'Custom',
  },

  welcome: {
    heading: 'Welcome to DuelList',
    description:
      'Rank your favourites through quick A-vs-B comparisons. Create a list, add items, and start duelling.',
    getStarted: 'Get started',
    trySample: 'Try a sample list',
    skipTour: 'Skip tour',
    seeAllFeatures: 'See all features',
    stepAria: (n: number) => `Step ${n}`,
    duelStepTitle: 'The Duel',
    duelStepDescription:
      'Two items appear side by side. Pick the winner, declare a tie, or skip.',
    rankingStepTitle: 'Your Ranking Builds Itself',
    rankingStepDescription:
      'After each duel, your list re-ranks automatically. The more duels you do, the more accurate it gets.',
    sessionsStepTitle: 'Quick Sessions',
    sessionsStepDescription: "Do 5–10 duels a day. It's a habit, not a chore.",
    readyStepTitle: 'Ready!',
    readyStepDescription: 'Create a list or try a sample to get started.',
  },

  duel: {
    skipLabel: 'Skip (tie)',
    sessionComplete: 'Session complete!',
    needTwoItems: 'Add at least 2 items to start duelling.',
    tie: 'Tie',
    skip: 'Skip',
    duelsCompleted: (n: number) => `${n} duels completed`,
    currentTop3: 'Current Top 3',
    biggestMovers: 'Biggest Movers',
    rankings: 'Rankings',
    newSession: 'New session',
    noMorePairs: 'No more pairs available',
    backToRankings: 'Back to rankings',
    keyboardHint: '← / → to pick · T for tie · S to skip',
    swipeUpToPick: 'Swipe up to pick',
    swipeHelpText: 'Swipe up or tap to pick · ← / → keys work too',
    pickAria: (name: string) => `Pick ${name}`,
    pickBadge: 'PICK',
    eloSuffix: (n: number) => `${n} ELO`,
  },

  ranking: {
    addItemsPrompt: 'Add some items to get started.',
    startComparing: 'Start comparing to see rankings change.',
    startDuel: 'Start duelling',
    rank: 'Rank',
    elo: 'ELO',
    rankTooltip: 'Rank',
    eloTooltip: 'ELO score',
    duelsPlayed: (n: number) => `${n} ${n === 1 ? 'duel' : 'duels'} played`,
    switchToRank: 'Switch to rank display',
    switchToElo: 'Switch to ELO display',
    addItems: 'Add items',
    historyAria: 'Duel history',
    addItemsAria: 'Add items',
    settingsAria: 'List settings',
    fileLinked: 'File linked',
    fileLinkedTooltip: 'File linked',
    fileLinkBroken: 'File link broken',
    fileLinkBrokenTooltip: 'File link broken — re-link in settings',
    fileNotLinked: 'Not linked to a file',
    fileNotLinkedTooltip:
      'Not linked to a file — changes are stored locally',
    optionsAria: (name: string) => `Options for ${name}`,
    renameAria: (name: string) => `Rename ${name}`,
    renameAction: 'Rename',
    removeAction: 'Remove',
    removeItemTitle: 'Remove item',
    removeItemMessage: (name: string) =>
      `Remove "${name}" from the ranking? You can restore it later.`,
    topItemPrefix: (name: string) => `#1 ${name}`,
    itemsCount: (n: number) => `${n} items`,
  },

  list: {
    deleteConfirm: 'Are you sure you want to delete this list?',
    noItems: 'No items yet. Add some to get started.',
    name: 'Name',
    addItemsTitle: 'Add items',
    addItemsHelp: 'One item per line',
    addItemsPlaceholder: 'Naruto\nOne Piece\nAttack on Titan',
    namePlaceholder: 'My Top Anime',
    startFromTemplate: 'Start from a template (optional)',
    templateItemsAdded: (n: number) => `${n} items will be added.`,
    neverOpened: 'Never opened',
    justNow: 'Just now',
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    yesterday: 'Yesterday',
    daysAgo: (n: number) => `${n}d ago`,
    draggableAria: (name: string) => `${name}, draggable`,
    dragAria: (name: string) => `Drag ${name}`,
    moveUpAria: (name: string) => `Move ${name} up`,
    moveDownAria: (name: string) => `Move ${name} down`,
  },

  history: {
    title: 'Duel history',
    emptyDescription: 'No duels yet. Play a session to start building history.',
    startDuel: 'Start a duel',
    statTotal: 'Total duels',
    statTies: 'Ties',
    statTopWinner: 'Top winner',
    statBiggestRivalry: 'Biggest rivalry',
    sparklineRangeLabel: 'Last 30 days',
    sparklineAria: 'Duels per day, last 30 days',
    filterPlaceholder: 'Filter by name…',
    filterAria: 'Filter duels by name',
    noMatch: (query: string) => `No duels match “${query}”.`,
    showingOf: (shown: number, total: number) =>
      `Showing ${shown} of ${total} ${total === 1 ? 'duel' : 'duels'}.`,
    totalDuels: (n: number) =>
      `${n} ${n === 1 ? 'duel' : 'duels'}`,
    winsCount: (n: number) => `${n} ${n === 1 ? 'win' : 'wins'}`,
    meetingsCount: (n: number) =>
      `${n} ${n === 1 ? 'meeting' : 'meetings'}`,
    sparklineDay: (date: string, n: number) =>
      `${date}: ${n} ${n === 1 ? 'duel' : 'duels'}`,
    vsBadge: 'VS',
    tieBadge: 'TIE',
    versusAria: 'versus',
    tieAria: 'Tie',
    winnerAria: 'Winner',
    exportHistoryAria: 'Export history',
  },

  settings: {
    title: 'Settings',
    kFactorLabel: 'Ranking sensitivity',
    kFactorQuick: 'Quick (K=48)',
    kFactorGradual: 'Gradual (K=32)',
    kFactorTight: 'Tight (K=16)',
    sessionLengthLabel: 'Session length',
    sessionLengthUnit: 'duels',
    sessionLengthUnlimited: 'Unlimited',
    themeLabel: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    duelModeLabel: 'Duel mode',
    duelModeSideBySide: 'Side-by-side cards',
    duelModeSwipe: 'Swipe',
    duelModeHelp:
      'Swipe mode shows both items side by side — drag a card up to pick it.',
    aboutHeading: 'About',
    whatsInDuelList: "What's in DuelList",
    replayOnboarding: 'Replay onboarding',
    exportHeading: 'Export',
    storageHeading: 'Storage',
    storageUsage: (usedKb: number, limitMb: number) =>
      `${usedKb.toFixed(1)} KB used of ~${limitMb.toFixed(0)} MB`,
    fileSyncHeading: 'File sync',
    fileSyncLinked: 'Linked — changes sync to file automatically.',
    fileSyncLost: 'File sync lost — permission denied. Re-link to restore.',
    unlinkFile: 'Unlink file',
    linkFile: 'Link to file',
    removedItemsButton: (n: number) => `Removed items (${n})`,
    removedItemsTitle: 'Removed items',
    noRemovedItems: 'No removed items.',
    restoreAria: (name: string) => `Restore ${name}`,
    dangerZone: 'Danger zone',
    deleteList: 'Delete list',
    deleteListConfirm: (name: string) =>
      `Permanently delete "${name}" and all its history? This cannot be undone.`,
  },

  export: {
    exportList: 'Export list',
    exportHistory: 'Export history',
    exportAll: 'Export all lists',
    listButton: 'List (.md)',
    historyButton: 'History (.md)',
    exportAppData: 'Export app data',
  },

  import: {
    conflict: {
      title: 'List already exists',
      message:
        'A list named "{existing}" already exists with the same ID as "{incoming}". Replace it, or import as a new list?',
      replace: 'Replace existing',
      importAsNew: 'Import as new',
      cancel: 'Cancel',
    },
  },

  features: {
    heading: 'Features',
    intro:
      "DuelList turns the painful job of ranking a long list into a stream of easy two-way choices. Here's what's in the box.",
    goToLists: 'Go to your lists',
    list: [
      {
        title: 'Pairwise duels',
        body:
          'No need to rank a long list from scratch. Decide between just two items at a time and the algorithm sorts the rest.',
      },
      {
        title: 'ELO ratings under the hood',
        body:
          'Every choice updates an ELO score. See your list converge with each duel — toggle between rank position and raw ELO from the rankings screen.',
      },
      {
        title: 'Smart pairing',
        body:
          'Pairs are picked to maximize information: similar ratings first, low-confidence items prioritized, recently skipped pairs penalized.',
      },
      {
        title: 'Multiple lists, custom order',
        body:
          'Keep separate lists for movies, snacks, vacation spots — anything. Sort by recent / A–Z / created, or drag to a custom order.',
      },
      {
        title: 'Optional file sync',
        body:
          'On supported browsers, link a list to a Markdown file on your device. Edits stream straight to disk so you can keep your data in version control or sync it via your cloud of choice.',
      },
      {
        title: 'Full duel history',
        body:
          'Every choice is recorded with date and items. Browse the history from the rankings header or export it as Markdown.',
      },
      {
        title: 'Markdown import & export',
        body:
          'Lists are plain Markdown — readable, diffable, portable. Export anytime; import to merge or replace.',
      },
      {
        title: 'Touch-friendly PWA',
        body:
          'Install to your home screen and use offline. Side-by-side and swipe duel modes are tuned for one-handed phone use.',
      },
      {
        title: 'Local-first, private',
        body:
          'No accounts, no servers, no telemetry. Everything is stored in your browser (and optionally your file system). You own your data.',
      },
      {
        title: 'Templates to start fast',
        body:
          'Pick a starter template (Anime, Pizza Toppings, Movies, Vacation, Snacks, Hobbies) when creating a list to skip the empty-state.',
      },
    ],
  },
} as const;
