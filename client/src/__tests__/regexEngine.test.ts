import { describe, it, expect } from 'vitest';
import {
  escapePoERegex,
  findShortestUniqueSubstring,
  generateRegexChunks,
  testUltimatumRegex,
  collidesWithKeywords,
} from '../services/regexEngine.js';
import { UniqueItem } from '../services/types.js';

describe('escapePoERegex', () => {
  it('converts to lowercase', () => {
    expect(escapePoERegex("Kaom's Sign")).toBe("kaom's sign");
  });

  it('keeps safe characters unescaped: single quote, hyphen, comma, space', () => {
    expect(escapePoERegex("Lioneye's Glare, Imperial Bow - Test")).toBe(
      "lioneye's glare, imperial bow - test"
    );
  });

  it('escapes regex special characters: . ( ) + ? [ ] ^ $ * { } | \\', () => {
    expect(escapePoERegex('Item (Roll +10%) [Tier.1]')).toBe(
      'item \\(roll \\+10%\\) \\[tier\\.1\\]'
    );
    expect(escapePoERegex('Foo^Bar$Baz*Qux?Pipe|Slash\\')).toBe(
      'foo\\^bar\\$baz\\*qux\\?pipe\\|slash\\\\'
    );
  });
});

describe('collidesWithKeywords', () => {
  it('detects collisions with standard Inscribed Ultimatum keywords', () => {
    expect(collidesWithKeywords('ultimatum')).toBe(true);
    expect(collidesWithKeywords('sacrifice')).toBe(true);
    expect(collidesWithKeywords('reward')).toBe(true);
    expect(collidesWithKeywords('survive')).toBe(true);
    expect(collidesWithKeywords('waves')).toBe(true);
    expect(collidesWithKeywords('inscribed')).toBe(true);
  });

  it('allows safe item substrings that do not collide', () => {
    expect(collidesWithKeywords('tabula')).toBe(false);
    expect(collidesWithKeywords('kaom')).toBe(false);
    expect(collidesWithKeywords('headhunter')).toBe(false);
  });
});

describe('findShortestUniqueSubstring', () => {
  it('finds a short unique substring that does not collide with unselected items', () => {
    const target = 'Mageblood';
    const unselected = new Set(['Headhunter', 'Tabula Rasa', 'Goldrim']);

    const token = findShortestUniqueSubstring(target, unselected);
    expect(token.length).toBeLessThanOrEqual(target.length);
    expect('mageblood'.includes(token)).toBe(true);
    expect('headhunter'.includes(token)).toBe(false);
    expect('tabula rasa'.includes(token)).toBe(false);
  });

  it('avoids collisions with Ultimatum keywords', () => {
    // If an item name contains "reward" like "Rewarder"
    const target = 'The Rewarder';
    const unselected = new Set(['Goldrim']);
    const token = findShortestUniqueSubstring(target, unselected);
    // Token should not be "reward"
    expect(collidesWithKeywords(token)).toBe(false);
  });

  it('falls back to full name if all short substrings collide', () => {
    const target = 'Bino';
    const unselected = new Set(['Binos Kitchen', 'Bino Knife']);
    const token = findShortestUniqueSubstring(target, unselected);
    expect(token).toBe('bino');
  });
});

