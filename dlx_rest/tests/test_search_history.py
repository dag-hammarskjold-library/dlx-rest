import os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest
import json
from datetime import datetime
from base64 import b64encode
from dlx_rest.models import User, SearchHistoryEntry
from dlx_rest.app import app
from dlx_rest.config import Config

API = 'http://localhost/api'

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'

def check_response(response):
    """Helper function to check API response format"""
    assert response.status_code in [200, 201, 204, 400, 403, 404, 422, 500]
    if response.status_code in [200, 201]:
        data = json.loads(response.data)
        assert '_meta' in data
        assert '_links' in data
        return data
    return None

def get_credentials(user):
    return b64encode(bytes(f"{user['email']}:{user['password']}", "utf-8")).decode("utf-8")

def ensure_user(email, password):
    """Ensure a user exists in the database."""
    if not User.objects(email=email):
        user = User(email=email)
        user.set_password(password)
        user.save()
    return User.objects.get(email=email)

def clear_search_history(email):
    user = User.objects.get(email=email)
    user.clear_search_history()

def add_search_term(client, credentials, term):
    return client.post(
        f'{API}/search-history',
        data=json.dumps({"term": term}),
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json"
        }
    )

class TestSearchHistoryModel:
    """Test the User model search history methods"""
    
    def test_add_search_term_new(self):
        """Test adding a new search term"""
        user = User.objects.get(email='test_user@un.org')
        initial_count = len(user.search_history)
        
        user.add_search_term("test search")
        
        assert len(user.search_history) == initial_count + 1
        assert user.search_history[-1].term == "test search"
        assert isinstance(user.search_history[-1].datetime, datetime)
    
    def test_add_search_term_duplicate(self):
        """Test adding a duplicate search term updates timestamp"""
        user = User.objects.get(email='test_user@un.org')
        
        # Add term first time
        user.add_search_term("duplicate test")
        first_datetime = user.search_history[-1].datetime
        
        # Add same term again
        user.add_search_term("duplicate test")
        
        # Should have same number of entries (no duplicate added)
        assert len([entry for entry in user.search_history if entry.term == "duplicate test"]) == 1
        # But datetime should be updated
        assert user.search_history[-1].datetime > first_datetime
    
    def test_get_search_history_ordering(self):
        """Test that search history is returned in descending order by datetime"""
        user = User.objects.get(email='test_user@un.org')
        
        # Add multiple terms
        user.add_search_term("first search")
        user.add_search_term("second search")
        user.add_search_term("third search")
        
        history = user.get_search_history()
        
        # Should be sorted by datetime descending (newest first)
        assert len(history) >= 3
        assert history[0].datetime >= history[1].datetime
        assert history[1].datetime >= history[2].datetime
    
    def test_delete_search_term(self):
        """Test deleting a specific search term"""
        user = User.objects.get(email='test_user@un.org')
        
        # Add a term
        user.add_search_term("to delete")
        initial_count = len(user.search_history)
        
        # Delete the term
        user.delete_search_term("to delete")
        
        assert len(user.search_history) == initial_count - 1
        
    
    def test_delete_search_term_nonexistent(self):
        """Test deleting a non-existent search term"""
        user = User.objects.get(email='test_user@un.org')
        initial_count = len(user.search_history)
        
        # Try to delete non-existent term
        user.delete_search_term("non-existent")
        
        # Should not change the count
        assert len(user.search_history) == initial_count
    
    def test_clear_search_history(self):
        """Test clearing all search history"""
        user = User.objects.get(email='test_user@un.org')
        
        # Add some terms
        user.add_search_term("term 1")
        user.add_search_term("term 2")
        user.add_search_term("term 3")
        
        # Clear history
        user.clear_search_history()
        
        assert len(user.search_history) == 0

