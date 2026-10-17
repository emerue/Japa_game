// @ts-check
// The slice Zone as plain data: an Ojuelegba-style street on Monday morning.
// Shared by the 3D builder, collisions and (later) the 2D lite renderer.
// Units are metres. The street runs east–west along z = 0; north is −z.

/**
 * @typedef {object} Building
 * @property {string} id
 * @property {number} x Centre.
 * @property {number} z Centre.
 * @property {number} w Width along x.
 * @property {number} d Depth along z.
 * @property {number} h Height.
 * @property {string} wall
 * @property {string} [roof]
 * @property {1 | -1} face Which side faces the street: 1 = +z (south), −1 = −z (north).
 * @property {{ text: string, sub?: string, bg: string, fg: string, accent?: string, y?: number, w?: number }[]} [signs]
 * @property {string} [paint] Words painted straight on the wall.
 * @property {boolean} [enterable] The player can walk in; the roof and walls fade.
 * @property {number} [doorX] Door position along the face, relative to x.
 */

/**
 * @typedef {object} Person
 * @property {string} id
 * @property {string} model Character model file (Quaternius base).
 * @property {number} tone Skin tone index 0–6 (PRD Q33).
 * @property {string} anim
 * @property {[number, number]} at
 * @property {number} facing Rotation in radians (0 faces the camera).
 * @property {string} [interactable] Sim interactable ids this person offers.
 * @property {string[]} [also] More interactable ids (only one is available at a time).
 * @property {{ hair?: string, outfit?: Record<string, string> }} [look]
 */

/**
 * @typedef {object} Spot An object the player can use, placed in the World.
 * @property {string} id Sim interactable id.
 * @property {[number, number]} at
 * @property {number} [radius]
 */

