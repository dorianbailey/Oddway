declare module "all-the-cities" {
  /** A populated place from the bundled gazetteer. */
  interface City {
    name: string;
    country: string;
    /** Two-letter state code for US entries. */
    adminCode: string;
    population: number;
    loc: { type: "Point"; coordinates: [number, number] };
  }
  const cities: City[];
  export default cities;
}
