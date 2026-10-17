// @ts-check
// Vertical slice content (PRD §0 Q27): one Lagos zone, Fresh Graduate, Monday morning.
// "Rent Is Due" + "The Voice Note" → Dr. Bayo Visa Consult → JAPA Receipt.
// Money is in kobo (₦1 = 100). All names, businesses and claims are fictional.

/** @typedef {import('../sim/types.js').Content} Content */

const N = 100; // kobo per naira

/** @type {Content} */
export const sliceContent = {
  version: 'slice-1',

  backgrounds: {
    'fresh-graduate': {
      id: 'fresh-graduate',
      name: 'Fresh Graduate',
      resources: { funds: 48_500 * N, energy: 72, readiness: 10, homeTies: 55, riskSense: 20 },
      clock: 6 * 60 + 43,
      quests: ['morning', 'rent-due'],
    },
  },

  // Listed in the order the quest strip shows them.
  quests: {
    morning: { id: 'morning', title: 'MONDAY MORNING', hint: 'Your phone dey buzz on the mattress. Check am.' },
    'rent-due': { id: 'rent-due', title: 'RENT IS DUE', hint: 'Mr Adewale dey wait for you for the compound gate. Follow the arrow.' },
    'voice-note': { id: 'voice-note', title: 'THE VOICE NOTE', hint: 'Mercy Pharmacy dey up the street, right side. Climb the stairs to Dr. Bayo.' },
  },

  interactables: {
    // --- your room ---
    'room-phone': {
      id: 'room-phone', label: 'Phone', verb: 'Read', once: true,
      completeQuest: 'morning', event: 'voice-note', minutes: 5,
    },
    'room-wallet': {
      id: 'room-wallet', label: 'Wallet', verb: 'Inspect',
      say: '₦48,500 for your name. Rent na ₦150,000. Monday don start.',
    },
    // --- the compound gate ---
    landlord: {
      id: 'landlord', label: 'Mr Adewale', verb: 'Talk',
      requires: { notFlags: ['rent_settled'] }, event: 'rent-due',
    },
    // --- the street ---
    'mama-chidi': {
      id: 'mama-chidi', label: 'Mama Chidi', verb: 'Talk',
      requires: { notFlags: ['know_agent'] }, event: 'mama-chidi-morning',
    },
    'mama-chidi-warn': {
      id: 'mama-chidi-warn', label: 'Mama Chidi', verb: 'Talk', once: true,
      requires: { flags: ['know_agent'] }, event: 'mama-chidi-warning',
    },
    'oga-femi': { id: 'oga-femi', label: 'Oga Femi', verb: 'Talk', event: 'cybercafe' },
    // --- Dr. Bayo Visa Consult, upstairs Mercy Pharmacy ---
    'flag-banner': {
      id: 'flag-banner', label: 'Banner', verb: 'Inspect', once: true,
      setFlags: ['rf_guarantee'], delta: { riskSense: 5 }, stamp: 'RED FLAG',
      say: '"100% VISA GUARANTEED." Nobody fit guarantee visa. Not even the embassy.',
    },
    'flag-certificate': {
      id: 'flag-certificate', label: 'Certificate', verb: 'Inspect', once: true,
      setFlags: ['rf_fake_official'], delta: { riskSense: 5 }, stamp: 'RED FLAG',
      say: '"Approved by the Brittish High Commision." Two spelling mistakes, and embassies don\'t approve agents.',
    },
    'flag-payment': {
      id: 'flag-payment', label: 'Payment notice', verb: 'Read', once: true,
      setFlags: ['rf_pressure'], delta: { riskSense: 5 }, stamp: 'RED FLAG',
      say: '"Pay ONLY to my personal account. Offer ends TODAY." Pressure plus a personal account.',
    },
    'dr-bayo': {
      id: 'dr-bayo', label: 'Dr. Bayo', verb: 'Talk',
      requires: { flags: ['know_agent'] }, event: 'agent-pitch',
    },
  },

  events: {
    'voice-note': {
      id: 'voice-note',
      speaker: 'Tobi (cousin) · voice note',
      line: 'Bros! My guy fit get you UK visa in 2 weeks. GUARANTEED. Na ₦300k only. Dr. Bayo Visa Consult, upstairs Mercy Pharmacy. Go today before price go up!',
      choices: [
        {
          label: 'Save the address', minutes: 2,
          setFlags: ['know_agent'], startQuest: 'voice-note',
          say: 'Dr. Bayo Visa Consult. Upstairs Mercy Pharmacy. Noted.',
        },
        {
          label: '"Who be this guy sef?"', minutes: 10, delta: { riskSense: 5 },
          setFlags: ['know_agent', 'asked_tobi'], startQuest: 'voice-note',
          say: 'Tobi: "Bros na legit guy! My friend\'s friend use am." Your friend\'s friend. Hmm.',
        },
      ],
    },

    'rent-due': {
      id: 'rent-due',
      speaker: 'Mr Adewale · Landlord',
      line: 'Oga, your rent don due since Friday o. ₦150,000. I no fit wait again.',
      choices: [
        {
          label: 'Pay ₦40,000 now, balance Friday', minutes: 10,
          delta: { funds: -40_000 * N }, setFlags: ['rent_settled', 'rent_part'], completeQuest: 'rent-due',
          receipt: { text: 'RENT (PART PAYMENT)', kobo: -40_000 * N },
          say: 'Mr Adewale: "Friday. No story."',
        },
        {
          label: 'Beg for two more weeks', minutes: 20,
          delta: { energy: -8 }, setFlags: ['rent_settled', 'rent_begged'], completeQuest: 'rent-due',
          receipt: { text: 'RENT: BEGGED FOR 2 WEEKS' },
          say: 'He hisses. "Two weeks. Na because of your mama o."',
        },
        {
          label: 'Call Mum, pay it all', minutes: 15,
          delta: { funds: -40_000 * N, homeTies: -15 }, setFlags: ['rent_settled', 'rent_mum'], completeQuest: 'rent-due',
          receipt: { text: 'RENT PAID (MUM SENT ₦110,000)', kobo: -40_000 * N },
          say: 'Mum sends ₦110,000. "Na your papa pension o. Use am well."',
        },
      ],
    },

    'mama-chidi-morning': {
      id: 'mama-chidi-morning',
      speaker: 'Mama Chidi · POS',
      line: 'Good morning! Fuel don cost again o. You wan buy pure water?',
      choices: [
        { label: 'Buy pure water (₦50)', minutes: 2, delta: { funds: -50 * N, energy: 3 }, say: 'Cold. Small mercies.' },
        { label: 'Just greet her', minutes: 1, say: 'Mama Chidi: "Greet your mama for me."' },
      ],
    },

    'mama-chidi-warning': {
      id: 'mama-chidi-warning',
      speaker: 'Mama Chidi · POS',
      line: 'You dey go Dr. Bayo? My sister pay that man ₦200k last year. Till today, e no dey pick call.',
      choices: [
        { label: 'Thank her', minutes: 5, delta: { riskSense: 10 }, setFlags: ['warned_by_mama'], say: 'Mama Chidi: "Shine your eye, my pikin."' },
        { label: '"Na your sister case be that."', minutes: 2, say: 'She shrugs. "Okay o."' },
      ],
    },

    cybercafe: {
      id: 'cybercafe',
      speaker: 'Oga Femi · Femi Net Cafe',
      line: 'Browsing ₦500 per hour. Printing, lamination, CV typing. Wetin you need?',
      choices: [
        {
          label: 'Check Dr. Bayo online (1 hour)', minutes: 60,
          requires: { flags: ['know_agent'], notFlags: ['verified_agent'] },
          delta: { funds: -500 * N, riskSense: 15, readiness: 5 }, setFlags: ['verified_agent'], stamp: 'CHECKED',
          receipt: { text: 'BROWSING 1HR', kobo: -500 * N },
          say: 'No registration anywhere. Three reviews: "SCAM. Don\'t pay this man." The official UK site: "No one can guarantee a visa."',
        },
        {
          label: 'Type CVs for Oga Femi (2 hours)', minutes: 120,
          delta: { funds: 3_000 * N, energy: -15 },
          receipt: { text: 'CV TYPING 2HRS', kobo: 3_000 * N },
          say: 'Oga Femi pays ₦3,000. Your back pays the rest.',
        },
        { label: 'Nothing for now', say: 'Oga Femi: "No wahala."' },
      ],
    },

    'agent-pitch': {
      id: 'agent-pitch',
      speaker: 'Dr. Bayo · Visa Consult',
      line: 'My brother! Tobi talk about you. UK visa, two weeks, guaranteed. Pay ₦20,000 deposit today to hold your slot. Price go up tomorrow o.',
      choices: [
        {
          label: 'Pay the ₦20,000 deposit', minutes: 15,
          delta: { funds: -20_000 * N }, setFlags: ['paid_agent'], completeQuest: 'voice-note', ending: 'scammed',
          receipt: { text: '"GUARANTEED" UK VISA DEPOSIT', kobo: -20_000 * N },
          say: 'Dr. Bayo: "You don japa already, my brother!"',
        },
        { label: 'Ask for his registration number', minutes: 10, delta: { riskSense: 5 }, event: 'agent-registration' },
        { label: 'Walk out', minutes: 5, completeQuest: 'voice-note', ending: 'walked-away', say: 'Dr. Bayo: "Your loss o! Na Canada people dey rush me now."' },
      ],
    },

    'agent-registration': {
      id: 'agent-registration',
      speaker: 'Dr. Bayo · Visa Consult',
      line: 'Registration? Ehn... e dey for my other office. You wan japa or you wan do police? Pay deposit make we start.',
      choices: [
        {
          label: 'Pay the deposit anyway', minutes: 15,
          delta: { funds: -20_000 * N }, setFlags: ['paid_agent'], completeQuest: 'voice-note', ending: 'scammed',
          receipt: { text: '"GUARANTEED" UK VISA DEPOSIT', kobo: -20_000 * N },
          say: 'Dr. Bayo: "Correct person!"',
        },
        {
          label: '"I checked you online."', minutes: 5,
          requires: { flags: ['verified_agent'] }, delta: { riskSense: 10 },
          setFlags: ['exposed_agent'], completeQuest: 'voice-note', ending: 'exposed',
          say: 'He switches off the fan. "Who send you?"',
        },
        { label: 'Walk out', minutes: 5, completeQuest: 'voice-note', ending: 'walked-away', say: 'Dr. Bayo: "Na una dey spoil market!"' },
      ],
    },
  },

  endings: {
    scammed: { id: 'scammed', stamp: 'SCAMMED', lesson: '"Guaranteed" na the first red flag.' },
    'walked-away': { id: 'walked-away', stamp: 'SAVED', lesson: 'If e too sweet, check am first.' },
    exposed: { id: 'exposed', stamp: 'EXPOSED', lesson: 'Check the agent before the agent checks your account.' },
  },

  redFlags: ['rf_guarantee', 'rf_fake_official', 'rf_pressure'],
};
