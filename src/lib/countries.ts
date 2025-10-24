import { City, State } from "country-state-city";
import countries from "world-countries";

type ContinentName =
  | "Africa"
  | "Antarctic"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

// Map based on actual regions from world-countries
const continentMap: Record<string, ContinentName> = {
  Africa: "Africa",
  Antarctic: "Antarctic",
  Asia: "Asia",
  Europe: "Europe",
  Oceania: "Oceania",
};

// Subregions for Americas subdivision
const northAmericaSubregions = [
  "North America",
  "Central America",
  "Caribbean",
];

const southAmericaSubregions = ["South America"];

export const countriesByContinent = countries.reduce(
  (acc, country) => {
    let continent: ContinentName | "South America";

    // Handle Americas separately based on subregion
    if (country.region === "Americas") {
      if (southAmericaSubregions.includes(country.subregion)) {
        continent = "South America";
      } else if (northAmericaSubregions.includes(country.subregion)) {
        continent = "North America";
      } else {
        // Fallback (shouldn't happen based on the subregions list)
        continent = "North America";
      }
    } else {
      continent = continentMap[country.region];
    }

    if (!acc[continent]) {
      acc[continent] = [];
    }

    // Get states/provinces for this country
    const states = State.getStatesOfCountry(country.cca2);

    acc[continent].push({
      value: country.cca2,
      label: country.name.common,
      flag: country.flag,
      hasStates: states.length > 0,
      stateCount: states.length,
    });

    return acc;
  },
  {} as Record<
    string,
    Array<{
      value: string;
      label: string;
      flag: string;
      hasStates: boolean;
      stateCount: number;
    }>
  >
);

// Sort countries alphabetically within each continent
Object.keys(countriesByContinent).forEach((continent) => {
  countriesByContinent[continent].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
});

// Remove Antarctic if you don't want it
delete countriesByContinent.Antarctic;

// Function to get states/provinces for a specific country
export const getStatesForCountry = (countryCode: string) => {
  const states = State.getStatesOfCountry(countryCode);
  return states
    .map((state) => ({
      value: state.isoCode,
      label: state.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Function to get cities for a specific state
export const getCitiesForState = (countryCode: string, stateCode: string) => {
  const cities = City.getCitiesOfState(countryCode, stateCode);
  return cities
    .map((city) => ({
      value: city.name,
      label: city.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
