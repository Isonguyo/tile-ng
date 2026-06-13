export const CATEGORIES = [
  { slug: "electronics", label: "Electronics", icon: "Cpu", type: "goods" },
  { slug: "vehicles", label: "Vehicles", icon: "Car", type: "goods" },
  { slug: "fashion", label: "Fashion", icon: "Shirt", type: "goods" },
  { slug: "home", label: "Home & Furniture", icon: "Sofa", type: "goods" },
  { slug: "phones", label: "Phones & Tablets", icon: "Smartphone", type: "goods" },
  { slug: "property", label: "Property", icon: "Building2", type: "goods" },
  { slug: "plumbing", label: "Plumbing", icon: "Wrench", type: "service" },
  { slug: "tutoring", label: "Tutoring", icon: "BookOpen", type: "service" },
  { slug: "design", label: "Design & Creative", icon: "Palette", type: "service" },
  { slug: "cleaning", label: "Cleaning", icon: "Sparkles", type: "service" },
  { slug: "tech-services", label: "Tech Services", icon: "Code2", type: "service" },
  { slug: "events", label: "Event Planning", icon: "PartyPopper", type: "service" },
] as const;

export const LOCATIONS = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna",
  "Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

export const formatNaira = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);