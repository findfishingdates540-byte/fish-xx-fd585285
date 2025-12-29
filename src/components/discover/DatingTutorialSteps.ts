import { Step } from 'react-joyride';

export const datingTutorialSteps: Step[] = [
  {
    target: '[data-tutorial="profile-card"]',
    content: 'This is a potential match! Swipe right to like them, or left to pass. You can also tap the card to see their full profile.',
    title: 'Meet Someone New',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="like-button"]',
    content: 'Tap the heart to like this person. If they like you back, it\'s a match!',
    title: 'Like Someone',
    placement: 'top',
  },
  {
    target: '[data-tutorial="pass-button"]',
    content: 'Not feeling it? Tap X to pass and see the next profile.',
    title: 'Pass on a Profile',
    placement: 'top',
  },
  {
    target: '[data-tutorial="superlike-button"]',
    content: 'Use Super Like to stand out! They\'ll know you\'re really interested.',
    title: 'Super Like',
    placement: 'top',
  },
  {
    target: '[data-tutorial="rewind-button"]',
    content: 'Made a mistake? Use rewind to go back to the previous profile.',
    title: 'Undo Your Last Action',
    placement: 'top',
  },
  {
    target: '[data-tutorial="matches-sidebar"]',
    content: 'Your matches and conversations appear here. Start chatting when you match with someone!',
    title: 'Your Matches',
    placement: 'left',
  },
];

export const mobileTutorialSteps: Step[] = [
  {
    target: '[data-tutorial="profile-card"]',
    content: 'Swipe right to like, left to pass. Tap to see their full profile!',
    title: 'Meet Someone New',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="like-button"]',
    content: 'Tap the heart to like this person!',
    title: 'Like Someone',
    placement: 'top',
  },
  {
    target: '[data-tutorial="pass-button"]',
    content: 'Tap X to pass and see someone new.',
    title: 'Pass',
    placement: 'top',
  },
];
