import building1 from "@/assets/building-1.jpg";
import building2 from "@/assets/building-2.jpg";
import building3 from "@/assets/building-3.jpg";
import building4 from "@/assets/building-4.jpg";

export type Flat = {
  type: "1BHK" | "2BHK" | "3BHK";
  rent: number;
  available: number;
};

export type Building = {
  id: number;
  name: string;
  location: string;
  image: string;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
  owner: string;
  description: string;
  flats: Flat[];
};

export const BUILDINGS: Building[] = [
  {
    id: 1,
    name: "Aurelia Tower",
    location: "Manhattan, New York",
    image: building1,
    totalValue: 12500000,
    tokenPrice: 250,
    totalTokens: 50000,
    soldTokens: 31240,
    owner: "0x7a23...4f9b",
    description:
      "A 62-storey architectural masterpiece in the heart of Manhattan. Floor-to-ceiling glass, private sky lounges, and an on-site concierge define a new standard of urban luxury.",
    flats: [
      { type: "1BHK", rent: 0.8, available: 4 },
      { type: "2BHK", rent: 1.4, available: 6 },
      { type: "3BHK", rent: 2.2, available: 2 },
    ],
  },
  {
    id: 2,
    name: "Azure Bay Residences",
    location: "Malibu, California",
    image: building2,
    totalValue: 18750000,
    tokenPrice: 375,
    totalTokens: 50000,
    soldTokens: 41880,
    owner: "0x4b91...c7e2",
    description:
      "Beachfront sanctuary featuring private infinity pools, panoramic ocean views, and curated wellness amenities. A rare on-chain stake in the Pacific coastline.",
    flats: [
      { type: "1BHK", rent: 1.2, available: 2 },
      { type: "2BHK", rent: 2.0, available: 5 },
      { type: "3BHK", rent: 3.4, available: 3 },
    ],
  },
  {
    id: 3,
    name: "Meridian Heights",
    location: "Downtown Chicago",
    image: building3,
    totalValue: 8200000,
    tokenPrice: 164,
    totalTokens: 50000,
    soldTokens: 22600,
    owner: "0x9c12...8a4d",
    description:
      "Centrally located high-rise with smart-home automation, electric mobility access, and a rooftop observation deck overlooking Lake Michigan.",
    flats: [
      { type: "1BHK", rent: 0.6, available: 8 },
      { type: "2BHK", rent: 1.0, available: 7 },
      { type: "3BHK", rent: 1.6, available: 4 },
    ],
  },
  {
    id: 4,
    name: "The Vantage Penthouse",
    location: "Dubai Marina, UAE",
    image: building4,
    totalValue: 24300000,
    tokenPrice: 486,
    totalTokens: 50000,
    soldTokens: 47210,
    owner: "0xfa3e...11b9",
    description:
      "Skyline-defining penthouse collection above the Marina. Private elevators, gold-leaf interiors, and 360° terraces redefine vertical living.",
    flats: [
      { type: "1BHK", rent: 1.5, available: 1 },
      { type: "2BHK", rent: 2.6, available: 3 },
      { type: "3BHK", rent: 4.2, available: 2 },
    ],
  },
];

export type OwnedAsset = {
  buildingId: number;
  tokensOwned: number;
  rentedFlats: { type: string; monthlyRent: number }[];
};

export const MY_ASSETS: OwnedAsset[] = [
  { buildingId: 1, tokensOwned: 420, rentedFlats: [{ type: "2BHK", monthlyRent: 1.4 }] },
  { buildingId: 3, tokensOwned: 1280, rentedFlats: [] },
  { buildingId: 4, tokensOwned: 95, rentedFlats: [{ type: "1BHK", monthlyRent: 1.5 }] },
];

export type Proposal = {
  id: number;
  buildingId: number;
  buildingName: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  endsInHours: number;
  status: "Active" | "Passed" | "Rejected";
};

export const PROPOSALS: Proposal[] = [
  {
    id: 1,
    buildingId: 1,
    buildingName: "Aurelia Tower",
    title: "Rooftop solar panel installation",
    description:
      "Install 380kW solar array on roof. Estimated 18% reduction in operational costs and ESG-compliant upgrade for token holders.",
    votesFor: 7820,
    votesAgainst: 1240,
    endsInHours: 42,
    status: "Active",
  },
  {
    id: 2,
    buildingId: 2,
    buildingName: "Azure Bay Residences",
    title: "Convert lobby into private members lounge",
    description:
      "Transform current lobby into a token-holder-only lounge with bar, co-working, and event space. Funded by 2% rental treasury.",
    votesFor: 4310,
    votesAgainst: 5890,
    endsInHours: 18,
    status: "Active",
  },
  {
    id: 3,
    buildingId: 4,
    buildingName: "The Vantage Penthouse",
    title: "Increase quarterly dividend distribution",
    description:
      "Proposal to raise dividend payouts from 65% to 78% of net rental yield, retaining 22% for capital reserves.",
    votesFor: 12450,
    votesAgainst: 980,
    endsInHours: 96,
    status: "Active",
  },
];
