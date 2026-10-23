import { describe, expect, it } from "vitest";

import { normaliseLabUnit, sameLabUnit } from "../unit-normalise";

describe("sameLabUnit — spellings of one unit", () => {
  it.each([
    ["mmol/L", "mmol/l"],
    ["mg/dL", "mg/dl"],
    ["mg/dL", "mg/DL"],
    ["mg/dL", " mg / dL "],
    ["mg/dL", "mg/ dL"],
    ["µg/L", "ug/L"],
    ["µg/L", "μg/L"],
    ["µg/L", "mcg/L"],
    ["µmol/L", "umol/l"],
    ["µIU/mL", "uIU/mL"],
    ["x10^3/µL", "x10^3/uL"],
    ["x10^3/µL", "x10^3/µl"],
    ["mg/dL", "MG/DL"],
    ["mmol/L", "MMOL/L"],
    ["µmol/L", "UMOL/L"],
    ["ng/mL", "NG/ML"],
    ["IU/L", "IU/l"],
    ["IU/L", "IU/L"],
  ])("%s = %s", (a, b) => {
    expect(sameLabUnit(a, b)).toBe(true);
    expect(sameLabUnit(b, a)).toBe(true);
  });
});

describe("sameLabUnit — never merges units of different magnitude or kind", () => {
  it.each([
    // The point of the module: nothing that changes the number.
    ["mg/dL", "mmol/L"],
    ["mg/dL", "mg/L"],
    ["mg/L", "µg/L"],
    ["g/dL", "g/L"],
    ["ng/mL", "ng/dL"],
    ["µg/L", "mg/L"],
    ["%", "mmol/mol"],
    ["mmol/L", "µmol/L"],
    ["mmol/L", "mol/L"],
    // Case that carries meaning stays significant.
    ["mIU/L", "MIU/L"],
    ["g/L", "G/L"],
    ["u/L", "U/L"],
    ["mmol/L", "Mmol/L"],
    ["pmol/L", "Pmol/L"],
    // A unit the module does not know compares exactly, so it cannot be guessed.
    ["mg/dL", "mg/dl."],
    ["mg/dL", "mg per dL"],
    ["mg/dL", ""],
  ])("%s ≠ %s", (a, b) => {
    expect(sameLabUnit(a, b)).toBe(false);
    expect(sameLabUnit(b, a)).toBe(false);
  });

  it("does not turn a unit printed in capitals into one that is not on the list", () => {
    // `G/L` shouted is the blood-count unit, not grams per litre.
    expect(normaliseLabUnit("G/L")).toBe("G/L");
    expect(normaliseLabUnit("MIU/L")).toBe("MIU/L");
  });

  it("keeps enzyme units apart from the micro prefix", () => {
    expect(normaliseLabUnit("u/L")).toBe("u/L");
    expect(normaliseLabUnit("U/L")).toBe("U/L");
  });
});

describe("normaliseLabUnit", () => {
  it("is idempotent", () => {
    for (const unit of [
      "ug/l",
      "MG/DL",
      "mmol/l",
      " x10^3 / uL ",
      "mIU/L",
      "G/L",
    ]) {
      const once = normaliseLabUnit(unit);
      expect(normaliseLabUnit(once)).toBe(once);
    }
  });

  it("names the canonical spelling", () => {
    expect(normaliseLabUnit("mmol/l")).toBe("mmol/L");
    expect(normaliseLabUnit("ug/l")).toBe("µg/L");
    expect(normaliseLabUnit("MG/DL")).toBe("mg/dL");
  });
});

describe("sameLabUnit — units written in Cyrillic", () => {
  it.each([
    ["нг/мл", "ng/mL"],
    ["пг/мл", "pg/mL"],
    ["мг/дл", "mg/dL"],
    ["г/л", "g/L"],
    ["ммоль/л", "mmol/L"],
    ["мкмоль/л", "µmol/L"],
    ["нмоль/л", "nmol/L"],
    ["пмоль/л", "pmol/L"],
    ["мкг/л", "µg/L"],
    ["мМЕ/л", "mIU/L"],
    ["мкМЕ/мл", "µIU/mL"],
    ["МЕ/л", "IU/L"],
    ["Ед/л", "U/L"],
    ["фл", "fL"],
    ["тыс/мкл", "10^3/µL"],
    ["х10^9/л", "x10^9/L"],
    ["мм/ч", "mm/h"],
    [" ммоль / л ", "mmol/l"],
  ])("%s = %s", (a, b) => {
    expect(sameLabUnit(a, b)).toBe(true);
    expect(sameLabUnit(b, a)).toBe(true);
  });

  it.each([
    // Grams per litre is not the 10^9/L of a blood count.
    ["г/л", "G/L"],
    // International units are not milli-international units.
    ["МЕ/л", "mIU/L"],
    ["мМЕ/л", "IU/L"],
    ["ммоль/л", "µmol/L"],
    ["нг/мл", "ng/dL"],
  ])("%s ≠ %s", (a, b) => {
    expect(sameLabUnit(a, b)).toBe(false);
    expect(sameLabUnit(b, a)).toBe(false);
  });

  it("reads only whole words it knows, in their own case", () => {
    // `Г` is not `г`, and a word that only begins like a unit is not one.
    expect(normaliseLabUnit("Г/л")).toBe("Г/L");
    expect(normaliseLabUnit("мгл")).toBe("мгл");
    expect(normaliseLabUnit("копий/мл")).toBe("копий/mL");
  });

  it("is idempotent", () => {
    for (const unit of ["нг/мл", "мкМЕ/мл", "тыс/мкл", "Г/л"]) {
      const once = normaliseLabUnit(unit);
      expect(normaliseLabUnit(once)).toBe(once);
    }
  });
});
