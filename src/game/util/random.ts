import { chance } from "./chance";

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomName({
  gender,
  prefix,
  suffix,
}: {
  gender?: "male" | "female";
  prefix?: boolean;
  suffix?: boolean;
} = {}) {
  return chance.name({
    gender: gender ?? chance.pickone(["male", "female", undefined]),
    full: true,
    nationality: "en",
    prefix: prefix ?? chance.bool({ likelihood: 10 }),
    suffix: suffix ?? chance.bool({ likelihood: 5 }),
  });
}
