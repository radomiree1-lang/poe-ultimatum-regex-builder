import { describe, it, expect } from 'vitest';
import { deduplicateAndNormalize } from '../../../server/src/poeService.js';
import { PoeNinjaLine, UniqueCategory } from '../../../server/src/types.js';

describe('deduplicateAndNormalize', () => {
  it('excludes foil items (itemClass === 9)', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: {
          id: 1,
          name: 'Tabula Rasa',
          baseType: 'Simple Robe',
          icon: '',
          itemClass: 9, // Foil
          chaosValue: 100,
        },
        category: 'Armour',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result).toHaveLength(0);
  });

  it('excludes 5L and 6L variants (links >= 5)', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: {
          id: 1,
          name: "Belly of the Beast",
          baseType: 'Full Wyrmscale',
          icon: '',
          links: 6,
          chaosValue: 200,
        },
        category: 'Armour',
      },
      {
        line: {
          id: 2,
          name: "Belly of the Beast",
          baseType: 'Full Wyrmscale',
          icon: '',
          links: 5,
          chaosValue: 50,
        },
        category: 'Armour',
      },
      {
        line: {
          id: 3,
          name: "Belly of the Beast",
          baseType: 'Full Wyrmscale',
          icon: '',
          links: 0,
          chaosValue: 10,
        },
        category: 'Armour',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result).toHaveLength(1);
    expect(result[0].chaosValue).toBe(10);
  });

  it('picks the lowest non-zero chaosValue among variants and counts variants', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: {
          id: 10,
          name: 'Voices',
          baseType: 'Medium Cluster Jewel',
          icon: '',
          variant: '1 passive',
          chaosValue: 5000,
        },
        category: 'Jewel',
      },
      {
        line: {
          id: 11,
          name: 'Voices',
          baseType: 'Medium Cluster Jewel',
          icon: '',
          variant: '7 passives',
          chaosValue: 30,
        },
        category: 'Jewel',
      },
      {
        line: {
          id: 12,
          name: 'Voices',
          baseType: 'Medium Cluster Jewel',
          icon: '',
          variant: '3 passives',
          chaosValue: 800,
        },
        category: 'Jewel',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Voices');
    expect(result[0].chaosValue).toBe(30);
    expect(result[0].variantCount).toBe(3);
  });

  it('identifies Replica items with isReplica = true and isUltimatumPool = false', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: {
          id: 20,
          name: 'Replica Headhunter',
          baseType: 'Leather Belt',
          icon: '',
          chaosValue: 450,
        },
        category: 'Accessory',
      },
      {
        line: {
          id: 21,
          name: 'Headhunter',
          baseType: 'Leather Belt',
          icon: '',
          chaosValue: 900,
        },
        category: 'Accessory',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result).toHaveLength(2);

    const replica = result.find((i) => i.name === 'Replica Headhunter');
    const normal = result.find((i) => i.name === 'Headhunter');

    expect(replica?.isReplica).toBe(true);
    expect(replica?.isUltimatumPool).toBe(false);
    expect(normal?.isReplica).toBe(false);
    expect(normal?.isUltimatumPool).toBe(true);
  });

  it('sorts ascending by chaosValue by default', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: { id: 1, name: 'Expensive Item', baseType: 'A', icon: '', chaosValue: 150 },
        category: 'Weapon',
      },
      {
        line: { id: 2, name: 'Cheap Item', baseType: 'B', icon: '', chaosValue: 2 },
        category: 'Armour',
      },
      {
        line: { id: 3, name: 'Mid Item', baseType: 'C', icon: '', chaosValue: 25 },
        category: 'Accessory',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result.map((r) => r.name)).toEqual(['Cheap Item', 'Mid Item', 'Expensive Item']);
  });

  it('assigns stackSize = 1 and matching total/ultimatum values for Unique items', () => {
    const rawItems: Array<{ line: PoeNinjaLine; category: UniqueCategory }> = [
      {
        line: { id: 1, name: 'Mageblood', baseType: 'Heavy Belt', icon: '', chaosValue: 15000, divineValue: 100 },
        category: 'Accessory',
      },
    ];

    const result = deduplicateAndNormalize(rawItems);
    expect(result[0].stackSize).toBe(1);
    expect(result[0].totalChaosValue).toBe(15000);
    expect(result[0].ultimatumQuantity).toBe(1);
    expect(result[0].ultimatumChaosValue).toBe(15000);
  });
});
