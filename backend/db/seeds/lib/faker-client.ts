import { en, Faker } from "@faker-js/faker";

const fakerInstances = new Map<number, Faker>();

export function getFakerForIndex(baseSeed: number, index: number): Faker {
  const combinedSeed = baseSeed + index;
  let instance = fakerInstances.get(combinedSeed);
  if (!instance) {
    instance = new Faker({ locale: [en], seed: combinedSeed });
    fakerInstances.set(combinedSeed, instance);
  }
  return instance;
}
