import pytest
from app.services.fees import calculate_fees
from app.services.reach import estimate_reach
from app.services.lifecycle import can_transition, ALLOWED_TRANSITIONS


def test_fee_calculation():
    # Test $100 contribution
    res = calculate_fees(100.0)
    assert res["amount"] == 100.0
    assert res["platform_fee"] == 5.0  # 5%
    assert res["processing_fee"] == 3.20  # 2.9% + $0.30
    assert res["total_charged"] == 103.20
    assert res["available_for_ads"] == 95.0
    assert "not constitute direct charitable donations" in res["disclaimer"]


def test_reach_estimation():
    # Test reach for $100 ad budget
    res = estimate_reach(100.0)
    assert res["reach_per_dollar"] == 120
    assert res["mid"] == 12000
    assert res["low"] == int(12000 * 0.7)
    assert res["high"] == int(12000 * 1.3)
    assert res["low"] < res["mid"] < res["high"]


def test_lifecycle_rules():
    # Legal transitions
    assert can_transition("draft", "submitted")
    assert can_transition("submitted", "approved")
    assert can_transition("submitted", "changes_requested")
    assert can_transition("approved", "available_for_funding")
    assert can_transition("available_for_funding", "goal_reached")
    assert can_transition("goal_reached", "distribution_prep")
    assert can_transition("distribution_prep", "promoting")
    assert can_transition("promoting", "completed")

    # Critical illegal transitions:
    # 1. Draft cannot jump straight to approved
    assert not can_transition("draft", "approved")
    # 2. Goal reached cannot jump directly to promoting (must do distribution_prep first!)
    assert not can_transition("goal_reached", "promoting")
    # 3. Available for funding cannot directly complete
    assert not can_transition("available_for_funding", "completed")
