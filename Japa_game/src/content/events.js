// @ts-check
// Event cards, grouped by the Stage they belong to.

/** @typedef {import('../game/types.js').GameEvent} GameEvent */

/** @type {GameEvent[]} */
export const hustleEvents = [
  {
    id: 'hustle-pos',
    title: 'POS Stand',
    text: 'Your cousin offers you his POS stand in Yaba for evenings. "Na quick money," he says.',
    choices: [
      { label: 'Run it every evening', outcome: 'Cash in hand, cash in pocket, back in pain.', effects: { naira: 20, sanity: -10 } },
      { label: 'Decline and focus on applications', outcome: 'You refresh your inbox. Nothing. But at least you rested.', effects: { sanity: 5 } },
    ],
  },
  {
    id: 'hustle-coin',
    title: 'TrustMeCoin',
    text: 'A friend from secondary school is "very liquid" from a new coin. He wants you in before it moons.',
    choices: [
      { label: 'Put your savings in', outcome: 'It mooned. Then it went to the actual moon, with your money.', effects: { naira: -20, sanity: -10 } },
      { label: 'Exit the WhatsApp group', outcome: 'Peace of mind is also a currency.', effects: { sanity: 5 } },
    ],
  },
  {
    id: 'hustle-aso-ebi',
    title: 'Aso-ebi Season',
    text: "Aunty Ronke's 60th birthday. The aso-ebi alone costs more than your transport for the month.",
    choices: [
      { label: 'Buy the fabric and show face', outcome: 'You danced. Aunty Ronke tells everyone you are "going abroad soon".', effects: { naira: -10, family: 15 } },
      { label: 'Skip the party', outcome: 'Word travels fast. You are now "the one that has changed".', effects: { family: -15 } },
    ],
  },
  {
    id: 'hustle-freelance',
    title: 'Upwork Client',
    text: 'A client in Ohio wants a logo, a website and "brand vibes" for $15.',
    choices: [
      { label: 'Take the job', outcome: 'Fifteen dollars at the parallel market rate is not nothing.', effects: { naira: 10, sanity: -5 } },
      { label: 'Counter at $40', outcome: 'He ghosts you. Your self-respect remains intact.', effects: { sanity: 5 } },
    ],
  },
  {
    id: 'hustle-family-meeting',
    title: 'Family Meeting',
    text: 'Your uncles have called a meeting. Everyone wants to "contribute" to your japa.',
    choices: [
      { label: 'Accept the contributions', outcome: 'You are funded. You are also now a family investment with expected returns.', effects: { naira: 25, family: -10 } },
      { label: 'Insist you will do it yourself', outcome: 'They are proud of you. Your bank account is not.', effects: { family: 10, sanity: -10 } },
    ],
  },
  {
    id: 'hustle-no-light',
    title: 'No Light',
    text: 'NEPA has taken light for three days. Your laptop is at 4%.',
    choices: [
      { label: 'Buy fuel for the generator', outcome: 'Fuel price has gone up again since yesterday.', effects: { naira: -10 } },
      { label: 'Endure the darkness', outcome: 'You charged your phone at a barbershop and wept quietly.', effects: { sanity: -15 } },
    ],
  },
];

