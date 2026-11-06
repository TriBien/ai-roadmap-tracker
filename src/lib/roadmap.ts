import roadmapJson from "../data/roadmap.json";

export interface RoadmapSection {
  key: string;
  label: string;
  items: string[];
}

export interface RoadmapWeek {
  id: string;
  number: number;
  title: string;
  sections: RoadmapSection[];
}

export interface RoadmapPhase {
  id: string;
  number: number;
  name: string;
  weeks: RoadmapWeek[];
}

export interface Roadmap {
  title: string;
  phases: RoadmapPhase[];
}

export const roadmap = roadmapJson as Roadmap;
