from dlx.marc import Auth
from dlx_rest.commands import _field_tag, _marc_diff_preview, _merged


def test_field_tag_alt_label_non_english_maps_to_49x_tags():
    assert _field_tag("altLabel", "en") == "450"
    assert _field_tag("altLabel", "fr") == "493"
    assert _field_tag("altLabel", "es") == "494"
    assert _field_tag("altLabel", "ar") == "495"
    assert _field_tag("altLabel", "zh") == "496"
    assert _field_tag("altLabel", "ru") == "497"


def test_field_tag_other_skos_properties_match_thesaurus_mapping():
    assert _field_tag("prefLabel", "en") == "150"
    assert _field_tag("prefLabel", "fr") == "993"
    assert _field_tag("scopeNote", "en") == "680"
    assert _field_tag("scopeNote", "ru") == "937"
    assert _field_tag("note", "en") == "670"
    assert _field_tag("note", "zh") == "696"
    assert _field_tag("historyNote", "en") == "688"


def test_marc_diff_preview_shows_added_and_removed_lines():
    existing = Auth()
    existing.set("150", "a", "Original heading")

    incoming = Auth()
    incoming.set("150", "a", "Updated heading")

    diff = _marc_diff_preview(existing, incoming)

    assert "--- existing" in diff
    assert "+++ incoming" in diff
    assert '-=150  \\\\$aOriginal heading' in diff
    assert '+=150  \\\\$aUpdated heading' in diff


def test_marc_diff_preview_reports_no_change():
    auth = Auth()
    auth.set("150", "a", "Unchanged heading")

    assert _marc_diff_preview(auth, auth) == "No MARC changes detected."


def test_merged_replaces_legacy_alt_label_tag_with_language_specific_tag():
    existing = Auth()
    existing.id = 1
    existing.set("450", "a", "Legacy non-English alt label")
    existing.set("150", "a", "Heading")
    existing.set("035", "a", "T0000001")

    incoming = Auth()
    incoming.id = 1
    incoming.set("150", "a", "Heading")
    incoming.set("495", "a", "Updated alt label")
    incoming.set("035", "a", "https://example.org/concept/123")

    merged = _merged(existing, incoming)

    assert merged.get_values("450", "a") == []
    assert merged.get_values("495", "a") == ["Updated alt label"]


def test_merged_preserves_existing_tcode_when_replacing_035():
    existing = Auth()
    existing.id = 1
    existing.set("035", "a", "https://example.org/old")
    existing.set("035", "a", "T0000001")

    incoming = Auth()
    incoming.id = 1
    incoming.set("035", "a", "https://example.org/new")

    merged = _merged(existing, incoming)

    assert "https://example.org/new" in merged.get_values("035", "a")
    assert "T0000001" in merged.get_values("035", "a")
