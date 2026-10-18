import sys
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.campaign import Campaign, Source, CampaignUpdate
from app.models.contribution import Contribution
from app.models.notification import Notification
from app.models.report import Report
from app.routers.auth import hash_password


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data if any
    print("Clearing prior seed data...")
    db.query(Report).delete()
    db.query(Notification).delete()
    db.query(Contribution).delete()
    db.query(CampaignUpdate).delete()
    db.query(Source).delete()
    db.query(Campaign).delete()
    db.query(User).delete()
    db.commit()

    print("Creating demo users...")
    admin_user = User(
        email="admin@amplify.org",
        password_hash=hash_password("admin123"),
        display_name="Sarah Chen (Platform Reviewer)",
        is_admin=True
    )
    creator_user = User(
        email="creator@amplify.org",
        password_hash=hash_password("creator123"),
        display_name="Maya Lin (Civic Advocate)",
        is_admin=False
    )
    backer_user = User(
        email="backer@amplify.org",
        password_hash=hash_password("backer123"),
        display_name="David Patel",
        is_admin=False
    )
    db.add_all([admin_user, creator_user, backer_user])
    db.commit()

    print("Creating campaigns with rich stories and sources...")
    now = datetime.utcnow()

    campaigns_data = [
        {
            "id": "camp-water-01",
            "creator_id": creator_user.id,
            "title": "Clean drinking water in every public school",
            "category": "Health",
            "creator_name": "Maya Lin & Safe Schools Coalition",
            "summary": "Old pipes in 1,200 district schools test above federal lead limits. We are putting this evidence in front of parents and school boards across the county.",
            "cover_image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 3500.0,
            "amount_raised": 2625.0,  # 75% funded
            "status": "available_for_funding",
            "deadline": now + timedelta(days=12),
            "ad_headline": "Is your child's school water lead-free?",
            "ad_description": "New testing revealed elevated lead levels in local schools. Read the state data.",
            "cta_text": "Check Your School",
            "reach_settings": {
                "locations": ["Tri-County Metro Area"],
                "interests": ["Parents", "Education Policy", "Local Health"],
                "channels": ["Instagram Feeds", "Local News Sites", "Search"],
                "duration_days": 21
            },
            "story": [
                {"type": "heading", "text": "The Water Crisis Hiding in Classroom Faucets"},
                {"type": "paragraph", "text": "Over the past 18 months, voluntary district water sampling uncovered lead levels exceeding 15 parts per billion in more than 340 water fountains and cafeteria sinks across 42 elementary and middle schools."},
                {"type": "stat", "value": "15 ppb", "label": "Lead concentration threshold exceeded in 340+ school fixtures"},
                {"type": "heading", "text": "Why Community Amplification?"},
                {"type": "paragraph", "text": "The school board's internal audit was quietly buried in meeting annexes. By pooling ad distribution dollars, we bypass bureaucratic silence and deliver targeted educational ads directly to parents, teachers, and school board voters."},
                {"type": "image", "url": "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80", "caption": "Public school water fountains awaiting certified filtration installation.", "credit": "Tri-County Water Coalition"},
                {"type": "stat", "value": "24,000+", "label": "Students attending affected facilities"}
            ],
            "sources": [
                {"title": "State Dept of Health School Lead Testing Register 2024", "url": "https://health.state.gov/reports/water-quality-schools"},
                {"title": "EPA National Primary Drinking Water Regulations", "url": "https://epa.gov/ground-water-and-drinking-water"},
                {"title": "Independent Environmental Laboratory Audit Report", "url": "https://enviro-audit-labs.org/findings/2024"}
            ]
        },
        {
            "id": "camp-transit-02",
            "creator_id": creator_user.id,
            "title": "Redraw the bus network around where people work",
            "category": "Public Policy",
            "creator_name": "Regional Riders Alliance",
            "summary": "Our bus routes have not changed since 1984, yet major job centers moved 15 miles east. Let us amplify data-backed transit proposals before the city council vote.",
            "cover_image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 2400.0,
            "amount_raised": 2160.0,  # 90% funded
            "status": "available_for_funding",
            "deadline": now + timedelta(days=5),
            "ad_headline": "Why does your 20-minute drive take 90 minutes by bus?",
            "ad_description": "Our transit map is 40 years old. See how direct routing connects 45,000 workers.",
            "cta_text": "View Proposed Map",
            "reach_settings": {
                "locations": ["Eastside Industrial Park", "Downtown Transit Corridor"],
                "interests": ["Commuters", "Urban Planning", "Public Transit"],
                "channels": ["Mobile Ad Network", "Commuter Apps"],
                "duration_days": 14
            },
            "story": [
                {"type": "heading", "text": "A Transit System Stranded in 1984"},
                {"type": "paragraph", "text": "Forty years ago, heavy manufacturing concentrated along the central riverfront. Today, over 62% of service and logistics jobs are located on the eastern tech and warehouse corridor—where zero direct bus routes run."},
                {"type": "stat", "value": "78 min", "label": "Average transit commute vs 22 min drive"},
                {"type": "paragraph", "text": "Shift workers are forced to transfer three times, turning standard 8-hour days into 12-hour ordeals. This campaign finances targeted digital billboards and social placements reaching 180,000 regional commuters to mandate a comprehensive route realignment in the upcoming council session."}
            ],
            "sources": [
                {"title": "Metropolitan Transportation Authority 2023 Route Density Study", "url": "https://mta.gov/studies/density-2023"},
                {"title": "Regional Chamber of Commerce Shift Worker Commute Survey", "url": "https://regionalchamber.org/workforce-transit"}
            ]
        },
        {
            "id": "camp-repair-03",
            "creator_id": None,
            "title": "Let farmers repair the equipment they own",
            "category": "Economic Policy",
            "creator_name": "Heartland Family Farmers Union",
            "summary": "Tractor manufacturers lock diagnostics software behind dealer paywalls, causing week-long harvest delays. We are putting the Right to Repair message in front of state legislators.",
            "cover_image_url": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 5000.0,
            "amount_raised": 4850.0,  # 97% funded
            "status": "available_for_funding",
            "deadline": now + timedelta(days=8),
            "ad_headline": "Farmers shouldn't wait 10 days for a software unlock.",
            "ad_description": "Support the Agricultural Right to Repair Act. See how software locks hurt independent agriculture.",
            "cta_text": "Read Farmer Testimonies",
            "reach_settings": {
                "locations": ["Rural Districts", "State Capital Metro"],
                "interests": ["Agriculture", "Small Business", "Property Rights"],
                "channels": ["Rural Radio Digital Feeds", "Facebook Feeds"],
                "duration_days": 30
            },
            "story": [
                {"type": "heading", "text": "Locked Out of the Machines They Paid $400,000 For"},
                {"type": "paragraph", "text": "Modern tractors run sophisticated digital engine controllers. When an emissions sensor fails during planting season, farmers cannot install a simple $40 replacement part without an authorized dealer technician typing in a proprietary decryption code."},
                {"type": "stat", "value": "$3,200", "label": "Average dealership service call fee for a 10-minute software reset"},
                {"type": "paragraph", "text": "We are airing targeted video messages in farming county seats and state legislative districts demanding the passage of the Agricultural Fair Repair Act."}
            ],
            "sources": [
                {"title": "Federal Trade Commission: Nixing the Fix Report", "url": "https://ftc.gov/reports/nixing-the-fix"},
                {"title": "American Farm Bureau Federation Survey on Repair Delays", "url": "https://fb.org/research/repair-costs-2023"}
            ]
        },
        {
            "id": "camp-shelter-04",
            "creator_id": None,
            "title": "Keep the winter shelter open past 7am",
            "category": "Community",
            "creator_name": "Downtown Compassion Network",
            "summary": "Ejection at dawn into sub-zero weather causes frostbite and medical strain. Community-funded ads will show civic leaders the financial and human case for 24-hour winter warming centers.",
            "cover_image_url": "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 2800.0,
            "amount_raised": 1120.0,  # 40% funded
            "status": "available_for_funding",
            "deadline": now + timedelta(days=19),
            "ad_headline": "7:00 AM. 14°F. Nowhere to go.",
            "ad_description": "Closing emergency shelters at dawn spikes hypothermia admissions. See the hospital data.",
            "cta_text": "See Shelter Impact",
            "reach_settings": {
                "locations": ["Downtown", "Civic Center District"],
                "interests": ["Civic Affairs", "Healthcare Workers", "Urban Policy"],
                "channels": ["Instagram", "Digital Display"],
                "duration_days": 21
            },
            "story": [
                {"type": "heading", "text": "The Deadly Dawn Ejection Rule"},
                {"type": "paragraph", "text": "Every winter morning at 7:00 AM, more than 160 unhoused individuals are mandated to leave the city's primary warming center regardless of blizzard warnings or sub-freezing temperatures."},
                {"type": "stat", "value": "14°F", "label": "Average January dawn temperature in downtown corridor"},
                {"type": "paragraph", "text": "County emergency rooms treat an average of 42 cases of severe frostbite every week throughout January and February—costing taxpayers far more than keeping warming centers staffed throughout the daytime."}
            ],
            "sources": [
                {"title": "County General Hospital Emergency Admission Registry", "url": "https://countyhealth.org/emergency-reports"},
                {"title": "National Coalition for the Homeless: Winter Survival Guidelines", "url": "https://nationalhomeless.org/winter-safety"}
            ]
        },
        {
            "id": "camp-library-05",
            "creator_id": None,
            "title": "Restore weekend hours at suburban branch libraries",
            "category": "Education",
            "creator_name": "Friends of Public Libraries",
            "summary": "Budget cuts closed 14 branch libraries on Saturdays and Sundays, taking away free internet and study spaces for working families.",
            "cover_image_url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 1800.0,
            "amount_raised": 450.0,  # 25% funded
            "status": "available_for_funding",
            "deadline": now + timedelta(days=25),
            "ad_headline": "Where do students without home Wi-Fi study on weekends?",
            "ad_description": "Weekend library closures cut off thousands of children from digital learning resources.",
            "cta_text": "Support Weekend Access",
            "reach_settings": {
                "locations": ["Suburban School Districts"],
                "interests": ["Parents", "Libraries", "Youth Education"],
                "channels": ["Social Media", "Search"],
                "duration_days": 30
            },
            "story": [
                {"type": "heading", "text": "The Digital Divide Closes on Weekends"},
                {"type": "paragraph", "text": "When school doors lock on Friday afternoon, over 8,000 households across the suburban periphery have no broadband internet access. Branch libraries were their sole lifeline for college applications and homework."}
            ],
            "sources": [
                {"title": "Urban Libraries Council Digital Equity Brief", "url": "https://urbanlibraries.org/digital-divide"},
                {"title": "District Public School Homework Broadband Access Survey", "url": "https://schools.org/equity-survey"}
            ]
        },
        {
            "id": "camp-forest-06",
            "creator_id": creator_user.id,
            "title": "Protect the Old Growth Watershed from clear-cutting",
            "category": "Environment",
            "creator_name": "Cascadia Watershed Protection",
            "summary": "A 400-acre timber sale threatens the municipal water source for 65,000 residents. Ads will run across downstream voter districts.",
            "cover_image_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 4200.0,
            "amount_raised": 4200.0,  # 100% funded
            "status": "promoting",  # In active advertising distribution!
            "deadline": now + timedelta(days=10),
            "ad_headline": "Your tap water begins in these 400 acres.",
            "ad_description": "Clear-cutting steep watershed slopes increases sediment run-off by 300%. Read the hydrologist study.",
            "cta_text": "Protect Our Water",
            "reach_settings": {
                "locations": ["Downstream Municipal Water Districts"],
                "interests": ["Conservation", "Clean Water", "Local Government"],
                "channels": ["Instagram Feeds", "Local News Outlets", "Digital Billboards"],
                "duration_days": 28
            },
            "story": [
                {"type": "heading", "text": "400 Acres That Filter Drinking Water for 65,000 People"},
                {"type": "paragraph", "text": "The Upper Basin Timber Sale permits clear-cutting on 35-degree slopes directly above the municipal reservoir intake pipe."},
                {"type": "stat", "value": "300%", "label": "Projected increase in sediment load post logging"}
            ],
            "sources": [
                {"title": "Hydrology & Sedimentation Study of Upper Basin", "url": "https://watershed-science.org/reports/upper-basin"},
                {"title": "US Forest Service Environmental Assessment Docket #884", "url": "https://fs.usda.gov/projects/884"}
            ]
        },
        {
            "id": "camp-solar-07",
            "creator_id": None,
            "title": "End punitive utility fees on residential rooftop solar",
            "category": "Environment",
            "creator_name": "Clean Energy Access Coalition",
            "summary": "Monopoly electric utilities just filed a $65/month fixed grid penalty on families with rooftop solar panels.",
            "cover_image_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 3000.0,
            "amount_raised": 3000.0,  # 100% funded
            "status": "completed",  # Completed campaign with report!
            "deadline": now - timedelta(days=2),
            "ad_headline": "Why are solar owners being taxed $780 a year?",
            "ad_description": "Utilities want to penalize homeowners who generate clean energy. See the public docket.",
            "cta_text": "Read the Public Filing",
            "reach_settings": {
                "locations": ["Statewide Utility Service Territory"],
                "interests": ["Solar Energy", "Consumer Rights", "Homeownership"],
                "channels": ["Meta Feeds", "Search Ads"],
                "duration_days": 21
            },
            "story": [
                {"type": "heading", "text": "Penalizing Homeowners for Generating Clean Power"},
                {"type": "paragraph", "text": "Under the guise of 'grid modernization', the regional utility proposed an unprecedented monthly surcharge that wipes out the economic payback of rooftop solar installations."}
            ],
            "sources": [
                {"title": "Public Utilities Commission Docket #2024-098", "url": "https://puc.state.gov/dockets/2024-098"},
                {"title": "Consumer Energy Rights Association Policy Brief", "url": "https://consumerenergy.org/rooftop-fairness"}
            ]
        },
        {
            "id": "camp-ai-ethics-08",
            "creator_id": creator_user.id,
            "title": "Mandate AI transparency in automated hiring screenings",
            "category": "Science",
            "creator_name": "Algorithmic Justice Project",
            "summary": "Over 70% of Fortune 500 companies use AI algorithms to reject candidate resumes before any human eyes review them. We demand audit disclosure.",
            "cover_image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80",
            "funding_goal": 4500.0,
            "amount_raised": 0.0,
            "status": "submitted",  # Ready for Reviewer demonstration!
            "deadline": now + timedelta(days=30),
            "ad_headline": "Was your job application rejected by an unchecked bot?",
            "ad_description": "New state bills demand transparency in HR algorithms. Learn what rights you have.",
            "cta_text": "Read the Bill",
            "reach_settings": {
                "locations": ["National"],
                "interests": ["Job Seekers", "Tech Policy", "Workplace Rights"],
                "channels": ["LinkedIn Display", "Social Ads"],
                "duration_days": 30
            },
            "story": [
                {"type": "heading", "text": "The Invisible Gatekeeper Behind Your Job Search"},
                {"type": "paragraph", "text": "Resume parsing models frequently penalize non-traditional employment histories, graduation dates, and cultural keywords without audit oversight."},
                {"type": "stat", "value": "72%", "label": "Large employers deploying automated screening filters"}
            ],
            "sources": [
                {"title": "Equal Employment Opportunity Commission Guidance on AI", "url": "https://eeoc.gov/ai-workplace-guidance"},
                {"title": "MIT Computer Science Lab Algorithmic Bias Audit", "url": "https://csail.mit.edu/research/recruiting-algorithms"}
            ]
        }
    ]

    for cdata in campaigns_data:
        sources_list = cdata.pop("sources", [])
        campaign = Campaign(**cdata)
        db.add(campaign)
        db.flush()

        for s in sources_list:
            db.add(Source(campaign_id=campaign.id, title=s["title"], url=s["url"]))

    db.commit()

    print("Adding sample contributions to campaigns...")
    # Add contributions to water campaign
    water_camp = db.query(Campaign).filter(Campaign.id == "camp-water-01").first()
    c1 = Contribution(
        campaign_id=water_camp.id,
        user_id=backer_user.id,
        amount=100.0,
        platform_fee=5.0,
        processing_fee=3.20,
        total=103.20,
        status="succeeded",
        is_public=False,
        display_name="Anonymous Backer",
        reach_estimate_mid=11400,
        created_at=now - timedelta(days=3)
    )
    c2 = Contribution(
        campaign_id=water_camp.id,
        guest_email="community_parent@gmail.com",
        amount=50.0,
        platform_fee=2.50,
        processing_fee=1.75,
        total=51.75,
        status="succeeded",
        is_public=True,
        display_name="Parent from Lincoln High",
        reach_estimate_mid=5700,
        created_at=now - timedelta(days=2)
    )
    db.add_all([c1, c2])

    print("Creating completed campaign report for solar campaign...")
    solar_camp = db.query(Campaign).filter(Campaign.id == "camp-solar-07").first()
    solar_report = Report(
        campaign_id=solar_camp.id,
        funds_raised=3000.0,
        ad_spend=2850.0,  # after 5% platform fee
        impressions=684200,
        clicks=18940,
        estimated_reach=342000,
        measured_reach=371800,  # 8.7% above initial estimate
        ctr=2.76,
        cpm=4.16,
        channel_breakdown={
            "Meta / Instagram Social Feed Ads": 58,
            "Local News & Consumer Rights Display Networks": 27,
            "Targeted Search Keyword Placements": 15
        },
        created_at=now - timedelta(days=1)
    )
    db.add(solar_report)

    print("Creating in-app activity notifications...")
    notifs = [
        Notification(
            user_id=creator_user.id,
            type="milestone",
            title="75% Funded: School Water Safety",
            body="Your campaign 'Clean drinking water in every public school' just passed $2,600 raised! Ad distribution setup begins soon.",
            campaign_id="camp-water-01",
            is_read=False,
            created_at=now - timedelta(hours=4)
        ),
        Notification(
            user_id=creator_user.id,
            type="promotion",
            title="Ad Promotion Live: Watershed Protection",
            body="Approved ads for 'Protect the Old Growth Watershed' launched across regional channels reaching downstream voters.",
            campaign_id="camp-forest-06",
            is_read=True,
            created_at=now - timedelta(days=1)
        ),
        Notification(
            user_id=None,  # Platform public milestone
            type="report",
            title="Campaign Amplification Complete: Rooftop Solar",
            body="371,800 people reached across the state with utility fee facts! View the verified transparency distribution report.",
            campaign_id="camp-solar-07",
            is_read=False,
            created_at=now - timedelta(days=2)
        )
    ]
    db.add_all(notifs)

    db.commit()
    print("Database seeding successfully completed!")
    db.close()


if __name__ == "__main__":
    seed_database()
