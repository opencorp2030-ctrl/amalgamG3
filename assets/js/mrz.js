// Parser MRZ (zone de lecture optique), norme ICAO 9303 utilisée par les documents d'identité de la quasi-totalité
// des pays du monde (passeports notamment, où le format TD3 est strictement universel) — supporte :
//   TD3 : passeport, 2 lignes de 44 caractères (tous pays)
//   TD1 : carte d'identité, 3 lignes de 30 caractères (ex : cartes UE/Schengen, et de nombreux autres pays)
//   TD2 : carte d'identité / titre de séjour / visa, 2 lignes de 36 caractères (ex : ancienne carte d'identité allemande)
// Lecture optique du texte imprimé uniquement — ne lit pas la puce (nécessite une app native, cf. README).

function mrzCharValue(ch) {
  if (ch === "<") return 0;
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55; // A=10 ... Z=35
  return 0;
}

function mrzCheckDigit(str) {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += mrzCharValue(str[i]) * weights[i % 3];
  }
  return sum % 10;
}

// preferFuture=false pour une date de naissance (ne peut pas être dans le futur),
// preferFuture=true pour une date d'expiration (rarement dans le passé lointain).
function mrzDateToISO(yymmdd, preferFuture) {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);

  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  let year = currentCentury + yy;

  if (preferFuture) {
    if (year < currentYear - 5) year += 100;
  } else {
    if (year > currentYear) year -= 100;
  }

  return `${year}-${mm}-${dd}`;
}

function cleanName(field) {
  const [surname, given] = field.split("<<");
  const format = (s) => (s || "").replace(/</g, " ").trim().replace(/\s+/g, " ");
  const surnameClean = format(surname);
  const givenClean = format(given);
  return { surname: surnameClean, given: givenClean, full: [givenClean, surnameClean].filter(Boolean).join(" ") };
}