describe('generateRegexChunks', () => {
  const mockItems: UniqueItem[] = [
    {
      id: 'tabula-rasa-armour',
      name: 'Tabula Rasa',
      baseType: 'Simple Robe',
      category: 'Armour',
      chaosValue: 2,
      divineValue: 0.01,
      icon: '',
      listingCount: 50,
      variantCount: 1,
      isReplica: false,
      isUltimatumPool: true,
    },
    {
      id: 'goldrim-armour',
      name: 'Goldrim',
      baseType: 'Leather Cap',
      category: 'Armour',
      chaosValue: 1,
      divineValue: 0.01,
      icon: '',
      listingCount: 40,
      variantCount: 1,
      isReplica: false,
      isUltimatumPool: true,
    },
    {
      id: 'kaoms-sign-accessory',
      name: "Kaom's Sign",
      baseType: 'Coral Ring',
      category: 'Accessory',
      chaosValue: 3,
      divineValue: 0.02,
      icon: '',
      listingCount: 30,
      variantCount: 1,
      isReplica: false,
      isUltimatumPool: true,
    },
  ];

  it('generates standard Reward regex wrapped in double quotes', () => {
    const chunks = generateRegexChunks([mockItems[0], mockItems[1]], mockItems, {
      matchMode: 'reward',
      prefixMode: 'standard',
      compressionMode: 'full',
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].quotedString).toBe('"reward: .*(tabula rasa|goldrim)"');
    expect(chunks[0].charCount).toBeLessThanOrEqual(250);
  });

  it('generates compact Reward regex "d: .*(...)"', () => {
    const chunks = generateRegexChunks([mockItems[0]], mockItems, {
      matchMode: 'reward',
      prefixMode: 'compact',
      compressionMode: 'full',
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].quotedString).toBe('"d: .*(tabula rasa)"');
  });

  it('generates standard Sacrifice regex "sacrifice: .*(...)"', () => {
    const chunks = generateRegexChunks([mockItems[0]], mockItems, {
      matchMode: 'sacrifice',
      prefixMode: 'standard',
      compressionMode: 'full',
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].quotedString).toBe('"sacrifice: .*(tabula rasa)"');
  });

  it('generates compact Sacrifice regex "ce: .*(...)"', () => {
    const chunks = generateRegexChunks([mockItems[0]], mockItems, {
      matchMode: 'sacrifice',
      prefixMode: 'compact',
      compressionMode: 'full',
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].quotedString).toBe('"ce: .*(tabula rasa)"');
  });

  it('generates sacrifice regex for Divination Cards even in Reward mode because card duplications list the card in Requires Sacrifice', () => {
    const cardItems: UniqueItem[] = [
      {
        id: 'the-jester-card',
        name: 'The Jester',
        baseType: 'Divination Card',
        category: 'Divination Card',
        chaosValue: 1,
        divineValue: 0.01,
        icon: '',
        listingCount: 10,
        variantCount: 1,
        isReplica: false,
        isUltimatumPool: true,
      },
      {
        id: 'a-dusty-memory-card',
        name: 'A Dusty Memory',
        baseType: 'Divination Card',
        category: 'Divination Card',
        chaosValue: 5,
        divineValue: 0.02,
        icon: '',
        listingCount: 20,
        variantCount: 1,
        isReplica: false,
        isUltimatumPool: true,
      },
    ];

    const chunks = generateRegexChunks(cardItems, cardItems, {
      matchMode: 'reward',
      prefixMode: 'standard',
      compressionMode: 'full',
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].quotedString).toBe('"sacrifice: .*(the jester|a dusty memory)"');
  });

  it('splits chunks when exceeding the 250 character limit', () => {
    // Create 30 mock items with 20-char names
    const longItemList: UniqueItem[] = [];
    for (let i = 1; i <= 30; i++) {
      longItemList.push({
        id: `item-${i}`,
        name: `Super Long Unique Item Name Number ${i}`,
        baseType: 'Base',
        category: 'Armour',
        chaosValue: i,
        divineValue: 0.1,
        icon: '',
        listingCount: 10,
        variantCount: 1,
        isReplica: false,
        isUltimatumPool: true,
      });
    }

    const chunks = generateRegexChunks(longItemList, longItemList, {
      matchMode: 'reward',
      prefixMode: 'standard',
      compressionMode: 'full',
      maxCharsPerChunk: 250,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.charCount).toBeLessThanOrEqual(250);
      expect(chunk.quotedString.startsWith('"reward: .*(')).toBe(true);
      expect(chunk.quotedString.endsWith(')"')).toBe(true);
    }
  });
});

describe('testUltimatumRegex', () => {
  const sampleTooltip = `Inscribed Ultimatum
Area Level: 83
Item Quantity: +60%
--------
Requires Sacrifice: Kaom's Sign, Coral Ring
Reward: 8x Chaos Orb
--------
Survive 10 Waves
--------
Take this item to the Trialmaster's Altar in the Ultimatum`;

  it('matches Sacrifice line when Kaom\'s Sign is selected in Sacrifice mode', () => {
    const chunks = [
      {
        index: 1,
        quotedString: '"sacrifice: .*(kaom\'s sign)"',
        rawPattern: 'sacrifice: .*(kaom\'s sign)',
        charCount: 29,
        itemCount: 1,
        itemNames: ["Kaom's Sign"],
      },
    ];

    const result = testUltimatumRegex(sampleTooltip, chunks);
    expect(result.matched).toBe(true);
    expect(result.lineType).toBe('sacrifice');
    expect(result.matchedLineText).toContain("Requires Sacrifice: Kaom's Sign");
  });

  it('matches Inscribed Ultimatum tooltip with card duplication "Reward: Doubles sacrificed Divination Cards"', () => {
    const userTooltip = `Inscribed Ultimatum
Challenge: Survive
Area Level: 83
Requires Sacrifice: A Dusty Memory x3
Reward: Doubles sacrificed Divination Cards
120% more Monster Life`;

    const chunks = [
      {
        index: 1,
        quotedString: '"sacrifice: .*(the jester|a dusty memory)"',
        rawPattern: 'sacrifice: .*(the jester|a dusty memory)',
        charCount: 42,
        itemCount: 2,
        itemNames: ['The Jester', 'A Dusty Memory'],
      },
    ];

    const result = testUltimatumRegex(userTooltip, chunks);
    expect(result.matched).toBe(true);
    expect(result.lineType).toBe('sacrifice');
    expect(result.matchedLineText).toBe('Requires Sacrifice: A Dusty Memory x3');
  });

  it('does NOT match Reward line when Kaom\'s Sign is in Sacrifice mode only', () => {
    const rewardChunks = [
      {
        index: 1,
        quotedString: '"reward: .*(kaom\'s sign)"',
        rawPattern: 'reward: .*(kaom\'s sign)',
        charCount: 26,
        itemCount: 1,
        itemNames: ["Kaom's Sign"],
      },
    ];

    const result = testUltimatumRegex(sampleTooltip, rewardChunks);
    expect(result.matched).toBe(false);
  });

  it('matches compact syntax "ce: .*(kaom\'s sign)" against sacrifice', () => {
    const compactChunks = [
      {
        index: 1,
        quotedString: '"ce: .*(kaom\'s sign)"',
        rawPattern: 'ce: .*(kaom\'s sign)',
        charCount: 22,
        itemCount: 1,
        itemNames: ["Kaom's Sign"],
      },
    ];

    const result = testUltimatumRegex(sampleTooltip, compactChunks);
    expect(result.matched).toBe(true);
    expect(result.lineType).toBe('sacrifice');
  });
});
