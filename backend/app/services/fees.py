from app.config import settings


def calculate_fees(amount: float) -> dict:
    """
    Computes platform fee (5%) and payment processing fee (2.9% + $0.30).
    Backers see an itemized receipt explaining how every dollar is allocated to ad delivery.
    """
    amount = float(amount)
    platform_fee = round(amount * settings.PLATFORM_FEE_PCT, 2)
    processing_fee = round(amount * settings.PROCESSING_FEE_PCT + settings.PROCESSING_FEE_FIXED, 2)
    total_charged = round(amount + processing_fee, 2)
    available_for_ads = round(amount - platform_fee, 2)

    return {
        "amount": round(amount, 2),
        "platform_fee": platform_fee,
        "platform_fee_percent": f"{int(settings.PLATFORM_FEE_PCT * 100)}%",
        "processing_fee": processing_fee,
        "processing_fee_formula": f"{settings.PROCESSING_FEE_PCT * 100}% + ${settings.PROCESSING_FEE_FIXED:.2f}",
        "total_charged": total_charged,
        "available_for_ads": available_for_ads,
        "disclaimer": "Contributions fund targeted advertising and distribution of the campaign message beyond the creator's network. They do not constitute direct charitable donations to any organization or individual."
    }