/** @type {GameEvent[]} */
export const paperworkEvents = [
  {
    id: 'pw-passport',
    title: 'Passport Office',
    text: 'The officer says passport booklets are "finished" this month, but there is a way.',
    skipIfHeld: 'passport',
    choices: [
      { label: "Pay the 'processing assistance'", outcome: 'Booklets have miraculously arrived. Passport collected.', effects: { naira: -10 }, grants: ['passport'] },
      { label: 'Wait for it the proper way', outcome: 'Six weeks and four visits later, you have your passport.', effects: { time: -15, sanity: -5 }, grants: ['passport'] },
    ],
  },
  {
    id: 'pw-english',
    title: 'Prove Your English',
    text: 'The UKVI IELTS fee is more than your rent, to prove you speak the language you were educated in.',
    skipIfHeld: 'english',
    choices: [
      { label: 'Book and sit the test', outcome: 'Band 7.5. The examiner asked about your favourite season. Lagos has two.', effects: { naira: -15, sanity: -5 }, grants: ['english'] },
      { label: 'Ask the university to accept your WAEC English', outcome: 'After many emails, they accept it. English proficiency confirmed.', effects: { time: -10, sanity: -5 }, grants: ['english'] },
      { label: 'Skip it. You speak English fine', outcome: 'True. The Home Office is not interested in what is true.' },
    ],
  },
  {
    id: 'pw-cas',
    title: 'University Offer',
    text: 'An offer from a university in Coventry! They need a tuition deposit before they issue your CAS.',
    skipIfHeld: 'cas',
    choices: [
      { label: 'Pay the deposit yourself', outcome: 'Deposit paid. CAS number received, guarded like a treasure.', effects: { naira: -25 }, grants: ['cas'], requires: { meters: { naira: 25 } } },
      { label: 'Ask your parents to sell the land in the village', outcome: 'The land is sold. Your father says nothing for three days.', effects: { family: -20 }, grants: ['cas'] },
      { label: 'Ask for a deferral', outcome: 'They grant it, then the deadline passes without a CAS.', effects: { time: -15 } },
    ],
  },
  {
    id: 'pw-tb-test',
    title: 'TB Test',
    text: 'You need a tuberculosis test from a Home Office-approved clinic.',
    skipIfHeld: 'tb-test',
    choices: [
      { label: 'Go to the approved clinic in Ikoyi', outcome: 'Chest X-ray clear. Certificate in hand.', effects: { naira: -5, time: -5 }, grants: ['tb-test'] },
      { label: 'Use the clinic your friend says is "the same thing"', outcome: 'It was cheaper. It was also not on the approved list.', effects: { naira: -2 } },
    ],
  },
  {
    id: 'pw-funds',
    title: 'Proof of Funds',
    text: 'Your maintenance money must sit in an account for 28 consecutive days.',
    skipIfHeld: 'funds',
    choices: [
      { label: 'Show your own savings', outcome: 'Twenty-eight days of not touching it. Most of it will go on fees anyway.', effects: { naira: -20, sanity: -5 }, grants: ['funds'], requires: { meters: { naira: 40 } } },
      { label: 'Borrow from Uncle Femi for 28 days', outcome: 'He lends it, and reminds you at every family gathering, forever.', effects: { family: -20 }, grants: ['funds'] },
      { label: "Buy a 'statement' from Mr Fix", outcome: 'The Home Office checked with the bank. False documents mean a ten-year ban.', ending: 'deception-ban' },
    ],
  },
  {
    id: 'pw-agent',
    title: 'Japa Agent',
    text: 'An Instagram agent with a Range Rover in his profile picture "guarantees" your visa for ₦3m.',
    choices: [
      { label: 'Pay him', outcome: 'His account was deleted the next morning. So was your money.', ending: 'scammed' },
      { label: 'Block and report', outcome: 'You also warned your group chat. Two people had already paid.', effects: { sanity: 5 } },
    ],
  },
  {
    id: 'pw-appointment',
    title: 'Appointment Slots',
    text: 'No biometrics appointments in Lagos for six weeks.',
    choices: [
      { label: 'Refresh the portal at 3am', outcome: 'A slot appeared at 3:47am. You took it, shaking.', effects: { sanity: -10 } },
      { label: 'Pay for a priority slot', outcome: 'Money really does buy time.', effects: { naira: -10, time: 10 } },
    ],
  },
  {
    id: 'pw-reference',
    title: 'Reference Letter',
    text: 'Your former lecturer has not sent your reference letter. It has been five weeks.',
    choices: [
      { label: 'Visit his office with a "small something"', outcome: 'He wrote it on the spot. It is very warm.', effects: { naira: -5 } },
      { label: 'Keep emailing politely', outcome: 'He eventually replies: "Noted."', effects: { time: -10, sanity: -5 } },
    ],
  },
];

/** @type {GameEvent[]} */
export const visaEvents = [
  {
    id: 'visa-interview',
    title: 'Credibility Interview',
    text: 'A Home Office officer on a video call asks why you chose a university in Coventry.',
    choices: [
      { label: 'Walk through the course modules confidently', outcome: 'She nods. You think she nodded. The connection froze.', effects: { sanity: -5 } },
      { label: '"My cousin is there"', outcome: 'There is a long pause, during which you age visibly.', effects: { sanity: -15 } },
    ],
  },
  {
    id: 'visa-decision',
    title: 'Decision Day',
    text: 'The courier envelope is in your hand. Your whole family is on video call.',
    choices: [
      {
        label: 'Open the envelope',
        outcome: 'APPROVED. The vignette is in your passport. Someone in the background screams "JESUS!"',
        effects: { sanity: 20 },
        visaDecision: { refusalOutcome: 'Refused. You will have to fix your papers and pay to apply again.' },
      },
    ],
  },
];

