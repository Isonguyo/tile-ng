export interface ArtisanCategory {
  id: string;
  label: string;
  icon: string;
}

export const ARTISAN_CATEGORIES: ArtisanCategory[] = [
  { id: "electrician", label: "Electrician", icon: "⚡" },
  { id: "plumber", label: "Plumber", icon: "🚰" },
  { id: "carpenter", label: "Carpenter", icon: "🪚" },
  { id: "mechanic", label: "Mechanic", icon: "🔧" },
  { id: "ac-technician", label: "AC Technician", icon: "❄️" },
  { id: "welder", label: "Welder", icon: "🔥" },
  { id: "painter", label: "Painter", icon: "🎨" },
  { id: "tiler", label: "Tiler", icon: "🧱" },
  { id: "roofer", label: "Roofer", icon: "🏠" },
  { id: "bricklayer", label: "Bricklayer", icon: "🧱" },

  { id: "tailor", label: "Tailor / Fashion Designer", icon: "🧵" },
  { id: "shoemaker", label: "Shoemaker", icon: "👞" },
  { id: "hairdresser", label: "Hair Stylist", icon: "💇" },
  { id: "barber", label: "Barber", icon: "💈" },
  { id: "makeup-artist", label: "Makeup Artist", icon: "💄" },

  { id: "photographer", label: "Photographer", icon: "📷" },
  { id: "videographer", label: "Videographer", icon: "🎥" },
  { id: "graphic-designer", label: "Graphic Designer", icon: "🎨" },
  { id: "ui-designer", label: "UI/UX Designer", icon: "🖥️" },
  { id: "web-developer", label: "Web Developer", icon: "💻" },
  { id: "mobile-developer", label: "Mobile App Developer", icon: "📱" },

  { id: "generator-repair", label: "Generator Repair", icon: "⚙️" },
  { id: "phone-repair", label: "Phone Repair", icon: "📱" },
  { id: "computer-repair", label: "Computer Repair", icon: "💻" },
  { id: "solar-installer", label: "Solar Installer", icon: "☀️" },

  { id: "cleaner", label: "Cleaner", icon: "🧹" },
  { id: "security", label: "Security Service", icon: "🛡️" },
  { id: "chef", label: "Chef / Caterer", icon: "👨‍🍳" },
  { id: "event-planner", label: "Event Planner", icon: "🎉" },
  { id: "dj", label: "DJ", icon: "🎧" },
  { id: "mc", label: "Master of Ceremony", icon: "🎤" },
  { id: "private-teacher", label: "Private Tutor", icon: "📚" },
  { id: "laundry", label: "Laundry Service", icon: "🧺" },
  { id: "delivery", label: "Dispatch Rider", icon: "🏍️" },
  { id: "moving-service", label: "Moving Service", icon: "🚚" },
];
