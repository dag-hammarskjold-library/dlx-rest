from flask import jsonify, request
from flask_login import login_required, current_user
from dlx_rest.models import User
from dlx_rest.app import app
import datetime

@app.route('/api/search-history', methods=['GET'])
@login_required
def get_search_history():
    """Get search history for current user"""
    user = User.objects.get(email=current_user.email)
    history = user.get_search_history()
    return jsonify([{
        'id': str(i),  # Using index as ID since entries are embedded
        'term': h.term,
        'datetime': h.datetime.isoformat()
    } for i, h in enumerate(history)])

@app.route('/api/search-history', methods=['POST'])
@login_required
def add_search_history():
    """Add new search term to history"""
    data = request.get_json()
    term = data.get('term')
    if not term:
        return jsonify({'error': 'Term is required'}), 400
    
    user = User.objects.get(email=current_user.email)
    user.add_search_term(term)
    
    # Get the updated history to return
    history = user.get_search_history()
    latest_entry = next((h for h in history if h.term == term), None)
    
    return jsonify({
        'id': str(history.index(latest_entry)),
        'term': latest_entry.term,
        'datetime': latest_entry.datetime.isoformat()
    })

@app.route('/api/search-history/<id>', methods=['DELETE'])
@login_required
def delete_search_history(id):
    """Delete a specific search history entry"""
    try:
        user = User.objects.get(email=current_user.email)
        history = user.get_search_history()
        if 0 <= int(id) < len(history):
            term_to_delete = history[int(id)].term
            user.delete_search_term(term_to_delete)
            return jsonify({'message': 'Search history deleted'})
        return jsonify({'error': 'Search history not found'}), 404
    except:
        return jsonify({'error': 'Search history not found'}), 404

@app.route('/api/search-history', methods=['DELETE'])
@login_required
def clear_search_history():
    """Clear all search history for current user"""
    user = User.objects.get(email=current_user.email)
    user.clear_search_history()
    return jsonify({'message': 'Search history cleared'}) 