from app.config import settings


def estimate_reach(ad_dollars: float) -> dict:
    """
    Computes low, mid, and high audience reach ranges from allocated ad dollars.
    Always clearly flagged as an estimate, never a guaranteed outcome.
    """
    ad_dollars = max(0.0, float(ad_dollars))
    mid_estimate = int(ad_dollars * settings.REACH_PER_DOLLAR)
    low_estimate = int(mid_estimate * settings.REACH_LOW_FACTOR)
    high_estimate = int(mid_estimate * settings.REACH_HIGH_FACTOR)

    return {
        "ad_dollars": round(ad_dollars, 2),
        "reach_per_dollar": settings.REACH_PER_DOLLAR,
        "low": low_estimate,
        "mid": mid_estimate,
        "high": high_estimate,
        "formatted_range": f"{low_estimate:,} – {high_estimate:,} people",
        "disclaimer": "Reach is estimated based on current digital ad platform delivery rates. Actual reach depends on inventory availability, regional auction dynamics, and campaign creative performance."
    }
