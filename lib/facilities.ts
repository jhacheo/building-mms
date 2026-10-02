export type Facility = {
  name: string;
  address: string;
  aliases: readonly string[];
  photo: string;
  sourcePage: string;
  sourceImage: string;
};

// Presentation metadata only. Matching never creates or changes workspace records.
export const facilities: readonly Facility[] = [
  {
    name: "The Five @ KPD",
    address:
      "45, Jalan Dungun, Bukit Damansara, 50490 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia",
    aliases: ["The Five @ KPD", "The Five at KPD", "The Five KPD"],
    photo: "/facilities/the-five-kpd.jpg",
    sourcePage: "https://selangorproperties.com.my/the-five-at-kpd/",
    sourceImage:
      "https://selangorproperties.com.my/wp-content/uploads/2023/07/DJI_0086-Edit.jpg",
  },
  {
    name: "Menara Milenium",
    address:
      "8, Jalan Damanlela, Pusat Bandar Damansara, 50490 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia",
    aliases: ["Menara Milenium"],
    photo: "/facilities/menara-milenium.jpg",
    sourcePage: "https://selangorproperties.com.my/menara-milenium/",
    sourceImage:
      "https://selangorproperties.com.my/wp-content/uploads/2023/07/IMG_1744-Edit-1.jpg",
  },
  {
    name: "The Stories of Taman Tunku",
    address: "Taman Tunku Off Langgak Tunku 50480 Kuala Lumpur",
    aliases: ["The Stories of Taman Tunku", "The Stories Taman Tunku"],
    photo: "/facilities/the-stories-taman-tunku.jpg",
    sourcePage: "https://selangorproperties.com.my/the-stories-of-taman-tunku/",
    sourceImage:
      "https://selangorproperties.com.my/wp-content/uploads/2023/07/DYP_TheStories_006.jpg",
  },
];

const normalizeFacilityName = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll("@", "at")
    .replace(/[^a-z0-9]/g, "");

export function findFacility(name: string): Facility | undefined {
  const normalized = normalizeFacilityName(name);
  return facilities.find((facility) =>
    facility.aliases.some(
      (alias) => normalizeFacilityName(alias) === normalized,
    ),
  );
}

export function facilityDetails(name: string, floors: number, units: number) {
  if (!findFacility(name)) return `${floors} floors · ${units} units`;
  return `${floors === 1 ? "Floors to confirm" : `${floors} floors`} · ${units === 1 ? "Units to confirm" : `${units} units`}`;
}

export function sortFacilities<T extends { name: string }>(records: T[]): T[] {
  const rank = (name: string) => {
    const facility = findFacility(name);
    return facility ? facilities.indexOf(facility) : facilities.length;
  };
  // Stable sorting preserves the existing order among all other properties.
  return [...records].sort((a, b) => rank(a.name) - rank(b.name));
}
