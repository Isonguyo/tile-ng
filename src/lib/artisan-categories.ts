export interface ArtisanCategory {
  id: string;
  label: string;
}

export const ARTISAN_CATEGORIES: ArtisanCategory[] = [
  { id: "electrician", label: "Electrician" },
  { id: "plumber", label: "Plumber" },
  { id: "carpenter", label: "Carpenter" },
  { id: "mechanic", label: "Mechanic" },
  { id: "ac-technician", label: "AC Technician" },
  { id: "welder", label: "Welder" },
  { id: "painter", label: "Painter" },
  { id: "tiler", label: "Tiler" },
  { id: "roofer", label: "Roofer" },
  { id: "bricklayer", label: "Bricklayer" },

  { id: "tailor", label: "Tailor / Fashion Designer" },
  { id: "shoemaker", label: "Shoemaker" },
  { id: "hairdresser", label: "Hair Stylist" },
  { id: "barber", label: "Barber" },
  { id: "makeup-artist", label: "Makeup Artist" },

  { id: "photographer", label: "Photographer" },
  { id: "videographer", label: "Videographer" },
  { id: "graphic-designer", label: "Graphic Designer" },
  { id: "ui-designer", label: "UI/UX Designer" },
  { id: "web-developer", label: "Web Developer" },
  { id: "mobile-developer", label: "Mobile App Developer" },

  { id: "generator-repair", label: "Generator Repair" },
  { id: "phone-repair", label: "Phone Repair" },
  { id: "computer-repair", label: "Computer Repair" },
  { id: "solar-installer", label: "Solar Installer" },

  { id: "cleaner", label: "Cleaner" },
  { id: "security", label: "Security Service" },
  { id: "chef", label: "Chef / Caterer" },
  { id: "event-planner", label: "Event Planner" },
  { id: "dj", label: "DJ" },
  { id: "mc", label: "Master of Ceremony" },
  { id: "private-teacher", label: "Private Tutor" },
  { id: "laundry", label: "Laundry Service" },
  { id: "delivery", label: "Dispatch Rider" },
  { id: "moving-service", label: "Moving Service" },
];