/** @type {GameEvent[]} */
export const departureEvents = [
  {
    id: 'dep-luggage',
    title: 'The Luggage',
    text: 'Your mother has packed 23kg of crayfish, garri and ogbono into your suitcase.',
    choices: [
      { label: 'Take it all', outcome: 'Excess baggage fee paid. You will eat well in Coventry.', effects: { naira: -5, family: 10 } },
      { label: 'Quietly remove the ogbono', outcome: 'She found it under the bed before you left.', effects: { family: -10 } },
    ],
  },
  {
    id: 'dep-send-off',
    title: 'Airport Send-off',
    text: 'Twelve relatives want to escort you to the airport, in two buses.',
    choices: [
      { label: 'Let them all come', outcome: 'There was prayer at departures. Strangers joined in.', effects: { family: 15, sanity: -5 } },
      { label: 'Sneak out at dawn', outcome: 'Peaceful. The family WhatsApp group is not.', effects: { family: -10, sanity: 5 } },
    ],
  },
  {
    id: 'dep-flight',
    title: 'Flight Prices',
    text: 'It is September. Every Nigerian student is flying at once and fares have doubled.',
    choices: [
      { label: 'Pay for the direct flight', outcome: 'Six hours, one meal, zero regrets.', effects: { naira: -15 } },
      { label: 'Fly via Addis with a 14-hour layover', outcome: 'You now know every corner of Bole airport.', effects: { sanity: -10 } },
    ],
  },
  {
    id: 'dep-goodbye',
    title: 'Last Night',
    text: 'Your best friend asks if you will ever come back.',
    choices: [
      { label: 'Promise you will', outcome: 'You both pretend to believe it.', effects: { sanity: 5 } },
      { label: '"We move."', outcome: 'He laughs. Then he asks you to send him the university link.', effects: { family: 5 } },
    ],
  },
];

/** @type {GameEvent[]} */
export const settlingEvents = [
  {
    id: 'set-rent',
    title: 'The Landlord',
    text: 'With no UK credit history, the landlord wants six months of rent upfront.',
    choices: [
      { label: 'Pay it', outcome: 'You have a room. You do not have much else.', effects: { naira: -20 } },
      { label: 'Share a flat with three coursemates', outcome: 'One of them plays Afrobeats at 2am. You have stopped fighting it.', effects: { sanity: -10 } },
    ],
  },
  {
    id: 'set-winter',
    title: 'October',
    text: 'It is 2°C and your Lagos jacket was for decoration.',
    choices: [
      { label: 'Buy a proper winter coat', outcome: 'Warm, finally. Expensive, definitely.', effects: { naira: -10 } },
      { label: 'Layer three hoodies', outcome: 'You look like a sofa and you are still cold.', effects: { sanity: -10 } },
    ],
  },
  {
    id: 'set-work',
    title: 'Work Hours',
    text: 'Student visas cap work at 20 hours a week in term time.',
    choices: [
      { label: 'Take care-home shifts', outcome: 'Pounds are coming in. Sleep is not.', effects: { naira: 15, sanity: -10 } },
      { label: 'Focus on your studies', outcome: 'First assignment: distinction. Bank balance: concerning.', effects: { sanity: 5, naira: -5 } },
    ],
  },
  {
    id: 'set-remittance',
    title: '"Now That You Are Abroad"',
    text: 'The family WhatsApp group has discovered you earn pounds.',
    choices: [
      { label: 'Send £50 home', outcome: 'Blessings rain down. So do follow-up requests.', effects: { naira: -10, family: 15 } },
      { label: 'Leave them on read', outcome: 'Your mother has started posting proverbs about forgetting where you came from.', effects: { family: -15 } },
    ],
  },
  {
    id: 'set-food',
    title: 'Food Prices',
    text: 'You priced the ingredients for jollof at Tesco and had to sit down.',
    choices: [
      { label: 'Find the African shop across town', outcome: 'The owner is from Ibadan. You are home, a little.', effects: { naira: -5, sanity: 10 } },
      { label: 'Survive on meal deals', outcome: 'Sandwich, crisps, drink. Again. Forever.', effects: { sanity: -5 } },
    ],
  },
];