// Retourne null si les lignes ne ressemblent pas à une MRZ TD3 valide.
function parseTD3(rawLine1, rawLine2) {
  const line1 = (rawLine1 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(44, "<").slice(0, 44);
  const line2 = (rawLine2 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(44, "<").slice(0, 44);

  if (line1[0] !== "P") return null;

  const issuingCountry = line1.slice(2, 5).replace(/</g, "");
  const nameField = line1.slice(5, 44);
  const { full: fullName, surname, given } = cleanName(nameField);

  const passportNumber = line2.slice(0, 9).replace(/</g, "");
  const passportNumberCheck = line2[9];
  const nationality = line2.slice(10, 13).replace(/</g, "");
  const dobRaw = line2.slice(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20];
  const expiryRaw = line2.slice(21, 27);
  const expiryCheck = line2[27];
  const personalNumber = line2.slice(28, 42).replace(/</g, "");
  const personalNumberCheck = line2[42];
  const compositeCheck = line2[43];

  const passportNumberValid = String(mrzCheckDigit(line2.slice(0, 9))) === passportNumberCheck;
  const dobValid = String(mrzCheckDigit(dobRaw)) === dobCheck;
  const expiryValid = String(mrzCheckDigit(expiryRaw)) === expiryCheck;

  const compositeStr =
    line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43);
  const compositeValid = String(mrzCheckDigit(compositeStr)) === compositeCheck;

  const checksumValid = passportNumberValid && dobValid && expiryValid && compositeValid;

  return {
    document_type: "passport",
    issuing_country: issuingCountry,
    nationality,
    surname,
    given_names: given,
    full_name: fullName,
    document_number: passportNumber,
    date_of_birth: mrzDateToISO(dobRaw, false),
    expiry_date: mrzDateToISO(expiryRaw, true),
    sex: sex === "<" ? null : sex,
    personal_number: personalNumber || null,
    checksum_valid: checksumValid,
    raw_line1: line1,
    raw_line2: line2,
  };
}

// Retourne null si les lignes ne ressemblent pas à une MRZ TD1 valide (carte d'identité).
function parseTD1(rawLine1, rawLine2, rawLine3) {
  const line1 = (rawLine1 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(30, "<").slice(0, 30);
  const line2 = (rawLine2 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(30, "<").slice(0, 30);
  const line3 = (rawLine3 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(30, "<").slice(0, 30);

  if (line1[0] !== "I" && line1[0] !== "A" && line1[0] !== "C") return null;

  const issuingCountry = line1.slice(2, 5).replace(/</g, "");
  const documentNumberRaw = line1.slice(5, 14);
  const documentNumberCheck = line1[14];
  const documentNumber = documentNumberRaw.replace(/</g, "");

  const dobRaw = line2.slice(0, 6);
  const dobCheck = line2[6];
  const sex = line2[7];
  const expiryRaw = line2.slice(8, 14);
  const expiryCheck = line2[14];
  const nationality = line2.slice(15, 18).replace(/</g, "");
  const compositeCheck = line2[29];

  const { full: fullName, surname, given } = cleanName(line3);

  const documentNumberValid = String(mrzCheckDigit(documentNumberRaw)) === documentNumberCheck;
  const dobValid = String(mrzCheckDigit(dobRaw)) === dobCheck;
  const expiryValid = String(mrzCheckDigit(expiryRaw)) === expiryCheck;

  const compositeStr = line1.slice(5, 30) + line2.slice(0, 7) + line2.slice(8, 15) + line2.slice(18, 29);
  const compositeValid = String(mrzCheckDigit(compositeStr)) === compositeCheck;

  const checksumValid = documentNumberValid && dobValid && expiryValid && compositeValid;

  return {
    document_type: "id_card",
    issuing_country: issuingCountry,
    nationality,
    surname,
    given_names: given,
    full_name: fullName,
    document_number: documentNumber,
    date_of_birth: mrzDateToISO(dobRaw, false),
    expiry_date: mrzDateToISO(expiryRaw, true),
    sex: sex === "<" ? null : sex,
    personal_number: null,
    checksum_valid: checksumValid,
    raw_line1: line1,
    raw_line2: line2,
    raw_line3: line3,
  };
}

// Retourne null si les lignes ne ressemblent pas à une MRZ TD2 valide (carte d'identité / titre de séjour / visa).
function parseTD2(rawLine1, rawLine2) {
  const line1 = (rawLine1 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(36, "<").slice(0, 36);
  const line2 = (rawLine2 || "").toUpperCase().replace(/[^A-Z0-9<]/g, "").padEnd(36, "<").slice(0, 36);

  if (!["I", "A", "C", "V"].includes(line1[0])) return null;

  const issuingCountry = line1.slice(2, 5).replace(/</g, "");
  const { full: fullName, surname, given } = cleanName(line1.slice(5, 36));

  const documentNumberRaw = line2.slice(0, 9);
  const documentNumberCheck = line2[9];
  const documentNumber = documentNumberRaw.replace(/</g, "");
  const nationality = line2.slice(10, 13).replace(/</g, "");
  const dobRaw = line2.slice(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20];
  const expiryRaw = line2.slice(21, 27);
  const expiryCheck = line2[27];
  const compositeCheck = line2[35];

  const documentNumberValid = String(mrzCheckDigit(documentNumberRaw)) === documentNumberCheck;
  const dobValid = String(mrzCheckDigit(dobRaw)) === dobCheck;
  const expiryValid = String(mrzCheckDigit(expiryRaw)) === expiryCheck;

  const compositeStr = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 35);
  const compositeValid = String(mrzCheckDigit(compositeStr)) === compositeCheck;

  const checksumValid = documentNumberValid && dobValid && expiryValid && compositeValid;

  return {
    document_type: "id_card",
    issuing_country: issuingCountry,
    nationality,
    surname,
    given_names: given,
    full_name: fullName,
    document_number: documentNumber,
    date_of_birth: mrzDateToISO(dobRaw, false),
    expiry_date: mrzDateToISO(expiryRaw, true),
    sex: sex === "<" ? null : sex,
    personal_number: null,
    checksum_valid: checksumValid,
    raw_line1: line1,
    raw_line2: line2,
  };
}

// Détecte le format (TD1 à 3 lignes, ou TD2/TD3 à 2 lignes selon la longueur) dans un bloc de texte OCR brut,
// puis parse et renvoie le résultat — ou null si rien d'exploitable n'a été trouvé. Couvre les formats de documents
// d'identité utilisés dans la quasi-totalité des pays (norme ICAO 9303).
function parseMrzFromText(text) {
  const candidates = text
    .split("\n")
    .map((l) => l.toUpperCase().replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.length >= 28 && (l.match(/</g) || []).length >= 2);

  if (candidates.length >= 3) {
    const [l1, l2, l3] = candidates.slice(-3);
    const td1 = parseTD1(l1, l2, l3);
    if (td1) return td1;
  }
  if (candidates.length >= 2) {
    const [l1, l2] = candidates.slice(-2);
    // La longueur réelle (avant complètement/troncature) distingue TD2 (36) de TD3 (44).
    const avgLen = (l1.length + l2.length) / 2;
    const tryOrder = avgLen <= 40 ? [parseTD2, parseTD3] : [parseTD3, parseTD2];
    for (const parser of tryOrder) {
      const result = parser(l1, l2);
      if (result) return result;
    }
  }
  return null;
}