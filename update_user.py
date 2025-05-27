from dlx_rest.app import app
from dlx_rest.models import User, SearchHistoryEntry

def update_user():
    try:
        # Get the user
        user = User.objects.get(email='eric.attere@un.org')
        print(f'Found user: {user.email}')
        
        # Initialize search_history if it doesn't exist
        if not hasattr(user, 'search_history'):
            user.search_history = []
            user.save()
            print('Initialized search_history field')
        
        print(f'Current search_history: {user.search_history}')
        
    except Exception as e:
        print(f'Error: {str(e)}')

if __name__ == '__main__':
    update_user() 