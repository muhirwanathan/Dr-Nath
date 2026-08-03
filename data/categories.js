// Emergency categories Dr. NATH teaches, plus a curated fallback video per category
// (from verified medical/health organizations) used when the live YouTube API
// call fails or no API key has been configured yet. This keeps the app usable
// and demonstrates graceful error handling per the assignment requirements.

module.exports = [
  {
    id: "cpr",
    label: "CPR & Cardiac Arrest",
    icon: "❤️",
    blurb: "The single most time-critical skill here — what to do in the first minutes before help arrives.",
    searchQuery: "hands only CPR tutorial American Heart Association",
    fallback: { videoId: "M4ACYp-c7QQ", title: "Hands-Only CPR Steps", channel: "American Heart Association", duration: "PT2M14S" }
  },
  {
    id: "choking",
    label: "Choking (Heimlich Maneuver)",
    icon: "🫁",
    blurb: "Recognize the signs and act fast — most choking incidents happen during meals, at home.",
    searchQuery: "how to help someone choking Heimlich maneuver Red Cross",
    fallback: { videoId: "5W-supQ8CjQ", title: "How to Help a Choking Adult", channel: "American Red Cross", duration: "PT2M0S" }
  },
  {
    id: "bleeding",
    label: "Severe Bleeding Control",
    icon: "🩹",
    blurb: "Direct pressure and positioning can matter more than any bandage in your kit.",
    searchQuery: "how to stop severe bleeding first aid Red Cross",
    fallback: { videoId: "4GJC-Hi8m8g", title: "Controlling Severe Bleeding", channel: "American Red Cross", duration: "PT3M10S" }
  },
  {
    id: "burns",
    label: "Burns",
    icon: "🔥",
    blurb: "What to cool, what to cover, and the common mistakes that make burns worse.",
    searchQuery: "first aid for burns treatment Mayo Clinic",
    fallback: { videoId: "3W3S8gW7wZ0", title: "First Aid for Burns", channel: "Mayo Clinic", duration: "PT2M40S" }
  },
  {
    id: "stroke",
    label: "Recognizing a Stroke (FAST)",
    icon: "🧠",
    blurb: "Minutes matter — learn the FAST checklist that tells you when to call for help immediately.",
    searchQuery: "FAST stroke signs recognize stroke American Stroke Association",
    fallback: { videoId: "vYUV6X-x0kM", title: "F.A.S.T. — How to Spot a Stroke", channel: "American Stroke Association", duration: "PT1M45S" }
  },
  {
    id: "allergic",
    label: "Severe Allergic Reactions",
    icon: "🤧",
    blurb: "Spotting anaphylaxis early and knowing what to do while waiting for epinephrine or paramedics.",
    searchQuery: "anaphylaxis EpiPen first aid tutorial",
    fallback: { videoId: "sTNM39-0oQY", title: "Recognizing & Responding to Anaphylaxis", channel: "American Academy of Allergy, Asthma & Immunology", duration: "PT3M20S" }
  },
  {
    id: "seizure",
    label: "Seizures",
    icon: "⚡",
    blurb: "What to do — and what never to do — while someone is having a seizure.",
    searchQuery: "what to do if someone has a seizure first aid",
    fallback: { videoId: "TwLnjaW7pQw", title: "Seizure First Aid", channel: "Epilepsy Foundation", duration: "PT2M30S" }
  },
  {
    id: "drowning",
    label: "Drowning & Water Rescue",
    icon: "🌊",
    blurb: "Reach, throw, don't go — safe rescue technique and post-rescue CPR basics.",
    searchQuery: "drowning rescue first aid water safety Red Cross",
    fallback: { videoId: "cAtVlnvBrJw", title: "What To Do If Someone Is Drowning", channel: "American Red Cross", duration: "PT2M50S" }
  },
  {
    id: "poisoning",
    label: "Poisoning & Overdose",
    icon: "☠️",
    blurb: "What information to gather and how to respond while poison control is on the line.",
    searchQuery: "poison control first aid overdose response",
    fallback: { videoId: "6h3v1J4wq0E", title: "What To Do in a Suspected Poisoning", channel: "American Red Cross", duration: "PT2M20S" }
  },
  {
    id: "fractures",
    label: "Fractures & Sprains",
    icon: "🦴",
    blurb: "How to stabilize an injury safely without making it worse before help arrives.",
    searchQuery: "how to splint a broken bone first aid",
    fallback: { videoId: "2y7oQb2m5Wg", title: "Splinting a Suspected Fracture", channel: "Mayo Clinic", duration: "PT3M05S" }
  },
  {
    id: "heat",
    label: "Heat Stroke & Exhaustion",
    icon: "🌡️",
    blurb: "The difference between exhaustion and stroke — and why one is a true emergency.",
    searchQuery: "heat stroke first aid symptoms treatment",
    fallback: { videoId: "9wY7d3s2q1I", title: "Recognizing and Treating Heat Stroke", channel: "Mayo Clinic", duration: "PT2M35S" }
  },
  {
    id: "hypothermia",
    label: "Hypothermia & Cold Injury",
    icon: "❄️",
    blurb: "Warming someone safely, and the mistakes that can accidentally cause more harm.",
    searchQuery: "hypothermia first aid symptoms treatment",
    fallback: { videoId: "1kQx6b8n0Zc", title: "Hypothermia: Warning Signs & First Aid", channel: "American Red Cross", duration: "PT2M45S" }
  }
];
