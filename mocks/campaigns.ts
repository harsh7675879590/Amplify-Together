import { Campaign, CampaignReport } from "../types";
import { estimateReach } from "../lib/reach";

function createCampaignWithReach(c: Omit<Campaign, "percentFunded" | "estimatedReachMid" | "estimatedReachRange">): Campaign {
  const percentFunded = c.fundingGoal > 0 ? Math.round((c.amountRaised / c.fundingGoal) * 100) : 0;
  // 95% of raised amount is available for ads (after 5% platform fee)
  const adDollars = c.amountRaised * 0.95;
  const reach = estimateReach(adDollars > 0 ? adDollars : c.fundingGoal * 0.95);

  return {
    ...c,
    percentFunded,
    estimatedReachMid: reach.mid,
    estimatedReachRange: reach.formattedRange,
  };
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  // 1. Health - Available for funding (90% funded)
  createCampaignWithReach({
    id: "camp-01-water",
    title: "Clean drinking water in every public school",
    category: "Health",
    creatorName: "Safe Schools Coalition",
    creatorType: "nonprofit",
    summary:
      "Water sampling across 1,200 public school taps uncovered lead levels 3x federal safety limits. We are running targeted ads to inform parents and local boards.",
    coverImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 3000,
    amountRaised: 2700, // 90%
    deadline: "2025-05-15T00:00:00Z",
    adHeadline: "Is your child's school water lead-free?",
    adDescription: "State testing found elevated lead in local classrooms. See the public data for your district.",
    ctaText: "Check Your School",
    targetLocations: ["Tri-County Metro Area"],
    targetInterests: ["Parents", "Education Policy", "Public Health"],
    targetChannels: ["Meta Feeds", "Local News Websites"],
    durationDays: 21,
    story: [
      { type: "heading", text: "The Water Quality Crisis in Classroom Faucets" },
      {
        type: "paragraph",
        text: "Independent sampling uncovered lead levels exceeding 15 parts per billion in 340+ drinking fountains and cafeteria sinks across 42 regional schools.",
      },
      { type: "stat", value: "15 ppb", label: "Lead limit threshold exceeded in 340+ fixtures" },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80",
        caption: "Testing bottles sealed for certified state laboratory analysis.",
        credit: "Tri-County Clean Water Lab",
      },
      {
        type: "paragraph",
        text: "The findings were buried in district committee minutes. Pooling advertising dollars allows us to deliver verified safety audits directly into parents' social feeds.",
      },
    ],
    sources: [
      { title: "State Department of Health Lead Sampling Registry 2024", url: "https://health.state.gov/schools-lead" },
      { title: "EPA National Primary Drinking Water Regulations", url: "https://epa.gov/water-regulations" },
      { title: "University Environmental Health Lab Audit", url: "https://enviro-lab.edu/reports/2024" },
    ],
    createdAt: "2025-03-01T12:00:00Z",
  }),

  // 2. Public Policy - Available for funding (62% funded)
  createCampaignWithReach({
    id: "camp-02-transit",
    title: "Redraw the bus network around where people work",
    category: "Public Policy",
    creatorName: "Regional Transit Riders",
    creatorType: "community_group",
    summary:
      "Bus routes have not updated since 1984 while jobs shifted 15 miles east. We are amplifying transit data before the upcoming city council vote.",
    coverImageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 2500,
    amountRaised: 1550, // 62%
    deadline: "2025-05-20T00:00:00Z",
    adHeadline: "Why does a 20-minute drive take 90 minutes by bus?",
    adDescription: "Our transit map is 40 years old. See how rerouting connects 45,000 shift workers.",
    ctaText: "View Transit Proposal",
    targetLocations: ["Industrial Park Corridor", "Downtown Transit Hub"],
    targetInterests: ["Commuters", "Urban Planning", "Public Transit"],
    targetChannels: ["Mobile App Banners", "Social Feeds"],
    durationDays: 18,
    story: [
      { type: "heading", text: "A Transit System Stranded in 1984" },
      {
        type: "paragraph",
        text: "Over 62% of logistics and service jobs moved to the eastern distribution center, where zero direct bus lines operate.",
      },
      { type: "stat", value: "78 min", label: "Average bus commute time vs 22 min drive" },
      {
        type: "paragraph",
        text: "Workers lose up to four hours daily transferring between disconnected lines. Community-funded ads will reach 180,000 regional commuters to mandate realigned routes.",
      },
    ],
    sources: [
      { title: "Metropolitan Transportation Authority Commute Study", url: "https://mta.gov/studies/2023" },
      { title: "Regional Chamber of Commerce Shift Worker Survey", url: "https://chamber.org/workforce" },
    ],
    createdAt: "2025-03-03T10:00:00Z",
  }),

  // 3. Economic Policy - Available for funding (30% funded)
  createCampaignWithReach({
    id: "camp-03-repair",
    title: "Let farmers repair the equipment they own",
    category: "Economic Policy",
    creatorName: "Heartland Family Farmers Union",
    creatorType: "nonprofit",
    summary:
      "Tractor manufacturers lock essential diagnostics behind dealer paywalls, triggering week-long harvest delays. We are running ads to advance fair repair laws.",
    coverImageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 4000,
    amountRaised: 1200, // 30%
    deadline: "2025-05-28T00:00:00Z",
    adHeadline: "Farmers shouldn't wait 10 days for a software unlock.",
    adDescription: "Support the Agricultural Right to Repair Act. See how software locks hurt independent agriculture.",
    ctaText: "Read Farmer Testimonies",
    targetLocations: ["Agricultural Districts", "State Capital Metro"],
    targetInterests: ["Agriculture", "Small Business", "Property Rights"],
    targetChannels: ["Rural Radio Digital Feeds", "Facebook Feeds"],
    durationDays: 30,
    story: [
      { type: "heading", text: "Locked Out of the Machines They Purchased" },
      {
        type: "paragraph",
        text: "When a minor sensor fails, modern tractors shut down completely until a certified dealer enters an encrypted software code.",
      },
      { type: "stat", value: "$3,200", label: "Average dealership service call fee for a software reset" },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80",
        caption: "Combine harvester idling during peak dry-weather harvest window.",
        credit: "Farm Bureau Archive",
      },
    ],
    sources: [
      { title: "FTC 'Nixing the Fix' Report on Repair Restrictions", url: "https://ftc.gov/reports/repair-limits" },
      { title: "State Agricultural Committee Hearing Transcript", url: "https://legislature.state.gov/hearings/ag-repair" },
    ],
    createdAt: "2025-03-05T08:30:00Z",
  }),

  // 4. Community - Available for funding (5% funded)
  createCampaignWithReach({
    id: "camp-04-shelter",
    title: "Keep the winter shelter open past 7am",
    category: "Community",
    creatorName: "Downtown Compassion Coalition",
    creatorType: "community_group",
    summary:
      "Evicting unhoused residents into freezing dawn temperatures spikes hypothermia ER visits. Community ads will present hospital cost data to city leaders.",
    coverImageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 2000,
    amountRaised: 100, // 5%
    deadline: "2025-06-01T00:00:00Z",
    adHeadline: "7:00 AM. 14°F. Nowhere to go.",
    adDescription: "Closing warming centers at dawn forces frostbite hospitalizations that cost taxpayers $4.2M.",
    ctaText: "See Shelter Impact",
    targetLocations: ["City Center", "Civic Center District"],
    targetInterests: ["Healthcare", "Civic Policy", "Local Government"],
    targetChannels: ["Instagram", "Digital Display Ads"],
    durationDays: 25,
    story: [
      { type: "heading", text: "The Dangerous Dawn Eviction Rule" },
      {
        type: "paragraph",
        text: "Over 160 individuals are discharged every winter morning at 7:00 AM regardless of sub-zero temperatures or storm alerts.",
      },
      { type: "stat", value: "14°F", label: "Average January dawn temperature in city center" },
    ],
    sources: [
      { title: "County Hospital Emergency Frostbite Admissions Audit", url: "https://countyhealth.org/reports/frostbite" },
      { title: "National Coalition for the Homeless Shelter Guidelines", url: "https://nationalhomeless.org/guidelines" },
    ],
    createdAt: "2025-03-10T14:15:00Z",
  }),

  // 5. Education - Available for funding (62% funded)
  createCampaignWithReach({
    id: "camp-05-libraries",
    title: "Restore weekend hours at suburban branch libraries",
    category: "Education",
    creatorName: "Marcus Vance (Student Advocate)",
    creatorType: "individual",
    summary:
      "Budget cuts closed 14 branch libraries on weekends, cutting off thousands of students without home broadband from essential study spaces.",
    coverImageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 1800,
    amountRaised: 1116, // 62%
    deadline: "2025-05-22T00:00:00Z",
    adHeadline: "Where do students without Wi-Fi study on weekends?",
    adDescription: "Weekend branch library closures cut thousands of children off from digital learning resources.",
    ctaText: "Support Library Access",
    targetLocations: ["Suburban School Districts"],
    targetInterests: ["Parents", "Libraries", "Youth Education"],
    targetChannels: ["Social Media", "Search Placements"],
    durationDays: 21,
    story: [
      { type: "heading", text: "The Weekend Digital Divide" },
      {
        type: "paragraph",
        text: "Over 8,000 suburban households have no broadband internet access. Local branch libraries were their only gateway for homework and college applications.",
      },
      { type: "stat", value: "8,200", label: "Students impacted by weekend closures" },
    ],
    sources: [
      { title: "Urban Libraries Council Digital Equity Brief 2024", url: "https://urbanlibraries.org/digital-divide" },
      { title: "Public School Homework Connectivity Report", url: "https://schools.org/broadband-survey" },
    ],
    createdAt: "2025-03-08T09:00:00Z",
  }),

  // 6. Science - Available for funding (30% funded)
  createCampaignWithReach({
    id: "camp-06-ai-ethics",
    title: "Mandate AI transparency in automated job screenings",
    category: "Science",
    creatorName: "Algorithmic Justice Project",
    creatorType: "nonprofit",
    summary:
      "More than 70% of large employers filter candidate resumes with uninspected AI algorithms. We are running ads in tech corridors demanding open audits.",
    coverImageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 3500,
    amountRaised: 1050, // 30%
    deadline: "2025-06-05T00:00:00Z",
    adHeadline: "Was your application rejected by an unchecked algorithm?",
    adDescription: "New state bills demand algorithmic transparency for job seekers. Learn what rights you have.",
    ctaText: "Read the Legislative Proposal",
    targetLocations: ["Tech Hub Metros"],
    targetInterests: ["Job Seekers", "Tech Policy", "Workplace Rights"],
    targetChannels: ["LinkedIn Display", "Tech News Sites"],
    durationDays: 30,
    story: [
      { type: "heading", text: "The Invisible Gatekeeper Behind Hiring" },
      {
        type: "paragraph",
        text: "Automated candidate screening tools frequently penalize non-traditional employment histories without human oversight or appeal mechanisms.",
      },
      { type: "stat", value: "72%", label: "Large employers deploying automated resume screening" },
    ],
    sources: [
      { title: "EEOC Guidance on Artificial Intelligence in Employment", url: "https://eeoc.gov/ai-guidance" },
      { title: "MIT CSAIL Audit of Commercial Screening Tools", url: "https://csail.mit.edu/hiring-algorithms" },
    ],
    createdAt: "2025-03-11T16:00:00Z",
  }),

  // 7. Arts & Culture - Available for funding (90% funded)
  createCampaignWithReach({
    id: "camp-07-arts",
    title: "Save the historic Rialto Community Theatre",
    category: "Arts & Culture",
    creatorName: "Historic Downtown Arts Trust",
    creatorType: "nonprofit",
    summary:
      "A 95-year-old independent cinema and stage is slated for demolition. Targeted ads will alert neighborhood voters before the landmark zoning vote.",
    coverImageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=80",
    status: "available_for_funding",
    fundingGoal: 2000,
    amountRaised: 1800, // 90%
    deadline: "2025-05-18T00:00:00Z",
    adHeadline: "95 years of community cinema shouldn't become condos.",
    adDescription: "The Rialto Theatre is facing demolition. See the preservation proposal before Tuesday's landmark hearing.",
    ctaText: "View Preservation Plan",
    targetLocations: ["Downtown Historic District"],
    targetInterests: ["Arts & Culture", "Architecture", "Local History"],
    targetChannels: ["Instagram", "Local News Websites"],
    durationDays: 14,
    story: [
      { type: "heading", text: "A Century of Cultural Memory on the Line" },
      {
        type: "paragraph",
        text: "The Rialto is the last remaining Art Deco theatre in our metropolitan area, hosting 120+ youth arts performances annually.",
      },
      { type: "stat", value: "1929", label: "Year founded as an independent community venue" },
    ],
    sources: [
      { title: "National Trust for Historic Preservation Landmark Assessment", url: "https://savingplaces.org/rialto" },
      { title: "City Landmark Preservation Commission Docket #410", url: "https://city.gov/preservation/docket-410" },
    ],
    createdAt: "2025-03-06T11:00:00Z",
  }),

  // 8. Environment - Promoting Live (100% funded)
  createCampaignWithReach({
    id: "camp-08-forest",
    title: "Protect the Old Growth Watershed from clear-cutting",
    category: "Environment",
    creatorName: "Cascadia Watershed Protection",
    creatorType: "nonprofit",
    summary:
      "A 400-acre timber sale permits clear-cutting on slopes directly above the municipal reservoir. Community ads are running in downstream voter districts.",
    coverImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&auto=format&fit=crop&q=80",
    status: "promoting",
    fundingGoal: 4200,
    amountRaised: 4200, // 100%
    deadline: "2025-04-30T00:00:00Z",
    adHeadline: "Your tap water begins in these 400 acres.",
    adDescription: "Logging steep slopes increases reservoir sediment loads by 300%. Read the hydrologist study.",
    ctaText: "Protect Our Reservoir",
    targetLocations: ["Downstream Municipal Water Districts"],
    targetInterests: ["Conservation", "Clean Water", "Local Government"],
    targetChannels: ["Instagram Feeds", "Digital Display Billboards"],
    durationDays: 28,
    story: [
      { type: "heading", text: "400 Acres That Naturally Filter Drinking Water" },
      {
        type: "paragraph",
        text: "The timber sale permits clear-cutting on 35-degree slopes located 800 yards upstream from the municipal intake pipe.",
      },
      { type: "stat", value: "300%", label: "Projected increase in sediment load post logging" },
    ],
    sources: [
      { title: "Hydrology & Sedimentation Study of Upper Basin", url: "https://watershed-science.org/upper-basin" },
      { title: "US Forest Service Environmental Assessment #884", url: "https://fs.usda.gov/projects/884" },
    ],
    createdAt: "2025-02-15T10:00:00Z",
  }),

  // 9. Business - Promoting Live (100% funded)
  createCampaignWithReach({
    id: "camp-09-delivery",
    title: "Cap third-party food app delivery fees at 15%",
    category: "Business",
    creatorName: "Main Street Restaurant Alliance",
    creatorType: "business",
    summary:
      "Monopoly delivery delivery apps charge independent restaurants up to 34% commissions. We are running ads to advance fair local fee caps.",
    coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80",
    status: "promoting",
    fundingGoal: 3200,
    amountRaised: 3200, // 100%
    deadline: "2025-05-01T00:00:00Z",
    adHeadline: "Did you know delivery apps take 30% of your meal cost?",
    adDescription: "Support independent neighbourhood restaurants. See how fee caps keep local kitchens open.",
    ctaText: "Support Local Kitchens",
    targetLocations: ["Metropolitan Dining Districts"],
    targetInterests: ["Food & Dining", "Small Business", "Local Economy"],
    targetChannels: ["Social Feeds", "Search Placements"],
    durationDays: 21,
    story: [
      { type: "heading", text: "The Hidden Commission Crushing Local Eateries" },
      {
        type: "paragraph",
        text: "Most customers believe their delivery fee covers app costs, unaware that platforms deduct another 30% to 34% from the restaurant's food bill.",
      },
      { type: "stat", value: "34%", label: "Peak commission extracted from local family kitchens" },
    ],
    sources: [
      { title: "National Restaurant Association Delivery Commission Study", url: "https://restaurant.org/delivery-fees" },
      { title: "Municipal Economic Development Commission Brief", url: "https://city.gov/economic/restaurant-caps" },
    ],
    createdAt: "2025-02-20T14:00:00Z",
  }),

  // 10. Environment - Completed with Report
  createCampaignWithReach({
    id: "camp-10-solar",
    title: "End punitive utility fees on rooftop solar",
    category: "Environment",
    creatorName: "Clean Energy Access Coalition",
    creatorType: "community_group",
    summary:
      "Monopoly electric utilities filed a $65/month fixed penalty on families with rooftop solar panels. Our community ads successfully reached 371,000 residents.",
    coverImageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1000&auto=format&fit=crop&q=80",
    status: "completed",
    fundingGoal: 3000,
    amountRaised: 3000, // 100%
    deadline: "2025-03-01T00:00:00Z",
    adHeadline: "Why are solar owners being taxed $780 a year?",
    adDescription: "Utilities want to penalize homeowners who generate clean energy. See the public docket.",
    ctaText: "Read Public Utility Docket",
    targetLocations: ["Statewide Utility Service Territory"],
    targetInterests: ["Solar Energy", "Consumer Rights", "Homeownership"],
    targetChannels: ["Meta Feeds", "Search Ads"],
    durationDays: 21,
    story: [
      { type: "heading", text: "Penalizing Homeowners for Generating Clean Power" },
      {
        type: "paragraph",
        text: "Under the guise of 'grid modernization', the regional utility proposed an unprecedented monthly surcharge that wipes out the economic payback of rooftop solar.",
      },
      { type: "stat", value: "$780", label: "Proposed annual penalty on clean rooftop solar families" },
    ],
    sources: [
      { title: "Public Utilities Commission Docket #2024-098", url: "https://puc.state.gov/dockets/2024-098" },
      { title: "Consumer Energy Rights Association Policy Brief", url: "https://consumerenergy.org/rooftop-fairness" },
    ],
    createdAt: "2025-01-10T12:00:00Z",
  }),

  // 11. Public Policy - Completed
  createCampaignWithReach({
    id: "camp-11-parks",
    title: "Protect public access to the municipal waterfront",
    category: "Public Policy",
    creatorName: "Harbor Citizens Action",
    creatorType: "community_group",
    summary:
      "A proposed luxury private marina development would privatize 2 miles of public shoreline path. Community-funded ads ran across county voter districts.",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
    status: "completed",
    fundingGoal: 2800,
    amountRaised: 2800,
    deadline: "2025-02-28T00:00:00Z",
    adHeadline: "Keep our waterfront trail open to everyone.",
    adDescription: "Private developers want to enclose the public boardwalk. See the coastal commission survey.",
    ctaText: "View Trail Survey",
    targetLocations: ["Coastal County Districts"],
    targetInterests: ["Outdoors", "Parks", "Local Government"],
    targetChannels: ["Social Feeds", "Digital Display"],
    durationDays: 21,
    story: [
      { type: "heading", text: "Two Miles of Public Shoreline at Risk" },
      {
        type: "paragraph",
        text: "The harbor path has provided free recreational access to families for over 60 years. Our campaign distributed public land surveys to 280,000 residents.",
      },
      { type: "stat", value: "2.4 mi", label: "Public recreational trail facing privatization" },
    ],
    sources: [
      { title: "State Coastal Commission Public Trust Report", url: "https://coastal.state.gov/public-trust" },
      { title: "County Parks & Recreation Open Space Survey", url: "https://countyparks.org/harbor-survey" },
    ],
    createdAt: "2025-01-20T10:00:00Z",
  }),

  // 12. Other - Under Review
  createCampaignWithReach({
    id: "camp-12-broadband",
    title: "Municipal open-access fiber for rural communities",
    category: "Other",
    creatorName: "Elena Rostova (Broadband Advocate)",
    creatorType: "individual",
    summary:
      "Over 4,500 rural households pay $110/month for dial-up speeds. We are preparing an educational ad push for the county broadband referendum.",
    coverImageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1000&auto=format&fit=crop&q=80",
    status: "submitted",
    fundingGoal: 3000,
    amountRaised: 0,
    deadline: "2025-06-30T00:00:00Z",
    adHeadline: "Fast, reliable fiber shouldn't stop at the city line.",
    adDescription: "See how community-owned open fiber networks lower bills and connect rural classrooms.",
    ctaText: "Read the Fiber Feasibility Study",
    targetLocations: ["Rural County Precincts"],
    targetInterests: ["Telecommunications", "Rural Development", "Education"],
    targetChannels: ["Local News Placements", "Social Feeds"],
    durationDays: 30,
    story: [
      { type: "heading", text: "Left in the Digital Slow Lane" },
      {
        type: "paragraph",
        text: "Commercial telecom providers refused to string fiber lines to communities with fewer than 30 homes per square mile.",
      },
      { type: "stat", value: "4,500", label: "Unserved households in western county district" },
    ],
    sources: [
      { title: "Federal Communications Commission Broadband Map Audit", url: "https://fcc.gov/broadband-map" },
      { title: "County Economic Development Fiber Feasibility Study", url: "https://county.gov/fiber-study" },
    ],
    createdAt: "2025-03-12T09:30:00Z",
  }),
];

export const MOCK_REPORT_SOLAR: CampaignReport = {
  id: "rep-camp-10-solar",
  campaignId: "camp-10-solar",
  campaignTitle: "End punitive utility fees on rooftop solar",
  fundsRaised: 3000,
  adSpend: 2850, // 95% after 5% platform fee
  impressions: 684200,
  clicks: 18940,
  estimatedReach: 342000,
  measuredReach: 371800, // +8.7% above estimate
  ctr: 2.76,
  cpm: 4.16,
  channelBreakdown: {
    "Meta / Instagram Social Feeds": 58,
    "Independent Journalism & Local News": 27,
    "Targeted Search Keyword Placements": 15,
  },
  createdAt: "2025-03-02T10:00:00Z",
};
