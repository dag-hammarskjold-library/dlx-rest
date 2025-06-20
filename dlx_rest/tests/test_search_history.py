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

class TestSearchHistoryModel:
    """Test the User model search history methods"""
    
    def test_add_search_term_new(self, users):
        """Test adding a new search term"""
        user = User.objects.get(email='test_user@un.org')
        initial_count = len(user.search_history)
        
        user.add_search_term("test search")
        
        assert len(user.search_history) == initial_count + 1
        assert user.search_history[-1].term == "test search"
        assert isinstance(user.search_history[-1].datetime, datetime)
    
    def test_add_search_term_duplicate(self, users):
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
    
    def test_get_search_history_ordering(self, users):
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
    
    def test_delete_search_term(self, users):
        """Test deleting a specific search term"""
        user = User.objects.get(email='test_user@un.org')
        
        # Add a term
        user.add_search_term("to delete")
        initial_count = len(user.search_history)
        
        # Delete the term
        user.delete_search_term("to delete")
        
        assert len(user.search_history) == initial_count - 1
        
    
    def test_delete_search_term_nonexistent(self, users):
        """Test deleting a non-existent search term"""
        user = User.objects.get(email='test_user@un.org')
        initial_count = len(user.search_history)
        
        # Try to delete non-existent term
        user.delete_search_term("non-existent")
        
        # Should not change the count
        assert len(user.search_history) == initial_count
    
    def test_clear_search_history(self, users):
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
        """Test getting search history when authenticated"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Add some search history first
        user = User.objects.get(email=username)
        user.add_search_term("test search 1")
        user.add_search_term("test search 2")
        
        # Get search history
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert isinstance(data, list)
        assert len(data) >= 2
        
        # Check structure of returned data
        for entry in data:
            assert 'id' in entry
            assert 'term' in entry
            assert 'datetime' in entry
            assert isinstance(entry['id'], str)
            assert isinstance(entry['term'], str)
            assert isinstance(entry['datetime'], str)
    
    def test_get_search_history_empty(self, client, default_users):
        """Test getting search history when user has no history"""
        # Create credentials for a user with no search history
        username = default_users['non-admin']['email']
        password = default_users['non-admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Clear any existing history
        user = User.objects.get(email=username)
        user.clear_search_history()
        
        # Get search history
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_post_search_history_valid(self, client, default_users):
        """Test adding a valid search term"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Add search term
        term_data = {"term": "new search term"}
        res = client.post(
            f'{API}/search-history',
            data=json.dumps(term_data),
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
        )
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert data['term'] == "new search term"
        assert 'id' in data
        assert 'datetime' in data
        
        # Verify it was added to the database
        user = User.objects.get(email=username)
        assert any(entry.term == "new search term" for entry in user.search_history)
    
    def test_post_search_history_duplicate(self, client, default_users):
        """Test adding a duplicate search term updates timestamp"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Add term first time
        term_data = {"term": "duplicate term"}
        res1 = client.post(
            f'{API}/search-history',
            data=json.dumps(term_data),
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
        )
        data1 = json.loads(res1.data)
        
        # Add same term again
        res2 = client.post(
            f'{API}/search-history',
            data=json.dumps(term_data),
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
        )
        data2 = json.loads(res2.data)
        
        assert res1.status_code == 200
        assert res2.status_code == 200
        assert data1['term'] == data2['term']
        # The datetime should be different (updated)
        assert data1['datetime'] != data2['datetime']
    
    def test_delete_search_history_all(self, client, default_users):
        """Test clearing all search history"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Add some search history first
        user = User.objects.get(email=username)
        user.add_search_term("term 1")
        user.add_search_term("term 2")
        
        # Clear all history
        res = client.delete(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert data['message'] == 'Search history cleared'
        
        # Verify it was cleared in the database
        user = User.objects.get(email=username)
        assert len(user.search_history) == 0
    
    def test_delete_search_history_item_valid(self, client, default_users):
        """Test deleting a specific search history item"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Add search history
        user = User.objects.get(email=username)
        user.add_search_term("term to delete")
        user.add_search_term("term to keep")
        
        # Get the history to find the ID
        history = user.get_search_history()
        term_to_delete = next(entry for entry in history if entry.term == "term to delete")
        delete_id = str(history.index(term_to_delete))
        
        # Delete the specific item
        res = client.delete(f'{API}/search-history/{delete_id}', headers={"Authorization": f"Basic {credentials}"})
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert data['message'] == 'Search history deleted'
        
        # Verify it was deleted from database
        user = User.objects.get(email=username)
        assert not any(entry.term == "term to delete" for entry in user.search_history)
        assert any(entry.term == "term to keep" for entry in user.search_history)
    
    def test_search_history_special_characters(self, client, default_users):
        """Test search history with special characters and unicode"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Test various special characters and unicode
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
            # Add the term
            term_data = {"term": term}
            res = client.post(
                f'{API}/search-history',
                data=json.dumps(term_data),
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/json"
                }
            )
            
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data['term'] == term
    
    def test_search_history_max_length(self, client, default_users):
        """Test search history with maximum length term"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Test with maximum allowed length (500 characters)
        max_term = "a" * 500
        term_data = {"term": max_term}
        res = client.post(
            f'{API}/search-history',
            data=json.dumps(term_data),
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
        )
        
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['term'] == max_term
    
    def test_search_history_ordering_consistency(self, client, default_users):
        """Test that search history maintains consistent ordering"""
        # Create credentials
        username = default_users['admin']['email']
        password = default_users['admin']['password']
        credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
        
        # Clear existing history
        user = User.objects.get(email=username)
        user.clear_search_history()
        
        # Add terms in sequence
        terms = ["first", "second", "third", "fourth", "fifth"]
        for term in terms:
            term_data = {"term": term}
            res = client.post(
                f'{API}/search-history',
                data=json.dumps(term_data),
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/json"
                }
            )
            assert res.status_code == 200
        
        # Get history and verify order (newest first)
        res = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {credentials}"})
        data = json.loads(res.data)
        
        assert res.status_code == 200
        assert len(data) == 5
        
        # Should be in reverse order (newest first)
        assert data[0]['term'] == "fifth"
        assert data[1]['term'] == "fourth"
        assert data[2]['term'] == "third"
        assert data[3]['term'] == "second"
        assert data[4]['term'] == "first"
    
    def test_search_history_multiple_users(self, client, default_users):
        """Test that search history is isolated per user"""
        # Create credentials for two different users
        admin_username = default_users['admin']['email']
        admin_password = default_users['admin']['password']
        admin_credentials = b64encode(bytes(f"{admin_username}:{admin_password}", "utf-8")).decode("utf-8")
        
        non_admin_username = default_users['non-admin']['email']
        non_admin_password = default_users['non-admin']['password']
        non_admin_credentials = b64encode(bytes(f"{non_admin_username}:{non_admin_password}", "utf-8")).decode("utf-8")
        
        # Add search terms for both users
        admin_term = {"term": "admin search"}
        non_admin_term = {"term": "non-admin search"}
        
        # Add to admin user
        res1 = client.post(
            f'{API}/search-history',
            data=json.dumps(admin_term),
            headers={
                "Authorization": f"Basic {admin_credentials}",
                "Content-Type": "application/json"
            }
        )
        assert res1.status_code == 200
        
        # Add to non-admin user
        res2 = client.post(
            f'{API}/search-history',
            data=json.dumps(non_admin_term),
            headers={
                "Authorization": f"Basic {non_admin_credentials}",
                "Content-Type": "application/json"
            }
        )
        assert res2.status_code == 200
        
        # Get history for admin user
        res3 = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {admin_credentials}"})
        admin_history = json.loads(res3.data)
        
        # Get history for non-admin user
        res4 = client.get(f'{API}/search-history', headers={"Authorization": f"Basic {non_admin_credentials}"})
        non_admin_history = json.loads(res4.data)
        
        # Verify isolation
        admin_terms = [entry['term'] for entry in admin_history]
        non_admin_terms = [entry['term'] for entry in non_admin_history]
        
        assert "admin search" in admin_terms
        assert "non-admin search" not in admin_terms
        assert "non-admin search" in non_admin_terms
        assert "admin search" not in non_admin_terms 