export const zone = {
  id: 'ojuelegba-morning',
  playerStart: /** @type {[number, number]} */ ([-19.5, 16.2]),
  playerFacing: Math.PI,

  street: { halfWidth: 4, pavement: 3.2, length: 70 },

  /** @type {Building[]} */
  buildings: [
    // --- south side: the compound (rooms in a row, doors facing the yard) ---
    { id: 'my-room', x: -19.5, z: 15.5, w: 5, d: 4.6, h: 3.1, wall: '#E3C8A8', roof: '#9AA3A8', face: -1, enterable: true, doorX: 0.9 },
    { id: 'room-2', x: -14.3, z: 15.5, w: 5, d: 4.6, h: 3.1, wall: '#E3C8A8', roof: '#9AA3A8', face: -1, doorX: 0.9 },
    { id: 'room-3', x: -9.1, z: 15.5, w: 5, d: 4.6, h: 3.1, wall: '#E3C8A8', roof: '#8F989D', face: -1, doorX: 0.9 },
    // --- south side, east: shops facing the street ---
    { id: 'tailor', x: 2, z: 11, w: 7, d: 6, h: 3.6, wall: '#7FA6B5', roof: '#7A3B2E', face: -1,
      signs: [{ text: 'GOD FIRST FASHION', sub: 'TAILORING · ASO-EBI', bg: '#FFF8E7', fg: '#191B1E', accent: '#C74742' }] },
    { id: 'chemist-south', x: 11, z: 11.5, w: 8, d: 7, h: 6.4, wall: '#D98E5F', roof: '#7A3B2E', face: -1, paint: 'THIS HOUSE IS NOT FOR SALE' },
    { id: 'south-4', x: 21, z: 11, w: 9, d: 6, h: 3.6, wall: '#C9B27C', roof: '#9AA3A8', face: -1,
      signs: [{ text: 'BLESSED HANDS', sub: 'BARBING SALON · LOW CUT ₦1,500', bg: '#176B6B', fg: '#FFF8E7', accent: '#F2B705' }] },
    { id: 'south-west', x: -31, z: 11, w: 8, d: 6, h: 6.4, wall: '#A8C69F', roof: '#7A3B2E', face: -1 },
    // --- north side, facing the camera ---
    { id: 'mama-put', x: -20, z: -10.5, w: 9, d: 7, h: 3.6, wall: '#E8D9B5', roof: '#7A3B2E', face: 1,
      signs: [{ text: 'IYA BASIRAT', sub: 'MAMA PUT · RICE · AMALA · SWALLOW', bg: '#C74742', fg: '#FFF8E7', accent: '#F2B705' }] },
    { id: 'cybercafe', x: -4, z: -10.5, w: 9, d: 7, h: 3.8, wall: '#355D93', roof: '#9AA3A8', face: 1, doorX: 0,
      signs: [{ text: 'FEMI NET CAFE', sub: 'BROWSING · PRINTING · LAMINATION · CV', bg: '#F2B705', fg: '#191B1E', accent: '#191B1E' }] },
    { id: 'pharmacy', x: 9.5, z: -11, w: 10, d: 8, h: 6.6, wall: '#F4EBDD', roof: '#7A3B2E', face: 1, doorX: -1.5,
      signs: [
        { text: 'MERCY PHARMACY', sub: 'DRUGS · PROVISIONS · NHIS', bg: '#2F7D3B', fg: '#FFFFFF', accent: '#F4EBDD', y: 2.9 },
        { text: 'DR. BAYO VISA CONSULT', sub: '100% GUARANTEED · UK · CANADA · USA', bg: '#191B1E', fg: '#F2B705', accent: '#FFFFFF', y: 5.6, w: 9 },
      ] },
    { id: 'north-east', x: 24, z: -11, w: 9, d: 7, h: 3.6, wall: '#B85C4A', roof: '#9AA3A8', face: 1,
      signs: [{ text: 'JESUS IS LORD', sub: 'SPARE PARTS · OKADA · KEKE', bg: '#FFF8E7', fg: '#355D93', accent: '#C74742' }] },
    { id: 'north-west', x: -34, z: -11, w: 9, d: 7, h: 6.4, wall: '#C9B27C', roof: '#7A3B2E', face: 1 },
  ],

  // The compound wall with its gate onto the street (gap between x = −12 and −9.6).
  compound: { x0: -24, x1: -5, z0: 6.2, z1: 19.5, gate: [-12.2, -9.4], height: 2.2, color: '#D4D0C4' },

  /** @type {Spot[]} */
  spots: [
    { id: 'room-phone', at: [-20.9, 16.6], radius: 1.4 },
    { id: 'room-wallet', at: [-18.1, 16.9], radius: 1.3 },
    { id: 'pharmacy-stairs', at: [15.4, -6.6], radius: 1.6 },
  ],

  /** @type {Person[]} */
  people: [
    { id: 'mr-adewale', model: 'Casual_2', tone: 4, anim: 'Idle', at: [-10.8, 7.6], facing: 0, interactable: 'landlord',
      look: { hair: 'none', outfit: { White: '#E8E2D0', LightBlue: '#3B4A3F', Red_Dark: '#5B3A24' } } },
    { id: 'mama-chidi', model: 'W_Formal', tone: 2, anim: 'Idle', at: [-8.2, -5.2], facing: 0, interactable: 'mama-chidi', also: ['mama-chidi-warn'],
      look: { hair: '#15100C', outfit: { LimeGreen: '#6A2C8C', Gold: '#F2B705', Red: '#15100C' } } },
    { id: 'oga-femi', model: 'Casual_2', tone: 0, anim: 'Idle', at: [-2.6, -6.3], facing: 0.2, interactable: 'oga-femi',
      look: { hair: '#15100C', outfit: { White: '#F2B705', LightBlue: '#2E3138', Red_Dark: '#191B1E' } } },
    { id: 'walker-1', model: 'W_Casual', tone: 5, anim: 'Walk', at: [4, 5.4], facing: Math.PI / 2 },
    { id: 'walker-2', model: 'Worker', tone: 3, anim: 'Walk', at: [-28, -5.6], facing: -Math.PI / 2 },
  ],

  danfos: [
    { at: /** @type {[number, number]} */ ([21.5, -2.4]), facing: Math.PI / 2 },
    { at: /** @type {[number, number]} */ ([28.5, -2.4]), facing: Math.PI / 2 },
    { at: /** @type {[number, number]} */ ([-16, 2.3]), facing: -Math.PI / 2 },
  ],

  busStop: { x: 21, z: -6.4, sign: 'OJUELEGBA' },
  posStand: { x: -9.4, z: -5.6 },
};

/** The agent's office upstairs: a compact separate scene behind a short fade (PRD Q22). */
export const agentOffice = {
  id: 'dr-bayo-office',
  origin: /** @type {[number, number]} */ ([0, -80]),
  size: { w: 7, d: 6, h: 3 },
  playerStart: /** @type {[number, number]} */ ([0, 0.9]),
  /** @type {Spot[]} */
  spots: [
    { id: 'flag-banner', at: [-2.2, -2.5], radius: 1.4 },
    { id: 'flag-certificate', at: [2.4, -2.5], radius: 1.4 },
    { id: 'flag-payment', at: [3.0, 0.3], radius: 1.3 },
    { id: 'office-exit', at: [0, 2.75], radius: 0.75 },
  ],
  /** @type {Person[]} */
  people: [
    { id: 'dr-bayo', model: 'Suit', tone: 2, anim: 'Idle', at: [0, -1.3], facing: 0, interactable: 'dr-bayo',
      look: { hair: '#15100C', outfit: { Tie: '#F2B705', Suit: '#2A2140' } } },
  ],
};