class TestSearchHistoryAPI:
    """Test the search history API endpoints"""

    def test_get_search_history_authenticated(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        # Add some search history first
        add_search_term(client, credentials, "test search 1")
        add_search_term(client, credentials, "test search 2")

        # Get search history
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()

        assert res.status_code == 200
        assert isinstance(data, list)
        assert len(data) >= 2
        for entry in data:
            assert 'id' in entry
            assert 'term' in entry
            assert 'datetime' in entry
            assert isinstance(entry['id'], str)
            assert isinstance(entry['term'], str)
            assert isinstance(entry['datetime'], str)

    def test_get_search_history_empty(self, client, default_users):
        user = default_users['bib-admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()

        assert res.status_code == 200
        assert isinstance(data, list)
        assert len(data) == 0

    def test_post_search_history_valid(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        term = "new search term"
        res = add_search_term(client, credentials, term)
        data = res.get_json()

        assert res.status_code == 200
        assert data['term'] == term
        assert 'id' in data
        assert 'datetime' in data

        # Verify it was added to the database
        db_user = User.objects.get(email=user['email'])
        assert any(entry.term == term for entry in db_user.search_history)

    def test_post_search_history_duplicate(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        term = "duplicate term"
        res1 = add_search_term(client, credentials, term)
        data1 = res1.get_json()
        res2 = add_search_term(client, credentials, term)
        data2 = res2.get_json()

        assert res1.status_code == 200
        assert res2.status_code == 200
        assert data1['term'] == data2['term']
        assert data1['datetime'] != data2['datetime']

    def test_delete_search_history_all(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        add_search_term(client, credentials, "term 1")
        add_search_term(client, credentials, "term 2")

        res = client.delete(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()

        assert res.status_code == 200
        assert data['message'] == 'Search history cleared'

        db_user = User.objects.get(email=user['email'])
        assert len(db_user.search_history) == 0

    def test_delete_search_history_item_valid(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        add_search_term(client, credentials, "term to delete")
        add_search_term(client, credentials, "term to keep")

        # Get the history to find the ID
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()
        term_to_delete = next(entry for entry in data if entry['term'] == "term to delete")
        delete_id = term_to_delete['id']

        # Delete the specific item
        res = client.delete(f'{API}/search-history/{delete_id}', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()

        assert res.status_code == 200
        assert data['message'] == 'Search history deleted'

        # Verify it was deleted from database
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()
        assert not any(entry['term'] == "term to delete" for entry in data)
        assert any(entry['term'] == "term to keep" for entry in data)

    def test_search_history_special_characters(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        test_terms = [
            "search with spaces",
            "search-with-hyphens",
            "search_with_underscores",
            "search with 'quotes'",
            "search with \"double quotes\"",
            "search with (parentheses)",
            "search with [brackets]",
            "search with {braces}",
            "search with @symbols",
            "search with #hashtags",
            "search with $dollar signs",
            "search with %percent signs",
            "search with &ampersands",
            "search with *asterisks",
            "search with +plus signs",
            "search with =equals signs",
            "search with /forward slashes",
            "search with \\backslashes",
            "search with |pipes",
            "search with ~tildes",
            "search with `backticks",
            "search with !exclamation marks",
            "search with ?question marks",
            "search with .dots",
            "search with ,commas",
            "search with ;semicolons",
            "search with :colons",
            "search with <less than",
            "search with >greater than",
            "search with unicode: éñüß",
            "search with emoji: 🚀📚🔍",
            "search with numbers: 1234567890",
            "search with mixed: Test123!@#$%^&*()",
            "very long search term that should still work even if it's quite long and contains many different types of characters and spaces and punctuation marks and numbers and symbols and unicode characters like éñüß and emojis like 🚀📚🔍 and various other things that might be used in real search queries",
        ]

        for term in test_terms:
            res = add_search_term(client, credentials, term)
            assert res.status_code == 200
            data = res.get_json()
            assert data['term'] == term

    def test_search_history_max_length(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        max_term = "a" * 500
        res = add_search_term(client, credentials, max_term)
        assert res.status_code == 200
        data = res.get_json()
        assert data['term'] == max_term

    def test_search_history_ordering_consistency(self, client, default_users):
        user = default_users['admin']
        credentials = get_credentials(user)
        ensure_user(user['email'], user['password'])
        clear_search_history(user['email'])

        terms = ["first", "second", "third", "fourth", "fifth"]
        for term in terms:
            res = add_search_term(client, credentials, term)
            assert res.status_code == 200

        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = res.get_json()

        assert res.status_code == 200
        assert len(data) == 5
        assert data[0]['term'] == "fifth"
        assert data[1]['term'] == "fourth"
        assert data[2]['term'] == "third"
        assert data[3]['term'] == "second"
        assert data[4]['term'] == "first"

    def test_search_history_multiple_users(self, client, default_users):
        admin_user = default_users['admin']
        non_admin_user = default_users['bib-admin']
        admin_credentials = get_credentials(admin_user)
        non_admin_credentials = get_credentials(non_admin_user)
        ensure_user(admin_user['email'], admin_user['password'])
        ensure_user(non_admin_user['email'], non_admin_user['password'])
        clear_search_history(admin_user['email'])
        clear_search_history(non_admin_user['email'])

        # Add search terms for both users
        add_search_term(client, admin_credentials, "admin search")
        add_search_term(client, non_admin_credentials, "non-admin search")

        # Get history for admin user
        res_admin = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {admin_credentials}"})
        admin_history = res_admin.get_json()

        # Get history for non-admin user
        res_non_admin = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {non_admin_credentials}"})
        non_admin_history = res_non_admin.get_json()

        admin_terms = [entry['term'] for entry in admin_history]
        non_admin_terms = [entry['term'] for entry in non_admin_history]

        assert "admin search" in admin_terms
        assert "non-admin search" not in admin_terms
        assert "non-admin search" in non_admin_terms
        assert "admin search" not in non_admin_terms